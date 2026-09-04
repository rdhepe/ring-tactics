import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Server, type Socket } from 'socket.io'
import { randomBytes, createHash, createHmac, timingSafeEqual } from 'crypto'
import argon2 from 'argon2'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import { parseCookie } from 'cookie'
import { z } from 'zod'
import Razorpay from 'razorpay'
import { initBattle, resolveSinglePlayerTurn, switchCombatMode } from '../src/engine/battle.js'
import type { BattleState, Character, QueuedSkill, BattlePhase, TeamId } from '../src/types/index.js'
import { DIAMOND_PACKAGES, UNLOCK_COST, FREE_RARITIES, COINS_PER_LADDER_WIN } from '../src/data/economy.js'
import { CHARACTER_RARITY } from '../src/data/characterRarities.js'
import {
  createSession,
  createDiamondOrder,
  createEmailVerificationToken,
  createUser,
  creditCoins,
  deleteExpiredSessions,
  deleteSession,
  findUserByUsername,
  getDiamondOrder,
  getDiamondOrderHistory,
  getEconomyState,
  getLeaderboardStats,
  getUserBySession,
  getUserPasswordHash,
  getUserProfile,
  initializeDatabase,
  markDiamondOrderPaidAndCredit,
  recordMatch,
  recordPvpMatch,
  unlockCharacterAtomic,
  updateUserEmail,
  updateUserPassword,
  verifyEmailToken,
  type AuthenticatedUser,
  type PlayerStats,
  pool,
} from './database.js'

const PORT = Number(process.env.PORT ?? 3001)
const TURN_SECS = 60
const isProduction = process.env.NODE_ENV === 'production'
const SESSION_COOKIE = isProduction ? '__Host-arena_session' : 'arena_session'
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000
const razorpayKeyId = process.env.RAZORPAY_KEY_ID
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET
const razorpay = razorpayKeyId && razorpayKeySecret
  ? new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret })
  : null
const brevoApiKey = process.env.BREVO_API_KEY
const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL
const brevoSenderName = process.env.BREVO_SENDER_NAME ?? 'Ring Tactics'
const railwayOrigin = process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : ''
const allowedOrigins = (process.env.APP_ORIGIN ?? `http://localhost:5173,http://127.0.0.1:5173,http://127.0.0.1:5174,${railwayOrigin}`)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)
// The origin used to build links inside emails (verification, etc.) — the first configured app origin.
const primaryAppOrigin = allowedOrigins[0] ?? 'http://localhost:5173'

async function sendVerificationEmail(toEmail: string, toName: string, verifyUrl: string) {
  if (!brevoApiKey || !brevoSenderEmail) {
    console.warn('BREVO_API_KEY/BREVO_SENDER_EMAIL not set — skipping verification email send.')
    return
  }
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': brevoApiKey, 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: brevoSenderName, email: brevoSenderEmail },
      to: [{ email: toEmail, name: toName }],
      subject: 'Verify your Ring Tactics email',
      htmlContent: `<p>Hi ${toName},</p>
        <p>Confirm your email address to finish setting up your Ring Tactics account:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p>This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>`,
    }),
  })
  if (!res.ok) console.error('Brevo send failed', res.status, await res.text().catch(() => ''))
}

async function issueEmailVerification(userId: string, email: string, username: string) {
  const rawToken = randomBytes(32).toString('base64url')
  const tokenHash = createHash('sha256').update(rawToken).digest('hex')
  await createEmailVerificationToken(userId, tokenHash, new Date(Date.now() + 24 * 60 * 60 * 1000))
  const verifyUrl = `${primaryAppOrigin}/verify-email?token=${rawToken}`
  await sendVerificationEmail(email, username, verifyUrl).catch(error => console.error('Failed to send verification email', error))
}

