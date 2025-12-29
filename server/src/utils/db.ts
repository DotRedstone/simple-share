import type { D1Database } from '@cloudflare/workers-types'

export interface Env {
  DB: D1Database
  FILES?: R2Bucket  // R2 bucket 现在是可选的
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
    // 显式查询所有字段，确保 password_hash 字段被正确返回
    const result = await this.db.prepare(
      'SELECT id, name, email, password_hash, phone, role, status, storage_quota, storage_used, group_id, avatar_url, created_at, updated_at FROM users WHERE email = ?'
    ).bind(email).first()
    
    if (result) {
      const user = result as any
      // D1 数据库返回的字段名是下划线格式
      // 确保 password_hash 字段存在
      if (user.password_hash === undefined && user.passwordHash === undefined) {
        console.warn('User query result - password_hash not found. Keys:', Object.keys(user))
      }
    }
    return result as any
  }

  async createUser(user: {
    id: string
    name: string
    email?: string
    passwordHash?: string
    phone?: string
    role?: 'admin' | 'user'
    groupId?: string
    avatarUrl?: string
  }) {
    const now = Date.now()
    // 如果没有指定组，默认使用 user_group
    const defaultGroupId = user.groupId || (user.role === 'admin' ? 'admin_group' : 'user_group')
    
    // 确保默认用户组存在
    await this.ensureDefaultGroups()
    
    await this.db
      .prepare(
        'INSERT INTO users (id, name, email, password_hash, phone, role, group_id, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(
        user.id,
        user.name,
        user.email || null,
        user.passwordHash || null,
        user.phone || null,
        user.role || 'user',
        defaultGroupId,
        user.avatarUrl || null,
        now,
        now
      )
      .run()
    
    // 更新用户组当前用户数
    await this.db.prepare('UPDATE user_groups SET current_users = current_users + 1 WHERE id = ?').bind(defaultGroupId).run()
  }

  async ensureDefaultStorageBackend(env: Env) {
    const now = Date.now()
    
    // 如果没有检测到 FILES 绑定，直接返回（或记录错误）
    if (!env.FILES) {
      console.warn('⚠️ 未检测到 FILES (R2 Bucket) 绑定，内置存储将不可用。')
      return
    }

    // 1. 确保内置 R2 后端记录存在
    const existing = await this.db.prepare('SELECT id, config FROM storage_backends WHERE id = ?').bind('system_r2').first<any>()
    
    if (!existing) {
      console.log('🚀 正在初始化内置 R2 存储后端...')
      await this.db.prepare(`
        INSERT INTO storage_backends (id, name, type, config, description, enabled, is_default, created_at, updated_at)
        VALUES ('system_r2', '内置 R2 存储', 'r2', ?, '系统核心资源（通过 Worker 绑定）', 1, 1, ?, ?)
      `).bind(
        JSON.stringify({ bucket: 'env.FILES', quotaGb: 10 }),
        now,
        now
      ).run()
    }

    // 2. 强制补齐用户组配额分配 (自愈逻辑)
    await this.ensureDefaultGroups()
    
    const groupAllocations = [
      { id: 'user_group', quota: 1.0, allocId: 'alloc_user_r2_fix' },
      { id: 'admin_group', quota: 1000.0, allocId: 'alloc_admin_r2_fix' }
    ]

    for (const item of groupAllocations) {
      const alloc = await this.db.prepare('SELECT id FROM group_storage_allocations WHERE group_id = ? AND storage_backend_id = ?').bind(item.id, 'system_r2').first()
      if (!alloc) {
        console.log(`🔧 正在为组 ${item.id} 自动挂载内置存储...`)
        await this.db.prepare(`
          INSERT INTO group_storage_allocations (id, group_id, storage_backend_id, quota_gb, created_at, updated_at)
          VALUES (?, ?, 'system_r2', ?, ?, ?)
        `).bind(item.allocId, item.id, item.quota, now, now).run()
      }
    }
  }

  // 系统设置相关 (用于 Zero-Config JWT)
  async getSetting(key: string): Promise<string | null> {
    try {
      const result = await this.db.prepare('SELECT value FROM system_settings WHERE key = ?').bind(key).first<{ value: string }>()
      return result ? result.value : null
    } catch (e) {
      return null
    }
  }

  async setSetting(key: string, value: string, description?: string) {
    const now = Date.now()
    await this.db.prepare(`
      INSERT INTO system_settings (key, value, description, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?
    `).bind(key, value, description || null, now, value, now).run()
  }

  async ensureDefaultGroups() {
    // 确保默认用户组存在
    const adminGroup = await this.db.prepare('SELECT * FROM user_groups WHERE id = ?').bind('admin_group').first()
    if (!adminGroup) {
      const now = Date.now()
      await this.db.prepare(
        'INSERT INTO user_groups (id, name, description, storage_quota, max_users, current_users, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind('admin_group', '管理员组', '系统管理员组', 1000.0, 100, 0, now, now).run()
    }
    
    const userGroup = await this.db.prepare('SELECT * FROM user_groups WHERE id = ?').bind('user_group').first()
    if (!userGroup) {
      const now = Date.now()
      await this.db.prepare(
        'INSERT INTO user_groups (id, name, description, storage_quota, max_users, current_users, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind('user_group', '用户组', '普通用户组', 1.0, 10000, 0, now, now).run()
    }
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
    storageBackendId?: string | null
    userId: string
    parentId?: number | null
    path: string
    type: 'folder' | 'pdf' | 'image' | 'video' | 'zip' | 'code'
  }) {
    const now = Date.now()
    const result = await this.db
      .prepare(
        'INSERT INTO files (name, size_bytes, mime_type, storage_key, storage_backend_id, user_id, parent_id, path, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(
        file.name,
        file.sizeBytes,
        file.mimeType || null,
        file.storageKey,
        file.storageBackendId || null,
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
    const groupQuota = await this.db.prepare('SELECT SUM(storage_quota) as total FROM user_groups').first<{ total: number }>()
    const r2Backends = await this.db.prepare('SELECT COUNT(*) as count FROM storage_backends WHERE type = "r2" AND enabled = 1').first<{ count: number }>()
    
    // 获取所有启用后端的总配额
    const backends = await this.db.prepare('SELECT config FROM storage_backends WHERE enabled = 1').all()
    let totalBackendQuota = 0
    if (backends.results) {
      for (const row of backends.results) {
        try {
          const config = JSON.parse((row as any).config)
          if (config.quotaGb && config.quotaGb > 0) {
            totalBackendQuota += config.quotaGb
          }
        } catch (e) {}
      }
    }

    return {
      totalFiles: totalFiles?.count || 0,
      totalSize: totalSize?.total || 0, // bytes
      totalUsers: totalUsers?.count || 0,
      activeUsers: activeUsers?.count || 0,
      totalGroupQuota: groupQuota?.total || 0, // GB
      r2Backends: r2Backends?.count || 0,
      totalBackendQuota: totalBackendQuota // GB
    }
  }

  // 用户组存储分配相关
  async getGroupStorageAllocationsByGroup(groupId: string) {
    const result = await this.db.prepare(
      `SELECT gsa.id,
              gsa.group_id,
              gsa.storage_backend_id,
              gsa.quota_gb,
              gsa.created_at,
              gsa.updated_at,
              sb.name            as backend_name,
              sb.type            as backend_type,
              sb.enabled         as backend_enabled
       FROM group_storage_allocations gsa
       JOIN storage_backends sb ON gsa.storage_backend_id = sb.id
       WHERE gsa.group_id = ?
       ORDER BY sb.name ASC`
    ).bind(groupId).all()
    return result.results as any[]
  }

  async createGroupStorageAllocation(allocation: {
    id: string
    groupId: string
    storageBackendId: string
    quotaGb: number
  }) {
    const now = Date.now()
    await this.db.prepare(
      `INSERT INTO group_storage_allocations
       (id, group_id, storage_backend_id, quota_gb, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      allocation.id,
      allocation.groupId,
      allocation.storageBackendId,
      allocation.quotaGb,
      now,
      now
    ).run()
  }

  async updateGroupStorageAllocation(id: string, updates: Partial<{ quotaGb: number }>) {
    const fields: string[] = []
    const values: any[] = []

    if (updates.quotaGb !== undefined) {
      fields.push('quota_gb = ?')
      values.push(updates.quotaGb)
    }

    if (fields.length === 0) return

    fields.push('updated_at = ?')
    values.push(Date.now())
    values.push(id)

    await this.db.prepare(
      `UPDATE group_storage_allocations SET ${fields.join(', ')} WHERE id = ?`
    ).bind(...values).run()
  }

  async deleteGroupStorageAllocation(id: string) {
    await this.db.prepare('DELETE FROM group_storage_allocations WHERE id = ?').bind(id).run()
  }

  // 获取所有文件（管理员）
  async getAllFiles(limit: number = 100) {
    const result = await this.db.prepare('SELECT * FROM files WHERE type != "folder" ORDER BY created_at DESC LIMIT ?').bind(limit).all()
    return result.results as any[]
  }

  // 存储后端相关
  async getAllStorageBackends() {
    const result = await this.db.prepare('SELECT * FROM storage_backends ORDER BY is_default DESC, created_at ASC').all()
    return result.results as any[]
  }

  async getStorageBackendById(id: string) {
    const result = await this.db.prepare('SELECT * FROM storage_backends WHERE id = ?').bind(id).first()
    return result as any
  }

  async getDefaultStorageBackend() {
    const result = await this.db.prepare('SELECT * FROM storage_backends WHERE is_default = 1 AND enabled = 1 LIMIT 1').first()
    return result as any
  }

  async createStorageBackend(backend: {
    id: string
    name: string
    type: 'r2' | 's3' | 'webdav' | 'ftp' | 'sftp'
    config: string // JSON string
    description?: string
    enabled?: boolean
    isDefault?: boolean
  }) {
    const now = Date.now()
    // 如果设置为默认，先取消其他默认
    if (backend.isDefault) {
      await this.db.prepare('UPDATE storage_backends SET is_default = 0').run()
    }
    
    await this.db
      .prepare(
        'INSERT INTO storage_backends (id, name, type, config, description, enabled, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(
        backend.id,
        backend.name,
        backend.type,
        backend.config,
        backend.description || null,
        backend.enabled ? 1 : 0,
        backend.isDefault ? 1 : 0,
        now,
        now
      )
      .run()
  }

  async updateStorageBackend(id: string, updates: Partial<{
    name: string
    config: string
    description: string
    enabled: boolean
    isDefault: boolean
  }>) {
    const fields: string[] = []
    const values: any[] = []

    if (updates.name) {
      fields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.config) {
      fields.push('config = ?')
      values.push(updates.config)
    }
    if (updates.description !== undefined) {
      fields.push('description = ?')
      values.push(updates.description)
    }
    if (updates.enabled !== undefined) {
      fields.push('enabled = ?')
      values.push(updates.enabled ? 1 : 0)
    }
    if (updates.isDefault !== undefined) {
      if (updates.isDefault) {
        // 先取消其他默认
        await this.db.prepare('UPDATE storage_backends SET is_default = 0').run()
      }
      fields.push('is_default = ?')
      values.push(updates.isDefault ? 1 : 0)
    }

    if (fields.length === 0) return

    fields.push('updated_at = ?')
    values.push(Date.now())
    values.push(id)

    await this.db.prepare(`UPDATE storage_backends SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()
  }

  async deleteStorageBackend(id: string) {
    // 检查是否有文件使用此存储后端
    const files = await this.db.prepare('SELECT COUNT(*) as count FROM files WHERE storage_backend_id = ?').bind(id).first<{ count: number }>()
    if (files && files.count > 0) {
      throw new Error('无法删除：仍有文件使用此存储后端')
    }
    await this.db.prepare('DELETE FROM storage_backends WHERE id = ?').bind(id).run()
  }
}

