import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server, type Socket } from 'socket.io'
import { randomBytes } from 'crypto'
import argon2 from 'argon2'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import { parseCookie } from 'cookie'
import { z } from 'zod'
import { initBattle, resolveSinglePlayerTurn } from '../src/engine/battle.js'
import type { BattleState, Character, QueuedSkill, BattlePhase, TeamId } from '../src/types/index.js'
import {
  createSession,
  createUser,
  deleteExpiredSessions,
  deleteSession,
  findUserByUsername,
  getLeaderboardStats,
  getUserBySession,
  initializeDatabase,
  recordMatch,
  recordPvpMatch,
  type AuthenticatedUser,
  type PlayerStats,
  pool,
} from './database.js'

const PORT = Number(process.env.PORT ?? 3001)
const TURN_SECS = 60
const isProduction = process.env.NODE_ENV === 'production'
const SESSION_COOKIE = isProduction ? '__Host-arena_session' : 'arena_session'
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000
const allowedOrigins = (process.env.APP_ORIGIN ?? 'http://localhost:5173,http://127.0.0.1:5173,http://127.0.0.1:5174')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

const credentialsSchema = z.object({
  username: z.string().trim().regex(/^[a-zA-Z0-9_-]{3,20}$/),
  password: z.string().min(12).max(128),
})
const dummyPasswordHash = await argon2.hash(randomBytes(32), {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 3,
  parallelism: 1,
})

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict' as const,
    maxAge: SESSION_TTL_MS,
    path: '/',
  }
}

async function issueSession(res: express.Response, user: AuthenticatedUser) {
  const token = randomBytes(32).toString('base64url')
  await createSession(user.id, token, new Date(Date.now() + SESSION_TTL_MS))
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions())
}

// ─── Room types ───────────────────────────────────────────────────────────────

interface PlayerSlot {
  socketId: string
  userId: string
  slot: 'p1' | 'p2'
  team: Character[] | null
}

interface Room {
  code: string
  p1: PlayerSlot | null
  p2: PlayerSlot | null
  state: BattleState | null
  activeSlot: 'p1' | 'p2'  // whose turn it is
  turnTimer: ReturnType<typeof setTimeout> | null
  resultRecorded: boolean
}

// ─── State ────────────────────────────────────────────────────────────────────

const rooms = new Map<string, Room>()
const socketToRoom = new Map<string, string>()
const socketToUser = new Map<string, AuthenticatedUser>()
const matchQueue: string[] = []  // socket IDs waiting for an auto-match

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  } while (rooms.has(code))
  return code
}

function getSlot(room: Room, socketId: string): PlayerSlot | null {
  if (room.p1?.socketId === socketId) return room.p1
  if (room.p2?.socketId === socketId) return room.p2
  return null
}

function flipForP2(state: BattleState): BattleState {
  const flipPhase = (p: BattlePhase): BattlePhase =>
    p === 'victory' ? 'defeat' : p === 'defeat' ? 'victory' : p
  return {
    ...state,
    player: { ...state.ai,     id: 'player' },
    ai:     { ...state.player, id: 'ai'     },
    playerQueue: state.aiQueue,
    aiQueue:     state.playerQueue,
    phase: flipPhase(state.phase),
  }
}

/** P2 submits targets from their flipped perspective; un-flip before execution. */
function unflipQueue(queue: QueuedSkill[]): QueuedSkill[] {
  return queue.map(q => ({
    ...q,
    targetTeam: (q.targetTeam === 'player' ? 'ai' : 'player') as 'player' | 'ai',
  }))
}

function emit(io: Server, room: Room) {
  if (!room.state) return
  if (room.p1) io.to(room.p1.socketId).emit('state_update', { state: room.state })
  if (room.p2) io.to(room.p2.socketId).emit('state_update', { state: flipForP2(room.state) })
}

function clearTimer(room: Room) {
  if (room.turnTimer) { clearTimeout(room.turnTimer); room.turnTimer = null }
}

function startTurn(io: Server, room: Room) {
  clearTimer(room)
  const active = room.activeSlot === 'p1' ? room.p1 : room.p2
  const other  = room.activeSlot === 'p1' ? room.p2 : room.p1
  if (active) io.to(active.socketId).emit('your_turn',     { timeLeft: TURN_SECS })
  if (other)  io.to(other.socketId).emit('opponents_turn', {})
  room.turnTimer = setTimeout(() => void executeTurn(io, room, []), TURN_SECS * 1000)
}

async function executeTurn(io: Server, room: Room, queue: QueuedSkill[]) {
  if (!room.state) return
  clearTimer(room)

  const teamId: TeamId = room.activeSlot === 'p1' ? 'player' : 'ai'
  const finalQueue = room.activeSlot === 'p2' ? unflipQueue(queue) : queue

  room.state = resolveSinglePlayerTurn(room.state, teamId, finalQueue)
  emit(io, room)

  if (room.state.phase !== 'player_turn') {
    if (!room.resultRecorded && room.p1 && room.p2) {
      room.resultRecorded = true
      const p1Won = room.state.phase === 'victory'
      await recordPvpMatch(p1Won ? room.p1.userId : room.p2.userId, p1Won ? room.p2.userId : room.p1.userId)
    }
    return
  }

  room.activeSlot = room.activeSlot === 'p1' ? 'p2' : 'p1'
  startTurn(io, room)
}