const registerSchema = z.object({
  username: z.string().trim().regex(/^[a-zA-Z0-9_-]{3,20}$/),
  password: z.string().min(12).max(128),
  email: z.email().max(254),
})
const loginCredentialsSchema = z.object({
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
  isLadder: boolean
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
      const winnerId = p1Won ? room.p1.userId : room.p2.userId
      const loserId  = p1Won ? room.p2.userId : room.p1.userId
      await recordPvpMatch(winnerId, loserId)
      // Only ranked ladder matches award coins — never trust the client's own reward math.
      if (room.isLadder) await creditCoins(winnerId, COINS_PER_LADDER_WIN)
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
app.use(helmet({
  // Default CSP blocks 'self'-only script/frame/connect sources; Razorpay Checkout
  // needs its script, iframe, and XHR/websocket endpoints allow-listed explicitly.
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'script-src': ["'self'", "'unsafe-inline'", 'https://checkout.razorpay.com'],
      'frame-src': ["'self'", 'https://checkout.razorpay.com', 'https://api.razorpay.com'],
      'connect-src': ["'self'", 'https://checkout.razorpay.com', 'https://api.razorpay.com', 'https://lumberjack.razorpay.com'],
      'img-src': ["'self'", 'data:', 'https://*.razorpay.com'],
    },
  },
}))
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
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: 'Username must be 3-20 characters, password must be 12-128 characters, and a valid email is required.' }); return }
  try {
    const passwordHash = await argon2.hash(parsed.data.password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 3, parallelism: 1 })
    const user = await createUser(parsed.data.username, passwordHash, parsed.data.email)
    await issueSession(res, user)
    await issueEmailVerification(user.id, parsed.data.email, user.username)
    res.status(201).json({ username: user.username, email: parsed.data.email, emailVerified: false })
  } catch (error) {
    const code = (error as { code?: string; constraint?: string }).code
    const constraint = (error as { constraint?: string }).constraint
    if (code === '23505' && constraint === 'users_email_unique_idx') { res.status(409).json({ error: 'Email already registered.' }); return }
    if (code === '23505') { res.status(409).json({ error: 'Username already taken.' }); return }
    throw error
  }
})

app.post('/auth/login', authLimiter, async (req, res) => {
  const parsed = loginCredentialsSchema.safeParse(req.body)
  if (!parsed.success) { res.status(401).json({ error: 'Invalid username or password.' }); return }
  const user = await findUserByUsername(parsed.data.username)
  const passwordMatches = await argon2.verify(user?.password_hash ?? dummyPasswordHash, parsed.data.password)
  if (!user || !passwordMatches) {
    res.status(401).json({ error: 'Invalid username or password.' }); return
  }
  await issueSession(res, user)
  const profile = await getUserProfile(user.id)
  res.json({ username: user.username, email: profile?.email ?? null, emailVerified: profile?.emailVerified ?? false })
})

app.get('/auth/me', async (req, res) => {
  const user = await getUserBySession(req.cookies[SESSION_COOKIE] ?? '')
  if (!user) { res.status(401).json({ error: 'Not authenticated.' }); return }
  const profile = await getUserProfile(user.id)
  res.json({ username: user.username, email: profile?.email ?? null, emailVerified: profile?.emailVerified ?? false })
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

// ─── Profile, password, and transaction history ───────────────────────────────

app.get('/profile', async (req, res) => {
  const user = await getUserBySession(req.cookies[SESSION_COOKIE] ?? '')
  if (!user) { res.status(401).json({ error: 'Not authenticated.' }); return }
  const profile = await getUserProfile(user.id)
  if (!profile) { res.status(404).json({ error: 'Profile not found.' }); return }
  res.json(profile)
})

const emailSchema = z.object({ email: z.email().max(254).nullable() })

app.patch('/profile', authLimiter, async (req, res) => {
  const user = await getUserBySession(req.cookies[SESSION_COOKIE] ?? '')
  if (!user) { res.status(401).json({ error: 'Not authenticated.' }); return }
  const parsed = emailSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: 'Enter a valid email address.' }); return }
  try {
    await updateUserEmail(user.id, parsed.data.email)
    if (parsed.data.email) await issueEmailVerification(user.id, parsed.data.email, user.username)
    res.json({ ok: true })
  } catch (error) {
    if ((error as { code?: string }).code === '23505') { res.status(409).json({ error: 'That email is already in use.' }); return }
    throw error
  }
})

const verifyEmailSchema = z.object({ token: z.string().min(1) })
const verifyLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false })

