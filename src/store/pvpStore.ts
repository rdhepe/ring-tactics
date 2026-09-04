import { create } from 'zustand'
import { io, type Socket } from 'socket.io-client'
import type { BattleState, Character, QueuedSkill } from '../types'
import { CHARACTER_MAP } from '../data/characters'

// Bot opponents are built server-side from an image-free character mirror (server can't
// import .jpg assets), so their avatar/skill icons arrive blank over the wire. Fill them
// in from the real bundled character data (matched by id) before rendering.
function hydrateCharacter(char: Character): Character {
  const local = CHARACTER_MAP[char.id]
  if (!local) return char
  return {
    ...char,
    avatarUrl: char.avatarUrl || local.avatarUrl,
    skills: char.skills.map(skill => {
      const localSkill = local.skills.find(s => s.id === skill.id)
      return localSkill && !skill.iconUrl ? { ...skill, iconUrl: localSkill.iconUrl } : skill
    }) as Character['skills'],
  }
}

function hydrateBattleState(state: BattleState): BattleState {
  return {
    ...state,
    player: { ...state.player, characters: state.player.characters.map(bc => ({ ...bc, character: hydrateCharacter(bc.character) })) },
    ai:     { ...state.ai,     characters: state.ai.characters.map(bc => ({ ...bc, character: hydrateCharacter(bc.character) })) },
  }
}

export type PvpPhase =
  | 'idle'
  | 'waiting_for_opponent'
  | 'searching'          // in matchmaking queue
  | 'team_select'
  | 'battle'
  | 'game_over'
  | 'error'

interface PvpStore {
  socket: Socket | null
  roomCode: string | null
  mySlot: 'p1' | 'p2' | null
  pvpPhase: PvpPhase
  errorMsg: string | null
  battleState: BattleState | null
  opponentReady: boolean
  opponentUsername: string | null
  myTurn: boolean          // true = it's this player's turn to queue + submit
  opponentActing: boolean  // true = waiting for opponent to finish their turn
  timeLeft: number

  connect:      () => void
  createRoom:   () => void
  joinRoom:     (code: string) => void
  findMatch:    () => void
  cancelSearch: () => void
  submitTeam:   (team: Character[]) => void
  submitQueue:  (queue: QueuedSkill[]) => void
  switchMode:   (charIdx: number) => void
  reset:        () => void
}

const SERVER = import.meta.env.VITE_API_URL ?? ''

export const usePvpStore = create<PvpStore>((set, get) => ({
  socket: null,
  roomCode: null,
  mySlot: null,
  pvpPhase: 'idle',
  errorMsg: null,
  battleState: null,
  opponentReady: false,
  opponentUsername: null,
  myTurn: false,
  opponentActing: false,
  timeLeft: 60,

  connect: () => {
    if (get().socket?.connected) return
    const socket = io(SERVER, {
      withCredentials: true,
      transports: ['websocket'],
      reconnectionAttempts: 3,
      reconnectionDelay: 1500,
    })

    socket.on('connect_error', (err) =>
      set({ pvpPhase: 'error', errorMsg: err.message === 'not_authenticated'
        ? 'Session expired. Please log in again.'
        : err.message === 'email_not_verified'
        ? 'Verify your email before playing. Check your profile to resend the link.'
        : err.message === 'coming_soon'
        ? 'Ring Tactics is not live yet. Check back soon!'
        : 'Cannot reach PvP server. Run: npm run server' }))

    socket.on('room_created',  ({ code, slot }: { code: string; slot: 'p1'|'p2' }) =>
      set({ roomCode: code, mySlot: slot, pvpPhase: 'waiting_for_opponent' }))

    socket.on('room_joined',   ({ code, slot, opponentUsername }: { code: string; slot: 'p1'|'p2'; opponentUsername?: string }) =>
      set({ roomCode: code, mySlot: slot, pvpPhase: 'team_select', opponentUsername: opponentUsername ?? null }))

    socket.on('room_error',    ({ message }: { message: string }) =>
      set({ pvpPhase: 'error', errorMsg: message }))

    socket.on('opponent_joined', ({ opponentUsername }: { opponentUsername?: string }) =>
      set({ pvpPhase: 'team_select', opponentUsername: opponentUsername ?? null }))
    socket.on('opponent_ready',  () => set({ opponentReady: true }))

    // Ladder matchmaking
    socket.on('searching',   () => set({ pvpPhase: 'searching' }))
    socket.on('match_found', ({ code, slot, opponentUsername }: { code: string; slot: 'p1'|'p2'; opponentUsername?: string }) =>
      set({ roomCode: code, mySlot: slot, pvpPhase: 'team_select', opponentUsername: opponentUsername ?? null }))

    // Sequential turn events
    socket.on('your_turn',     ({ timeLeft }: { timeLeft: number }) =>
      set({ myTurn: true, opponentActing: false, timeLeft, pvpPhase: 'battle' }))

    socket.on('opponents_turn', () =>
      set({ myTurn: false, opponentActing: true, pvpPhase: 'battle' }))

    socket.on('state_update', ({ state }: { state: BattleState }) => {
      const isOver = state.phase === 'victory' || state.phase === 'defeat'
      set({ battleState: hydrateBattleState(state), pvpPhase: isOver ? 'game_over' : 'battle' })
    })

    socket.on('opponent_disconnected', () =>
      set({ pvpPhase: 'error', errorMsg: 'Opponent disconnected.' }))

    set({ socket })
  },

  createRoom:  () => get().socket?.emit('create_room'),
  joinRoom:    (code) => get().socket?.emit('join_room', { code }),

  findMatch: () => {
    const s = get().socket
    if (!s) return
    // Emit immediately if already connected, otherwise wait for handshake
    if (s.connected) s.emit('find_match')
    else             s.once('connect', () => s.emit('find_match'))
  },

  cancelSearch: () => { get().socket?.emit('cancel_search'); set({ pvpPhase: 'idle' }) },
  submitTeam:  (team) => get().socket?.emit('submit_team', { team }),
  submitQueue: (queue) => get().socket?.emit('submit_queue', { queue }),
  switchMode:  (charIdx) => get().socket?.emit('switch_mode', { charIdx }),

  reset: () => {
    get().socket?.disconnect()
    set({
      socket: null, roomCode: null, mySlot: null,
      pvpPhase: 'idle', errorMsg: null, battleState: null,
      opponentReady: false, myTurn: false, opponentActing: false,
      opponentUsername: null, timeLeft: 60,
    })
  },
}))