// ─── Server ───────────────────────────────────────────────────────────────────

const app = express()
const http = createServer(app)
const io = new Server(http, {
  cors: { origin: allowedOrigins, credentials: true },
  allowRequest: (req, callback) => {
    const origin = req.headers.origin
    callback(null, !origin || allowedOrigins.includes(origin))
  },
})

// ─── HTTP middleware ──────────────────────────────────────────────────────────

app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(helmet())
app.use(cors({ origin: allowedOrigins, credentials: true, methods: ['GET', 'POST'] }))
app.use(express.json({ limit: '16kb' }))
app.use(cookieParser())
app.use('/auth', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  next()
})
app.use((req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) { next(); return }
  const origin = req.get('origin')
  if (origin && !allowedOrigins.includes(origin)) { res.status(403).json({ error: 'Origin not allowed.' }); return }
  next()
})

// ─── Auth endpoints ───────────────────────────────────────────────────────────

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false })

app.post('/auth/register', authLimiter, async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: 'Username must be 3-20 characters; password must be 12-128 characters.' }); return }
  try {
    const passwordHash = await argon2.hash(parsed.data.password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 3, parallelism: 1 })
    const user = await createUser(parsed.data.username, passwordHash)
    await issueSession(res, user)
    res.status(201).json({ username: user.username })
  } catch (error) {
    if ((error as { code?: string }).code === '23505') { res.status(409).json({ error: 'Username already taken.' }); return }
    throw error
  }
})

app.post('/auth/login', authLimiter, async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body)
  if (!parsed.success) { res.status(401).json({ error: 'Invalid username or password.' }); return }
  const user = await findUserByUsername(parsed.data.username)
  const passwordMatches = await argon2.verify(user?.password_hash ?? dummyPasswordHash, parsed.data.password)
  if (!user || !passwordMatches) {
    res.status(401).json({ error: 'Invalid username or password.' }); return
  }
  await issueSession(res, user)
  res.json({ username: user.username })
})

app.get('/auth/me', async (req, res) => {
  const user = await getUserBySession(req.cookies[SESSION_COOKIE] ?? '')
  if (!user) { res.status(401).json({ error: 'Not authenticated.' }); return }
  res.json({ username: user.username })
})

app.post('/auth/logout', async (req, res) => {
  const token = req.cookies[SESSION_COOKIE] ?? ''
  if (token) await deleteSession(token)
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
  })
  res.json({ ok: true })
})

app.post('/stats/match', async (req, res) => {
  const user = await getUserBySession(req.cookies[SESSION_COOKIE] ?? '')
  const result = req.body?.result as 'win' | 'loss' | undefined
  if (!user) { res.status(401).json({ error: 'Not authenticated.' }); return }
  if (result !== 'win' && result !== 'loss') { res.status(400).json({ error: 'Invalid match result.' }); return }
  await recordMatch(user.id, result)
  res.json({ ok: true })
})

app.get('/leaderboards', async (_req, res) => {
  const eligible = await getLeaderboardStats()
  const byUsername = (a: PlayerStats, b: PlayerStats) => a.username.localeCompare(b.username)
  const top = (compare: (a: PlayerStats, b: PlayerStats) => number) =>
    [...eligible].sort((a, b) => compare(a, b) || byUsername(a, b)).slice(0, 10)

  res.json({
    wins: top((a, b) => b.wins - a.wins || b.bestWinStreak - a.bestWinStreak || b.matchesPlayed - a.matchesPlayed),
    winStreak: top((a, b) => b.bestWinStreak - a.bestWinStreak || b.wins - a.wins || b.matchesPlayed - a.matchesPlayed),
    matchesPlayed: top((a, b) => b.matchesPlayed - a.matchesPlayed || b.wins - a.wins),
    leastLosses: top((a, b) => a.losses - b.losses || b.wins - a.wins || b.matchesPlayed - a.matchesPlayed),
  })
})

app.get('/health', async (_req, res) => {
  await pool.query('SELECT 1')
  res.json({ status: 'ok' })
})

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error)
  res.status(500).json({ error: 'Internal server error.' })
})

// ─── Socket auth middleware ───────────────────────────────────────────────────

io.use((socket, next) => {
  const token = parseCookie(socket.handshake.headers.cookie ?? '')[SESSION_COOKIE]
  void getUserBySession(token ?? '').then(user => {
    if (!user) { next(new Error('not_authenticated')); return }
    socketToUser.set(socket.id, user)
    socket.data.sessionToken = token
    next()
  }).catch(() => next(new Error('not_authenticated')))
})

