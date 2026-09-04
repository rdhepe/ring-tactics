import { createHash, randomUUID } from 'node:crypto'
import { Pool, type PoolClient } from 'pg'

export interface AuthenticatedUser {
  id: string
  username: string
}

export interface PlayerStats {
  username: string
  wins: number
  losses: number
  matchesPlayed: number
  currentWinStreak: number
  bestWinStreak: number
}

export type PvpMatchReason = 'completed' | 'forfeit' | 'abandoned'

export interface PvpMatchHistoryEntry {
  id: string
  result: 'win' | 'loss'
  opponentUsername: string
  reason: PvpMatchReason
  turns: number
  playedAt: string
}

export interface PasswordResetUser extends AuthenticatedUser {
  email: string
}

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
  max: Number(process.env.DATABASE_POOL_SIZE ?? 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
})

pool.on('error', error => console.error('Unexpected PostgreSQL pool error', error))

export async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      username VARCHAR(20) NOT NULL,
      username_normalized VARCHAR(20) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      email VARCHAR(254),
      email_verified BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users (LOWER(email)) WHERE email IS NOT NULL;

    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      token_hash CHAR(64) PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL
    );

    CREATE INDEX IF NOT EXISTS email_verification_tokens_user_id_idx ON email_verification_tokens(user_id);

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token_hash CHAR(64) PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL
    );

    CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx ON password_reset_tokens(user_id);
    CREATE INDEX IF NOT EXISTS password_reset_tokens_expires_at_idx ON password_reset_tokens(expires_at);

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash CHAR(64) PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL,
      last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

    CREATE TABLE IF NOT EXISTS player_stats (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      wins INTEGER NOT NULL DEFAULT 0 CHECK (wins >= 0),
      losses INTEGER NOT NULL DEFAULT 0 CHECK (losses >= 0),
      matches_played INTEGER NOT NULL DEFAULT 0 CHECK (matches_played >= 0),
      current_win_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_win_streak >= 0),
      best_win_streak INTEGER NOT NULL DEFAULT 0 CHECK (best_win_streak >= 0),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS pvp_match_history (
      id UUID PRIMARY KEY,
      match_id UUID NOT NULL,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      opponent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      result TEXT NOT NULL CHECK (result IN ('win', 'loss')),
      reason TEXT NOT NULL DEFAULT 'completed' CHECK (reason IN ('completed', 'forfeit', 'abandoned')),
      turns INTEGER NOT NULL DEFAULT 0 CHECK (turns >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS pvp_match_history_user_created_idx ON pvp_match_history(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS pvp_match_history_match_idx ON pvp_match_history(match_id);

    CREATE TABLE IF NOT EXISTS wallets (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      coins INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0),
      diamonds INTEGER NOT NULL DEFAULT 0 CHECK (diamonds >= 0),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS unlocked_characters (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      character_id TEXT NOT NULL,
      unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, character_id)
    );

    CREATE TABLE IF NOT EXISTS diamond_orders (
      order_id TEXT PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      package_id TEXT NOT NULL,
      diamonds INTEGER NOT NULL CHECK (diamonds > 0),
      amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
      status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'paid')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      paid_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS pre_registrations (
      email VARCHAR(254) PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS diamond_orders_user_id_idx ON diamond_orders(user_id);
  `)

  // Migration safety net: add columns for DBs created before they existed.
  await pool.query('ALTER TABLE wallets ADD COLUMN IF NOT EXISTS coins INTEGER NOT NULL DEFAULT 0')
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(254)')
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false')

  await pool.query('DELETE FROM sessions WHERE expires_at <= NOW()')
  await pool.query('DELETE FROM email_verification_tokens WHERE expires_at <= NOW()')
  await pool.query('DELETE FROM password_reset_tokens WHERE expires_at <= NOW()')
}

export function normalizeUsername(username: string) {
  return username.trim().toLocaleLowerCase('en-US')
}

export async function findUserByUsername(username: string) {
  const result = await pool.query<AuthenticatedUser & { password_hash: string }>(
    'SELECT id, username, password_hash FROM users WHERE username_normalized = $1',
    [normalizeUsername(username)],
  )
  return result.rows[0] ?? null
}

export async function findUserByEmail(email: string): Promise<PasswordResetUser | null> {
  const result = await pool.query<PasswordResetUser>(
    'SELECT id, username, email FROM users WHERE LOWER(email) = LOWER($1)',
    [email.trim()],
  )
  return result.rows[0] ?? null
}

export async function createUser(username: string, passwordHash: string, email: string): Promise<AuthenticatedUser> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const id = randomUUID()
    const result = await client.query<AuthenticatedUser>(
      `INSERT INTO users (id, username, username_normalized, password_hash, email)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username`,
      [id, username.trim(), normalizeUsername(username), passwordHash, email.trim().toLowerCase()],
    )
    await client.query('INSERT INTO player_stats (user_id) VALUES ($1)', [id])
    await client.query('INSERT INTO wallets (user_id) VALUES ($1)', [id])
    await client.query('COMMIT')
    return result.rows[0]
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/** Creates the fixed set of bot accounts on first boot (idempotent) and returns them. No email/login — used only as ladder matchmaking fallback opponents. */
export async function ensureBotUsers(usernames: string[], passwordHash: string): Promise<AuthenticatedUser[]> {
  for (const username of usernames) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const id = randomUUID()
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO users (id, username, username_normalized, password_hash, email_verified)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (username_normalized) DO NOTHING
         RETURNING id`,
        [id, username, normalizeUsername(username), passwordHash],
      )
      if (inserted.rows[0]) {
        await client.query('INSERT INTO player_stats (user_id) VALUES ($1)', [inserted.rows[0].id])
        await client.query('INSERT INTO wallets (user_id) VALUES ($1)', [inserted.rows[0].id])
      }
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
  const result = await pool.query<AuthenticatedUser>(
    'SELECT id, username FROM users WHERE username_normalized = ANY($1)',
    [usernames.map(normalizeUsername)],
  )
  return result.rows
}

function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function createSession(userId: string, token: string, expiresAt: Date) {
  await pool.query(
    'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
    [hashSessionToken(token), userId, expiresAt],
  )
}

export async function getUserBySession(token: string): Promise<AuthenticatedUser | null> {
  const result = await pool.query<AuthenticatedUser>(
    `UPDATE sessions s
     SET last_used_at = NOW()
     FROM users u
     WHERE s.token_hash = $1 AND s.user_id = u.id AND s.expires_at > NOW()
     RETURNING u.id, u.username`,
    [hashSessionToken(token)],
  )
  return result.rows[0] ?? null
}

export async function deleteSession(token: string) {
  await pool.query('DELETE FROM sessions WHERE token_hash = $1', [hashSessionToken(token)])
}

export async function deleteAllUserSessions(userId: string) {
  await pool.query('DELETE FROM sessions WHERE user_id = $1', [userId])
}

export async function deleteExpiredSessions() {
  await pool.query('DELETE FROM sessions WHERE expires_at <= NOW()')
}

async function recordMatchWithClient(client: PoolClient, userId: string, result: 'win' | 'loss') {
  const won = result === 'win'
  await client.query(
    `INSERT INTO player_stats (user_id, wins, losses, matches_played, current_win_streak, best_win_streak)
     VALUES ($1, $2, $3, 1, $2, $2)
     ON CONFLICT (user_id) DO UPDATE SET
       wins = player_stats.wins + $2,
       losses = player_stats.losses + $3,
       matches_played = player_stats.matches_played + 1,
       current_win_streak = CASE WHEN $2 = 1 THEN player_stats.current_win_streak + 1 ELSE 0 END,
       best_win_streak = CASE WHEN $2 = 1 THEN GREATEST(player_stats.best_win_streak, player_stats.current_win_streak + 1) ELSE player_stats.best_win_streak END,
       updated_at = NOW()`,
    [userId, won ? 1 : 0, won ? 0 : 1],
  )
}

export async function recordMatch(userId: string, result: 'win' | 'loss') {
  await recordMatchWithClient(pool, userId, result)
}

export async function recordPvpMatch(winnerId: string, loserId: string, opts: { reason?: PvpMatchReason; turns?: number } = {}) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await recordMatchWithClient(client, winnerId, 'win')
    await recordMatchWithClient(client, loserId, 'loss')
    const matchId = randomUUID()
    const reason = opts.reason ?? 'completed'
    const turns = Math.max(0, Math.floor(opts.turns ?? 0))
    await client.query(
      `INSERT INTO pvp_match_history (id, match_id, user_id, opponent_id, result, reason, turns)
       VALUES ($1, $2, $3, $4, 'win', $5, $6), ($7, $2, $4, $3, 'loss', $5, $6)`,
      [randomUUID(), matchId, winnerId, loserId, reason, turns, randomUUID()],
    )
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function getPvpMatchHistory(userId: string, limit = 30): Promise<PvpMatchHistoryEntry[]> {
  const result = await pool.query<{
    id: string
    result: 'win' | 'loss'
    opponent_username: string
    reason: PvpMatchReason
    turns: number
    played_at: Date
  }>(
    `SELECT h.id, h.result, u.username AS opponent_username, h.reason, h.turns, h.created_at AS played_at
     FROM pvp_match_history h
     JOIN users u ON u.id = h.opponent_id
     WHERE h.user_id = $1
     ORDER BY h.created_at DESC
     LIMIT $2`,
    [userId, Math.min(Math.max(limit, 1), 50)],
  )
  return result.rows.map(row => ({
    id: row.id,
    result: row.result,
    opponentUsername: row.opponent_username,
    reason: row.reason,
    turns: row.turns,
    playedAt: row.played_at.toISOString(),
  }))
}

export async function getLeaderboardStats(): Promise<PlayerStats[]> {
  const result = await pool.query<{
    username: string
    wins: number
    losses: number
    matches_played: number
    current_win_streak: number
    best_win_streak: number
  }>(
    `SELECT u.username, s.wins, s.losses, s.matches_played, s.current_win_streak, s.best_win_streak
     FROM player_stats s
     JOIN users u ON u.id = s.user_id
     WHERE s.matches_played > 0`,
  )
  return result.rows.map(row => ({
    username: row.username,
    wins: row.wins,
    losses: row.losses,
    matchesPlayed: row.matches_played,
    currentWinStreak: row.current_win_streak,
    bestWinStreak: row.best_win_streak,
  }))
}

// ─── Diamond wallet & Razorpay orders ─────────────────────────────────────────

export interface EconomyState {
  coins: number
  diamonds: number
  unlockedCharacters: string[]
}

async function ensureWallet(userId: string) {
  await pool.query('INSERT INTO wallets (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [userId])
}

export async function getEconomyState(userId: string): Promise<EconomyState> {
  await ensureWallet(userId)
  const [wallet, unlocks] = await Promise.all([
    pool.query<{ coins: number; diamonds: number }>('SELECT coins, diamonds FROM wallets WHERE user_id = $1', [userId]),
    pool.query<{ character_id: string }>('SELECT character_id FROM unlocked_characters WHERE user_id = $1', [userId]),
  ])
  return {
    coins: wallet.rows[0]?.coins ?? 0,
    diamonds: wallet.rows[0]?.diamonds ?? 0,
    unlockedCharacters: unlocks.rows.map(r => r.character_id),
  }
}

export async function getWalletDiamonds(userId: string): Promise<number> {
  const result = await pool.query<{ diamonds: number }>(
    `INSERT INTO wallets (user_id) VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING
     RETURNING diamonds`,
    [userId],
  )
  if (result.rows[0]) return result.rows[0].diamonds
  const existing = await pool.query<{ diamonds: number }>('SELECT diamonds FROM wallets WHERE user_id = $1', [userId])
  return existing.rows[0]?.diamonds ?? 0
}

/** Credits coins to a user's wallet (e.g. a ladder match win). Never trust a client-supplied amount. */
export async function creditCoins(userId: string, amount: number): Promise<void> {
  if (amount <= 0) return
  await ensureWallet(userId)
  await pool.query('UPDATE wallets SET coins = coins + $2, updated_at = NOW() WHERE user_id = $1', [userId, amount])
}

export type UnlockResult =
  | { status: 'unlocked' | 'already_unlocked'; coins: number; diamonds: number }
  | { status: 'insufficient_funds' }

/** Atomically validates funds, deducts the cost, and records the unlock — safe against double-submits and race conditions. */
export async function unlockCharacterAtomic(
  userId: string,
  characterId: string,
  currency: 'coins' | 'diamonds',
  cost: number,
): Promise<UnlockResult> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('INSERT INTO wallets (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [userId])

    const already = await client.query(
      'SELECT 1 FROM unlocked_characters WHERE user_id = $1 AND character_id = $2',
      [userId, characterId],
    )
    if (already.rows[0]) {
      const wallet = await client.query<{ coins: number; diamonds: number }>(
        'SELECT coins, diamonds FROM wallets WHERE user_id = $1', [userId],
      )
      await client.query('COMMIT')
      return { status: 'already_unlocked', coins: wallet.rows[0].coins, diamonds: wallet.rows[0].diamonds }
    }

    const column = currency === 'coins' ? 'coins' : 'diamonds'
    const deducted = await client.query<{ coins: number; diamonds: number }>(
      `UPDATE wallets SET ${column} = ${column} - $2, updated_at = NOW()
       WHERE user_id = $1 AND ${column} >= $2
       RETURNING coins, diamonds`,
      [userId, cost],
    )
    if (!deducted.rows[0]) {
      await client.query('ROLLBACK')
      return { status: 'insufficient_funds' }
    }

    await client.query(
      'INSERT INTO unlocked_characters (user_id, character_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, characterId],
    )
    await client.query('COMMIT')
    return { status: 'unlocked', coins: deducted.rows[0].coins, diamonds: deducted.rows[0].diamonds }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function createDiamondOrder(orderId: string, userId: string, packageId: string, diamonds: number, amountPaise: number) {
  await pool.query(
    `INSERT INTO diamond_orders (order_id, user_id, package_id, diamonds, amount_paise)
     VALUES ($1, $2, $3, $4, $5)`,
    [orderId, userId, packageId, diamonds, amountPaise],
  )
}

export interface DiamondOrder {
  orderId: string
  userId: string
  diamonds: number
  status: 'created' | 'paid'
}

export async function getDiamondOrder(orderId: string): Promise<DiamondOrder | null> {
  const result = await pool.query<{ order_id: string; user_id: string; diamonds: number; status: 'created' | 'paid' }>(
    'SELECT order_id, user_id, diamonds, status FROM diamond_orders WHERE order_id = $1',
    [orderId],
  )
  const row = result.rows[0]
  return row ? { orderId: row.order_id, userId: row.user_id, diamonds: row.diamonds, status: row.status } : null
}

/** Marks the order paid and credits the wallet, atomically and exactly once (safe against webhook/client double calls). */
export async function markDiamondOrderPaidAndCredit(orderId: string, userId: string): Promise<number | null> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const updated = await client.query<{ diamonds: number }>(
      `UPDATE diamond_orders SET status = 'paid', paid_at = NOW()
       WHERE order_id = $1 AND user_id = $2 AND status = 'created'
       RETURNING diamonds`,
      [orderId, userId],
    )
    if (!updated.rows[0]) {
      await client.query('ROLLBACK')
      return null
    }
    const credited = await client.query<{ diamonds: number }>(
      `UPDATE wallets SET diamonds = diamonds + $2, updated_at = NOW()
       WHERE user_id = $1
       RETURNING diamonds`,
      [userId, updated.rows[0].diamonds],
    )
    await client.query('COMMIT')
    return credited.rows[0]?.diamonds ?? null
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

// ─── Profile & transaction history ────────────────────────────────────────────

export interface UserProfile {
  username: string
  email: string | null
  emailVerified: boolean
  createdAt: string
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const result = await pool.query<{ username: string; email: string | null; email_verified: boolean; created_at: string }>(
    'SELECT username, email, email_verified, created_at FROM users WHERE id = $1',
    [userId],
  )
  const row = result.rows[0]
  return row ? { username: row.username, email: row.email, emailVerified: row.email_verified, createdAt: row.created_at } : null
}

export async function getUserPasswordHash(userId: string): Promise<string | null> {
  const result = await pool.query<{ password_hash: string }>('SELECT password_hash FROM users WHERE id = $1', [userId])
  return result.rows[0]?.password_hash ?? null
}

export async function updateUserPassword(userId: string, passwordHash: string) {
  await pool.query('UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1', [userId, passwordHash])
}

export async function createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date) {
  await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId])
  await pool.query(
    'INSERT INTO password_reset_tokens (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
    [tokenHash, userId, expiresAt],
  )
}

