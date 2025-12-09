import type { D1Database } from '@cloudflare/workers-types'

export interface Env {
  DB: D1Database
  FILES: R2Bucket
  JWT_SECRET: string
  R2_PUBLIC_URL?: string
}

export class Database {
  constructor(public db: D1Database) {}

  async getUserById(id: string) {
    const result = await this.db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first()
    return result as any
  }

  async getUserByEmail(email: string) {
    const result = await this.db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first()
    return result as any
  }

  async createUser(user: {
    id: string
    name: string
    email: string
    passwordHash: string
    role?: 'admin' | 'user'
    groupId?: string
  }) {
    const now = Date.now()
    await this.db
      .prepare(
        'INSERT INTO users (id, name, email, password_hash, role, group_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(user.id, user.name, user.email, user.passwordHash, user.role || 'user', user.groupId || null, now, now)
      .run()
  }

  async updateUser(id: string, updates: Partial<{ name: string; status: string; storageQuota: number; groupId: string }>) {
    const fields: string[] = []
    const values: any[] = []

    if (updates.name) {
      fields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.status) {
      fields.push('status = ?')
      values.push(updates.status)
    }
    if (updates.storageQuota !== undefined) {
      fields.push('storage_quota = ?')
      values.push(updates.storageQuota)
    }
    if (updates.groupId !== undefined) {
      fields.push('group_id = ?')
      values.push(updates.groupId)
    }

    if (fields.length === 0) return

    fields.push('updated_at = ?')
    values.push(Date.now())
    values.push(id)

    await this.db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()
  }

  async deleteUser(id: string) {
    await this.db.prepare('DELETE FROM users WHERE id = ?').bind(id).run()
  }

  async getAllUsers() {
    const result = await this.db.prepare('SELECT * FROM users ORDER BY created_at DESC').all()
    return result.results as any[]
  }

  // 文件相关
  async getFileById(id: number) {
    const result = await this.db.prepare('SELECT * FROM files WHERE id = ?').bind(id).first()
    return result as any
  }

  async getFilesByUserId(userId: string, parentId?: number | null) {
    if (parentId === null || parentId === undefined) {
      const result = await this.db.prepare('SELECT * FROM files WHERE user_id = ? AND parent_id IS NULL ORDER BY created_at DESC').bind(userId).all()
      return result.results as any[]
    }
    const result = await this.db.prepare('SELECT * FROM files WHERE user_id = ? AND parent_id = ? ORDER BY created_at DESC').bind(userId, parentId).all()
    return result.results as any[]
  }

  async createFile(file: {
    name: string
    sizeBytes: number
    mimeType?: string
    storageKey: string
    userId: string
    parentId?: number | null
    path: string
    type: 'folder' | 'pdf' | 'image' | 'video' | 'zip' | 'code'
  }) {
    const now = Date.now()
    const result = await this.db
      .prepare(
        'INSERT INTO files (name, size_bytes, mime_type, storage_key, user_id, parent_id, path, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(
        file.name,
        file.sizeBytes,
        file.mimeType || null,
        file.storageKey,
        file.userId,
        file.parentId || null,
        file.path,
        file.type,
        now,
        now
      )
      .run()

    return result.meta.last_row_id
  }

  async updateFile(id: number, updates: Partial<{ name: string; starred: boolean }>) {
    const fields: string[] = []
    const values: any[] = []

    if (updates.name) {
      fields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.starred !== undefined) {
      fields.push('starred = ?')
      values.push(updates.starred ? 1 : 0)
    }

    if (fields.length === 0) return

    fields.push('updated_at = ?')
    values.push(Date.now())
    values.push(id)

    await this.db.prepare(`UPDATE files SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()
  }

  async deleteFile(id: number) {
    await this.db.prepare('DELETE FROM files WHERE id = ?').bind(id).run()
  }

  async incrementDownloadCount(id: number) {
    await this.db.prepare('UPDATE files SET download_count = download_count + 1 WHERE id = ?').bind(id).run()
  }

  // 分享相关
  async createShare(share: {
    id: string
    fileId: number
    userId: string
    shareCode: string
    expirationDays: number
    expiresAt: number
    maxAccess?: number
  }) {
    await this.db
      .prepare(
        'INSERT INTO shares (id, file_id, user_id, share_code, expiration_days, created_at, expires_at, access_count, max_access) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(
        share.id,
        share.fileId,
        share.userId,
        share.shareCode,
        share.expirationDays,
        Date.now(),
        share.expiresAt,
        0,
        share.maxAccess || null
      )
      .run()
  }

  async getShareByCode(shareCode: string) {
    const result = await this.db.prepare('SELECT * FROM shares WHERE share_code = ? AND expires_at > ?').bind(shareCode, Date.now()).first()
    return result as any
  }

  async getShareByFileId(fileId: number) {
    const result = await this.db.prepare('SELECT * FROM shares WHERE file_id = ? AND expires_at > ?').bind(fileId, Date.now()).first()
    return result as any
  }

  async getSharesByUserId(userId: string) {
    const result = await this.db.prepare('SELECT * FROM shares WHERE user_id = ? ORDER BY created_at DESC').bind(userId).all()
    return result.results as any[]
  }

  async incrementShareAccess(shareCode: string) {
    await this.db.prepare('UPDATE shares SET access_count = access_count + 1 WHERE share_code = ?').bind(shareCode).run()
  }

  async deleteShare(id: string) {
    await this.db.prepare('DELETE FROM shares WHERE id = ?').bind(id).run()
  }

  // 日志相关
  async createLog(log: {
    action: string
    userId?: string
    userName?: string
    status: '成功' | '警告' | '失败'
    details?: string
    ip?: string
    fileId?: number
    fileName?: string
  }) {
    await this.db
      .prepare(
        'INSERT INTO system_logs (action, user_id, user_name, status, details, ip, file_id, file_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(
        log.action,
        log.userId || null,
        log.userName || null,
        log.status,
        log.details || null,
        log.ip || null,
        log.fileId || null,
        log.fileName || null,
        Date.now()
      )
      .run()
  }

  async getLogs(limit: number = 100) {
    const result = await this.db.prepare('SELECT * FROM system_logs ORDER BY created_at DESC LIMIT ?').bind(limit).all()
    return result.results as any[]
  }

  // 用户组相关
  async createUserGroup(group: {
    id: string
    name: string
    description?: string
    storageQuota: number
    maxUsers?: number
  }) {
    const now = Date.now()
    await this.db
      .prepare('INSERT INTO user_groups (id, name, description, storage_quota, max_users, current_users, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(group.id, group.name, group.description || null, group.storageQuota, group.maxUsers || null, 0, now, now)
      .run()
  }

  async getUserGroups() {
    const result = await this.db.prepare('SELECT * FROM user_groups ORDER BY created_at DESC').all()
    return result.results as any[]
  }

  async updateUserGroup(id: string, updates: Partial<{ name: string; description: string; storageQuota: number; maxUsers: number }>) {
    const fields: string[] = []
    const values: any[] = []

    if (updates.name) {
      fields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.description !== undefined) {
      fields.push('description = ?')
      values.push(updates.description)
    }
    if (updates.storageQuota !== undefined) {
      fields.push('storage_quota = ?')
      values.push(updates.storageQuota)
    }
    if (updates.maxUsers !== undefined) {
      fields.push('max_users = ?')
      values.push(updates.maxUsers)
    }

    if (fields.length === 0) return

    fields.push('updated_at = ?')
    values.push(Date.now())
    values.push(id)

    await this.db.prepare(`UPDATE user_groups SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()
  }

  async deleteUserGroup(id: string) {
    await this.db.prepare('DELETE FROM user_groups WHERE id = ?').bind(id).run()
  }

  // 统计相关
  async getStorageStats() {
    const totalFiles = await this.db.prepare('SELECT COUNT(*) as count FROM files WHERE type != "folder"').first<{ count: number }>()
    const totalSize = await this.db.prepare('SELECT SUM(size_bytes) as total FROM files WHERE type != "folder"').first<{ total: number }>()
    const totalUsers = await this.db.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>()
    const activeUsers = await this.db.prepare('SELECT COUNT(*) as count FROM users WHERE status = "活跃"').first<{ count: number }>()

    return {
      totalFiles: totalFiles?.count || 0,
      totalSize: totalSize?.total || 0,
      totalUsers: totalUsers?.count || 0,
      activeUsers: activeUsers?.count || 0
    }
  }

  // 获取所有文件（管理员）
  async getAllFiles(limit: number = 100) {
    const result = await this.db.prepare('SELECT * FROM files WHERE type != "folder" ORDER BY created_at DESC LIMIT ?').bind(limit).all()
    return result.results as any[]
  }
}

