/**
 * Node 侧台账：SQLite。
 *
 * 用 Node 24 内置的 `node:sqlite`，不引入 better-sqlite3 那类原生模块 ——
 * 原生模块在 SEA 单文件里需要写到临时文件再 dlopen，安装包会立刻变得脆弱。
 * 内置实现随 Node 一起走，打包后零额外依赖。
 *
 * 与浏览器实现的关系：两者都实现同一个 LedgerStore 接口，评分逻辑共用
 * arena/rating.ts，所以 CLI 算出的 Elo 和网页算出的完全一致。
 */
import { DatabaseSync } from 'node:sqlite'
import type { BlindMatch, Claim } from '@/contract/reading'
import type { LedgerStore } from '@/runtime'
import { emptyStats, leaderboardRows, updateElo, type MasterStats } from '@/arena/rating'
import { MASTERS } from '@/masters/registry'

export interface SqliteStoreOptions {
  /** `:memory:` 用于测试 */
  file: string
}

export class SqliteLedgerStore implements LedgerStore {
  private db: DatabaseSync

  constructor(options: SqliteStoreOptions) {
    this.db = new DatabaseSync(options.file)
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        created_at INTEGER NOT NULL,
        payload TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS claims (
        id TEXT PRIMARY KEY,
        match_id TEXT,
        master_id TEXT NOT NULL,
        text TEXT NOT NULL,
        due_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        status TEXT NOT NULL,
        resolved_at INTEGER
      );

      CREATE INDEX IF NOT EXISTS claims_due ON claims(status, due_at);
      CREATE INDEX IF NOT EXISTS matches_created ON matches(created_at DESC);

      CREATE TABLE IF NOT EXISTS stats (
        master_id TEXT PRIMARY KEY,
        rating INTEGER NOT NULL,
        matches INTEGER NOT NULL,
        wins INTEGER NOT NULL,
        losses INTEGER NOT NULL,
        draws INTEGER NOT NULL,
        claims_resolved INTEGER NOT NULL,
        claims_hit INTEGER NOT NULL,
        claims_miss INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `)
    this.seedStats()
  }

  /** 首次运行写入 1500 初始分；已存在则不动 */
  private seedStats(): void {
    const insert = this.db.prepare(
      `INSERT OR IGNORE INTO stats
       (master_id, rating, matches, wins, losses, draws, claims_resolved, claims_hit, claims_miss)
       VALUES (?, 1500, 0, 0, 0, 0, 0, 0, 0)`,
    )
    for (const master of MASTERS) insert.run(master.id)
  }

  listMatches(): BlindMatch[] {
    const rows = this.db.prepare('SELECT payload FROM matches ORDER BY created_at DESC').all() as Array<{ payload: string }>
    return rows.map((row) => JSON.parse(row.payload) as BlindMatch)
  }

  listClaims(): Claim[] {
    const rows = this.db
      .prepare('SELECT id, match_id, master_id, text, due_at, created_at, status FROM claims ORDER BY due_at ASC')
      .all() as Array<Record<string, unknown>>
    return rows.map((row) => ({
      id: String(row.id),
      masterId: String(row.master_id) as Claim['masterId'],
      ...(row.match_id ? { matchId: String(row.match_id) } : {}),
      text: String(row.text),
      dueAt: Number(row.due_at),
      createdAt: Number(row.created_at),
      status: String(row.status) as Claim['status'],
    }))
  }

  saveMatch(match: BlindMatch): void {
    // 同一 id 重复保存时只允许"补充投票状态"，不允许回退：
    // 直接 INSERT OR IGNORE 会把先写入的投票丢掉（真实踩过），
    // 而盲目 REPLACE 又会让重放请求覆盖已计分的记录。
    const existing = this.db.prepare('SELECT payload FROM matches WHERE id = ?').get(match.id) as
      | { payload: string }
      | undefined
    if (existing) {
      const current = JSON.parse(existing.payload) as BlindMatch
      if (current.vote || !match.vote) return // 已有投票 或 新对象没有投票 → 保持原样
      current.vote = match.vote
      if (match.votedAt !== undefined) current.votedAt = match.votedAt
      this.db.prepare('UPDATE matches SET payload = ? WHERE id = ?').run(JSON.stringify(current), match.id)
      return
    }
    this.db
      .prepare('INSERT INTO matches (id, created_at, payload) VALUES (?, ?, ?)')
      .run(match.id, match.createdAt, JSON.stringify(match))
  }

  saveClaims(claims: Claim[]): void {
    const insert = this.db.prepare(
      `INSERT OR IGNORE INTO claims (id, match_id, master_id, text, due_at, created_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    this.db.exec('BEGIN')
    try {
      for (const claim of claims) {
        insert.run(claim.id, claim.matchId ?? null, claim.masterId, claim.text, claim.dueAt, claim.createdAt, claim.status)
      }
      this.db.exec('COMMIT')
    } catch (error) {
      this.db.exec('ROLLBACK')
      throw error
    }
  }

  resolveClaim(id: string, status: 'hit' | 'miss' | 'unknown'): boolean {
    const row = this.db.prepare('SELECT due_at, master_id, status FROM claims WHERE id = ?').get(id) as
      | { due_at: number; master_id: string; status: string }
      | undefined
    if (!row || row.status !== 'pending') return false
    // 到期前不得判定为应验/未验：与浏览器实现同一条规则
    if (status !== 'unknown' && Date.now() < Number(row.due_at)) return false

    this.db.exec('BEGIN')
    try {
      this.db.prepare('UPDATE claims SET status = ?, resolved_at = ? WHERE id = ?').run(status, Date.now(), id)
      if (status !== 'unknown') {
        this.db
          .prepare(
            `UPDATE stats SET claims_resolved = claims_resolved + 1,
             claims_hit = claims_hit + ?, claims_miss = claims_miss + ? WHERE master_id = ?`,
          )
          .run(status === 'hit' ? 1 : 0, status === 'miss' ? 1 : 0, row.master_id)
      }
      this.db.exec('COMMIT')
      return true
    } catch (error) {
      this.db.exec('ROLLBACK')
      return false
    }
  }

  /** 记录投票并更新 Elo；与浏览器 recordVote 同一套评分函数 */
  recordVote(matchId: string, vote: 'a' | 'b' | 'draw'): boolean {
    const row = this.db.prepare('SELECT payload FROM matches WHERE id = ?').get(matchId) as { payload: string } | undefined
    if (!row) return false
    const match = JSON.parse(row.payload) as BlindMatch
    if (match.vote) return false

    const [aId, bId] = match.masterIds
    const a = this.statsFor(aId)
    const b = this.statsFor(bId)
    if (!a || !b) return false
    const outcome = vote === 'a' ? 'win' : vote === 'b' ? 'loss' : 'draw'
    const [nextA, nextB] = updateElo(a, b, outcome)

    this.db.exec('BEGIN')
    try {
      this.writeStats(nextA)
      this.writeStats(nextB)
      match.vote = vote
      match.votedAt = Date.now()
      this.db.prepare('UPDATE matches SET payload = ? WHERE id = ?').run(JSON.stringify(match), matchId)
      this.db.exec('COMMIT')
      return true
    } catch {
      this.db.exec('ROLLBACK')
      return false
    }
  }

  private statsFor(masterId: string): MasterStats | null {
    const row = this.db
      .prepare(
        `SELECT master_id, rating, matches, wins, losses, draws, claims_resolved, claims_hit, claims_miss
         FROM stats WHERE master_id = ?`,
      )
      .get(masterId) as Record<string, unknown> | undefined
    if (!row) return null
    return {
      masterId: String(row.master_id) as MasterStats['masterId'],
      rating: Number(row.rating),
      matches: Number(row.matches),
      wins: Number(row.wins),
      losses: Number(row.losses),
      draws: Number(row.draws),
      claimsResolved: Number(row.claims_resolved),
      claimsHit: Number(row.claims_hit),
      claimsMiss: Number(row.claims_miss),
    }
  }

  private writeStats(stats: MasterStats): void {
    this.db
      .prepare(
        `UPDATE stats SET rating = ?, matches = ?, wins = ?, losses = ?, draws = ?,
         claims_resolved = ?, claims_hit = ?, claims_miss = ? WHERE master_id = ?`,
      )
      .run(
        stats.rating,
        stats.matches,
        stats.wins,
        stats.losses,
        stats.draws,
        stats.claimsResolved,
        stats.claimsHit,
        stats.claimsMiss,
        stats.masterId,
      )
  }

  leaderboard() {
    const activeIds = new Set(MASTERS.filter((master) => master.status === 'active').map((master) => master.id))
    const all = MASTERS.map((master) => this.statsFor(master.id) ?? emptyStats(master.id))
    return leaderboardRows(all.filter((stats) => activeIds.has(stats.masterId)))
  }

  reset(): void {
    this.db.exec('DELETE FROM matches; DELETE FROM claims; DELETE FROM stats;')
    this.seedStats()
  }

  close(): void {
    this.db.close()
  }
}