app.post('/auth/verify-email', verifyLimiter, async (req, res) => {
  const parsed = verifyEmailSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: 'Invalid verification link.' }); return }
  const tokenHash = createHash('sha256').update(parsed.data.token).digest('hex')
  const result = await verifyEmailToken(tokenHash)
  if (!result) { res.status(400).json({ error: 'This verification link is invalid or has expired.' }); return }
  res.json({ ok: true, username: result.username })
})

app.post('/auth/resend-verification', authLimiter, async (req, res) => {
  const user = await getUserBySession(req.cookies[SESSION_COOKIE] ?? '')
  if (!user) { res.status(401).json({ error: 'Not authenticated.' }); return }
  const profile = await getUserProfile(user.id)
  if (!profile?.email) { res.status(400).json({ error: 'Add an email address to your profile first.' }); return }
  if (profile.emailVerified) { res.json({ ok: true, alreadyVerified: true }); return }
  await issueEmailVerification(user.id, profile.email, user.username)
  res.json({ ok: true })
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(12).max(128),
})

app.post('/auth/change-password', authLimiter, async (req, res) => {
  const user = await getUserBySession(req.cookies[SESSION_COOKIE] ?? '')
  if (!user) { res.status(401).json({ error: 'Not authenticated.' }); return }
  const parsed = changePasswordSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: 'New password must be 12-128 characters.' }); return }

  const currentHash = await getUserPasswordHash(user.id)
  const matches = await argon2.verify(currentHash ?? dummyPasswordHash, parsed.data.currentPassword)
  if (!currentHash || !matches) { res.status(401).json({ error: 'Current password is incorrect.' }); return }

  const newHash = await argon2.hash(parsed.data.newPassword, { type: argon2.argon2id, memoryCost: 19456, timeCost: 3, parallelism: 1 })
  await updateUserPassword(user.id, newHash)
  res.json({ ok: true })
})

app.get('/payments/history', async (req, res) => {
  const user = await getUserBySession(req.cookies[SESSION_COOKIE] ?? '')
  if (!user) { res.status(401).json({ error: 'Not authenticated.' }); return }
  const history = await getDiamondOrderHistory(user.id)
  res.json(history.map(entry => ({
    ...entry,
    packageName: DIAMOND_PACKAGES.find(p => p.id === entry.packageId)?.name ?? entry.packageId,
  })))
})

app.post('/stats/match', async (req, res) => {
  const user = await getUserBySession(req.cookies[SESSION_COOKIE] ?? '')
  const result = req.body?.result as 'win' | 'loss' | undefined
  if (!user) { res.status(401).json({ error: 'Not authenticated.' }); return }
  if (result !== 'win' && result !== 'loss') { res.status(400).json({ error: 'Invalid match result.' }); return }
  await recordMatch(user.id, result)
  res.json({ ok: true })
})

// ─── Diamond wallet & Razorpay payment endpoints ─────────────────────────────

const paymentLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false })
const economyLimiter = rateLimit({ windowMs: 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false })

app.get('/economy', async (req, res) => {
  const user = await getUserBySession(req.cookies[SESSION_COOKIE] ?? '')
  if (!user) { res.status(401).json({ error: 'Not authenticated.' }); return }
  res.json(await getEconomyState(user.id))
})

const unlockSchema = z.object({ characterId: z.string(), currency: z.enum(['coins', 'diamonds']) })

app.post('/economy/unlock', economyLimiter, async (req, res) => {
  const user = await getUserBySession(req.cookies[SESSION_COOKIE] ?? '')
  if (!user) { res.status(401).json({ error: 'Not authenticated.' }); return }

  const parsed = unlockSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: 'Invalid request.' }); return }
  const { characterId, currency } = parsed.data

  // Always resolve rarity/cost from the server-side catalog — never trust a client-supplied cost.
  const rarity = CHARACTER_RARITY[characterId]
  if (!rarity) { res.status(404).json({ error: 'Unknown wrestler.' }); return }
  if (FREE_RARITIES.includes(rarity)) { res.status(400).json({ error: 'This wrestler is already free.' }); return }

  const cost = UNLOCK_COST[rarity][currency]
  if (cost == null) { res.status(400).json({ error: `${rarity} wrestlers cannot be unlocked with ${currency}.` }); return }

  const result = await unlockCharacterAtomic(user.id, characterId, currency, cost)
  if (result.status === 'insufficient_funds') { res.status(402).json({ error: 'Insufficient balance.' }); return }
  res.json({ unlocked: true, coins: result.coins, diamonds: result.diamonds })
})