io.on('connection', (socket: Socket) => {
  console.log(`[+] ${socket.id}`)

  socket.use((_event, next) => {
    void getUserBySession(socket.data.sessionToken as string).then(user => {
      if (user) { next(); return }
      socket.disconnect(true)
      next(new Error('not_authenticated'))
    }).catch(() => {
      socket.disconnect(true)
      next(new Error('not_authenticated'))
    })
  })

  socket.on('find_match', () => {
    if (matchQueue.includes(socket.id)) return
    if (matchQueue.length > 0) {
      const oppId = matchQueue.shift()!
      const opp   = io.sockets.sockets.get(oppId)
      if (!opp?.connected) { matchQueue.push(socket.id); socket.emit('searching'); return }
      const code = generateCode()
      const room: Room = {
        code,
        p1: { socketId: oppId, userId: socketToUser.get(oppId)!.id, slot: 'p1', team: null },
        p2: { socketId: socket.id, userId: socketToUser.get(socket.id)!.id, slot: 'p2', team: null },
        state: null, activeSlot: 'p1', turnTimer: null, resultRecorded: false,
      }
      rooms.set(code, room)
      socketToRoom.set(oppId,     code)
      socketToRoom.set(socket.id, code)
      void opp.join(code)
      void socket.join(code)
      io.to(oppId).emit('match_found',     { code, slot: 'p1', opponentUsername: socketToUser.get(socket.id)?.username ?? 'Opponent' })
      io.to(socket.id).emit('match_found', { code, slot: 'p2', opponentUsername: socketToUser.get(oppId)?.username ?? 'Opponent' })
      console.log(`Ladder match ${code}: ${oppId} vs ${socket.id}`)
    } else {
      matchQueue.push(socket.id)
      socket.emit('searching')
      console.log(`${socket.id} entered matchmaking queue (${matchQueue.length} waiting)`)
    }
  })

  socket.on('cancel_search', () => {
    const idx = matchQueue.indexOf(socket.id)
    if (idx >= 0) matchQueue.splice(idx, 1)
  })

  socket.on('create_room', () => {
    const code = generateCode()
    const room: Room = {
      code,
      p1: { socketId: socket.id, userId: socketToUser.get(socket.id)!.id, slot: 'p1', team: null },
      p2: null, state: null, activeSlot: 'p1', turnTimer: null, resultRecorded: false,
    }
    rooms.set(code, room)
    socketToRoom.set(socket.id, code)
    void socket.join(code)
    socket.emit('room_created', { code, slot: 'p1' })
    console.log(`Room ${code} created`)
  })

  socket.on('join_room', ({ code }: { code: string }) => {
    const upper = code.toUpperCase()
    const room = rooms.get(upper)
    if (!room)   { socket.emit('room_error', { message: 'Room not found.' }); return }
    if (room.p2) { socket.emit('room_error', { message: 'Room is full.' });   return }

    room.p2 = { socketId: socket.id, userId: socketToUser.get(socket.id)!.id, slot: 'p2', team: null }
    socketToRoom.set(socket.id, upper)
    void socket.join(upper)
    socket.emit('room_joined', { code: upper, slot: 'p2' })
    io.to(room.p1!.socketId).emit('opponent_joined', { opponentUsername: socketToUser.get(socket.id)?.username ?? 'Opponent' })
    console.log(`${socket.id} joined room ${upper}`)
  })

  socket.on('submit_team', ({ team }: { team: Character[] }) => {
    const code = socketToRoom.get(socket.id)
    const room = code ? rooms.get(code) : null
    if (!room) return
    const slot = getSlot(room, socket.id)
    if (!slot) return

    slot.team = team
    const opp = slot.slot === 'p1' ? room.p2 : room.p1
    if (opp) io.to(opp.socketId).emit('opponent_ready')

    if (room.p1?.team && room.p2?.team && !room.state) {
      room.state = initBattle(room.p1.team, room.p2.team)
      room.activeSlot = 'p1'
      emit(io, room)
      startTurn(io, room)
      console.log(`Battle started in room ${room.code}`)
    }
  })

  socket.on('submit_queue', ({ queue }: { queue: QueuedSkill[] }) => {
    const code = socketToRoom.get(socket.id)
    const room = code ? rooms.get(code) : null
    if (!room?.state || room.state.phase !== 'player_turn') return

    const active = room.activeSlot === 'p1' ? room.p1 : room.p2
    if (!active || active.socketId !== socket.id) return

    void executeTurn(io, room, queue)
  })

  socket.on('disconnect', () => {
    console.log(`[-] ${socket.id}`)
    const qi = matchQueue.indexOf(socket.id)
    if (qi >= 0) matchQueue.splice(qi, 1)
    socketToUser.delete(socket.id)
    const code = socketToRoom.get(socket.id)
    if (!code) return
    const room = rooms.get(code)
    if (room) {
      clearTimer(room)
      io.to(code).emit('opponent_disconnected')
      rooms.delete(code)
    }
    socketToRoom.delete(socket.id)
  })
})

await initializeDatabase()
const sessionCleanupTimer = setInterval(() => {
  void deleteExpiredSessions().catch(error => console.error('Session cleanup failed', error))
}, 24 * 60 * 60 * 1000)
sessionCleanupTimer.unref()
http.listen(PORT, () => console.log(`PvP server on :${PORT}`))

async function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`)
  clearInterval(sessionCleanupTimer)
  io.close()
  http.close(async () => {
    await pool.end()
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))