export async function resetPasswordWithToken(tokenHash: string, passwordHash: string): Promise<{ userId: string; username: string } | null> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const deleted = await client.query<{ user_id: string }>(
      `DELETE FROM password_reset_tokens WHERE token_hash = $1 AND expires_at > NOW() RETURNING user_id`,
      [tokenHash],
    )
    const userId = deleted.rows[0]?.user_id
    if (!userId) { await client.query('ROLLBACK'); return null }
    const updated = await client.query<{ username: string }>(
      'UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1 RETURNING username',
      [userId, passwordHash],
    )
    await client.query('DELETE FROM sessions WHERE user_id = $1', [userId])
    await client.query('COMMIT')
    return updated.rows[0] ? { userId, username: updated.rows[0].username } : null
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function updateUserEmail(userId: string, email: string | null) {
  // Changing the email invalidates prior verification — the new address must be re-verified.
  await pool.query('UPDATE users SET email = $2, email_verified = false, updated_at = NOW() WHERE id = $1', [userId, email])
}

// ─── Email verification ───────────────────────────────────────────────────────

export async function createEmailVerificationToken(userId: string, tokenHash: string, expiresAt: Date) {
  await pool.query('DELETE FROM email_verification_tokens WHERE user_id = $1', [userId])
  await pool.query(
    'INSERT INTO email_verification_tokens (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
    [tokenHash, userId, expiresAt],
  )
}