const createOrderSchema = z.object({ packageId: z.string() })

app.post('/payments/create-order', paymentLimiter, async (req, res) => {
  if (!razorpay) { res.status(503).json({ error: 'Payments are not configured.' }); return }
  const user = await getUserBySession(req.cookies[SESSION_COOKIE] ?? '')
  if (!user) { res.status(401).json({ error: 'Not authenticated.' }); return }

  const parsed = createOrderSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: 'Invalid package.' }); return }

  // Always price from the server-side catalog — never trust a client-supplied amount.
  const pkg = DIAMOND_PACKAGES.find(p => p.id === parsed.data.packageId)
  if (!pkg) { res.status(400).json({ error: 'Unknown package.' }); return }

  // Razorpay rejects orders under ₹1 (100 paise).
  const amountPaise = Math.max(100, Math.round(pkg.priceInr * 100))

  try {
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      notes: { userId: user.id, packageId: pkg.id },
    })
    await createDiamondOrder(order.id, user.id, pkg.id, pkg.diamonds + pkg.bonus, amountPaise)
    res.json({ orderId: order.id, amount: amountPaise, currency: order.currency, keyId: razorpayKeyId })
  } catch (error) {
    console.error('Razorpay order creation failed', error)
    res.status(502).json({ error: 'Could not create payment order.' })
  }
})

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
})

app.post('/payments/verify', paymentLimiter, async (req, res) => {
  if (!razorpay || !razorpayKeySecret) { res.status(503).json({ error: 'Payments are not configured.' }); return }
  const user = await getUserBySession(req.cookies[SESSION_COOKIE] ?? '')
  if (!user) { res.status(401).json({ error: 'Not authenticated.' }); return }

  const parsed = verifyPaymentSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: 'Invalid payment payload.' }); return }
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data

  const order = await getDiamondOrder(razorpay_order_id)
  if (!order || order.userId !== user.id) { res.status(404).json({ error: 'Order not found.' }); return }

  const expectedSignature = createHmac('sha256', razorpayKeySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')
  const signaturesMatch = expectedSignature.length === razorpay_signature.length
    && timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpay_signature))
  if (!signaturesMatch) { res.status(400).json({ error: 'Payment verification failed.' }); return }

  const newBalance = await markDiamondOrderPaidAndCredit(razorpay_order_id, user.id)
  if (newBalance === null) { res.status(409).json({ error: 'Order already processed.' }); return }
  res.json({ diamonds: newBalance })
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

const serverDirectory = path.dirname(fileURLToPath(import.meta.url))
const distDirectory = path.resolve(serverDirectory, '../dist')
app.use(express.static(distDirectory, { index: false, maxAge: isProduction ? '1y' : 0 }))
app.use((req, res, next) => {
  if (req.method !== 'GET' || !req.accepts('html')) { next(); return }
  res.sendFile(path.join(distDirectory, 'index.html'))
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
        state: null, activeSlot: 'p1', turnTimer: null, resultRecorded: false, isLadder: true,
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
      p2: null, state: null, activeSlot: 'p1', turnTimer: null, resultRecorded: false, isLadder: false,
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

  socket.on('switch_mode', ({ charIdx }: { charIdx: number }) => {
    const code = socketToRoom.get(socket.id)
    const room = code ? rooms.get(code) : null
    if (!room?.state || room.state.phase !== 'player_turn') return

    const active = room.activeSlot === 'p1' ? room.p1 : room.p2
    if (!active || active.socketId !== socket.id) return

    const teamId: TeamId = room.activeSlot === 'p1' ? 'player' : 'ai'
    room.state = switchCombatMode(room.state, teamId, charIdx)
    emit(io, room)
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
