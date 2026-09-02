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

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : undefined,
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
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

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
  `)

  await pool.query('DELETE FROM sessions WHERE expires_at <= NOW()')
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

export async function createUser(username: string, passwordHash: string): Promise<AuthenticatedUser> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const id = randomUUID()
    const result = await client.query<AuthenticatedUser>(
      `INSERT INTO users (id, username, username_normalized, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username`,
      [id, username.trim(), normalizeUsername(username), passwordHash],
    )
    await client.query('INSERT INTO player_stats (user_id) VALUES ($1)', [id])
    await client.query('COMMIT')
    return result.rows[0]
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
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

export async function recordPvpMatch(winnerId: string, loserId: string) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await recordMatchWithClient(client, winnerId, 'win')
    await recordMatchWithClient(client, loserId, 'loss')
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
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