/** Consumes a verification token exactly once and marks the owning user's email verified. */
export async function verifyEmailToken(tokenHash: string): Promise<{ userId: string; username: string } | null> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const deleted = await client.query<{ user_id: string }>(
      `DELETE FROM email_verification_tokens WHERE token_hash = $1 AND expires_at > NOW() RETURNING user_id`,
      [tokenHash],
    )
    const userId = deleted.rows[0]?.user_id
    if (!userId) { await client.query('ROLLBACK'); return null }
    const updated = await client.query<{ username: string }>(
      'UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = $1 RETURNING username',
      [userId],
    )
    await client.query('COMMIT')
    return updated.rows[0] ? { userId, username: updated.rows[0].username } : null
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export interface DiamondOrderHistoryEntry {
  orderId: string
  packageId: string
  diamonds: number
  amountPaise: number
  status: 'created' | 'paid'
  createdAt: string
  paidAt: string | null
}

export async function getDiamondOrderHistory(userId: string): Promise<DiamondOrderHistoryEntry[]> {
  const result = await pool.query<{
    order_id: string; package_id: string; diamonds: number; amount_paise: number
    status: 'created' | 'paid'; created_at: string; paid_at: string | null
  }>(
    `SELECT order_id, package_id, diamonds, amount_paise, status, created_at, paid_at
     FROM diamond_orders WHERE user_id = $1
     ORDER BY created_at DESC LIMIT 50`,
    [userId],
  )
  return result.rows.map(row => ({
    orderId: row.order_id,
    packageId: row.package_id,
    diamonds: row.diamonds,
    amountPaise: row.amount_paise,
    status: row.status,
    createdAt: row.created_at,
    paidAt: row.paid_at,
  }))
}

// ─── Pre-registration ──────────────────────────────────────────────────────────

/** Returns false if the email was already pre-registered (never throws on duplicates). */
export async function createPreRegistration(email: string): Promise<boolean> {
  const result = await pool.query(
    'INSERT INTO pre_registrations (email) VALUES ($1) ON CONFLICT (email) DO NOTHING RETURNING email',
    [email.trim().toLowerCase()],
  )
  return result.rowCount === 1
}
