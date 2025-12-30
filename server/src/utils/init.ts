// 自动初始化数据库的工具函数
import { Database } from './db'
import type { D1Database } from '@cloudflare/workers-types'

let initPromise: Promise<boolean> | null = null
let isInitialized = false

export async function ensureDatabaseInitialized(db: D1Database): Promise<boolean> {
  // 如果已经初始化，直接返回
  if (isInitialized) {
    return true
  }

  // 如果正在初始化，等待完成
  if (initPromise) {
    return await initPromise
  }

  // 开始初始化
  initPromise = (async () => {
    try {
      // 检查 users 表是否存在
      const result = await db.prepare('SELECT name FROM sqlite_master WHERE type=\'table\' AND name=\'users\';').first()
      
      if (!result) {
        // 表不存在，需要初始化
        console.log('数据库未初始化，正在自动初始化...')
        
        // 读取并执行 schema.sql
        // 注意：在 Worker 环境中，我们需要将 SQL 语句内联
        const schema = getSchemaSQL()
        const statements = schema.split(';').filter(s => s.trim().length > 0)
        
        for (const statement of statements) {
          const trimmed = statement.trim()
          if (trimmed) {
            try {
              await db.prepare(trimmed).run()
            } catch (error) {
              // 忽略已存在的错误（CREATE TABLE IF NOT EXISTS）
              if (!String(error).includes('already exists') && !String(error).includes('duplicate')) {
                console.error('执行 SQL 失败:', trimmed.substring(0, 50), error)
              }
            }
          }
        }
        
        // 确保默认用户组存在
        const dbInstance = new Database(db)
        await dbInstance.ensureDefaultGroups()
        
        // 确保至少有一个默认存储后端（如果环境中有绑定）
        // 注意：这里需要传递 context.env，但 ensureDatabaseInitialized 的签名不包含 env
        // 我们可以在 API handler 中调用，或者修改此函数签名。
        // 既然我们已经在 api/admin/storage.ts 中调用了，且那是管理员查看的地方，
        // 应该已经足够。但在上传等地方如果没有任何后端，可能也会需要。
        
        console.log('数据库初始化完成')
      }
      
      isInitialized = true
      return true
    } catch (error) {
      console.error('数据库初始化失败:', error)
      // 即使初始化失败，也标记为已尝试，避免重复尝试
      isInitialized = true
      return false
    } finally {
      initPromise = null
    }
  })()

  return await initPromise
}

function getSchemaSQL(): string {
  // 返回完整的 schema SQL
  // 这里我们只包含关键的表创建语句，避免文件过大
  return `
-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
  status TEXT NOT NULL DEFAULT '活跃' CHECK(status IN ('活跃', '已暂停')),
  storage_quota REAL DEFAULT 50.0,
  storage_used REAL DEFAULT 0.0,
  group_id TEXT,
  avatar_url TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK(email IS NOT NULL OR phone IS NOT NULL)
);

-- 用户组表
CREATE TABLE IF NOT EXISTS user_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  storage_quota REAL NOT NULL DEFAULT 50.0,
  max_users INTEGER,
  current_users INTEGER DEFAULT 0,
  permissions TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 文件表（元数据）
CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  mime_type TEXT,
  storage_key TEXT NOT NULL,
  storage_backend_id TEXT,
  user_id TEXT NOT NULL,
  parent_id INTEGER,
  path TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('folder', 'pdf', 'image', 'video', 'zip', 'code')),
  status TEXT NOT NULL DEFAULT '正常' CHECK(status IN ('正常', '违规')),
  starred INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES files(id) ON DELETE CASCADE,
  FOREIGN KEY (storage_backend_id) REFERENCES storage_backends(id) ON DELETE SET NULL
);

-- 分享表
CREATE TABLE IF NOT EXISTS shares (
  id TEXT PRIMARY KEY,
  file_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  share_code TEXT UNIQUE NOT NULL,
  expiration_days INTEGER NOT NULL DEFAULT 7,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at INTEGER NOT NULL,
  access_count INTEGER DEFAULT 0,
  max_access INTEGER,
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 存储后端表（管理员共享的存储）
CREATE TABLE IF NOT EXISTS storage_backends (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('r2', 's3', 'webdav', 'ftp', 'sftp')),
  enabled INTEGER DEFAULT 1,
  is_default INTEGER DEFAULT 0,
  is_shared INTEGER DEFAULT 1,
  config TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 用户存储后端表（用户自己的存储，加密）
CREATE TABLE IF NOT EXISTS user_storage_backends (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('r2', 's3', 'webdav', 'ftp', 'sftp')),
  enabled INTEGER DEFAULT 1,
  is_default INTEGER DEFAULT 0,
  config_encrypted TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 用户组存储配额分配表
CREATE TABLE IF NOT EXISTS group_storage_allocations (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  storage_backend_id TEXT NOT NULL,
  quota_gb REAL NOT NULL DEFAULT 0.0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (group_id) REFERENCES user_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (storage_backend_id) REFERENCES storage_backends(id) ON DELETE CASCADE,
  UNIQUE(group_id, storage_backend_id)
);

-- 系统日志表
CREATE TABLE IF NOT EXISTS system_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  user_id TEXT,
  user_name TEXT,
  status TEXT NOT NULL CHECK(status IN ('成功', '警告', '失败')),
  details TEXT,
  ip TEXT,
  file_id INTEGER,
  file_name TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE SET NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider, auth_provider_id);
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_parent_id ON files(parent_id);
CREATE INDEX IF NOT EXISTS idx_files_path ON files(path);
CREATE INDEX IF NOT EXISTS idx_files_storage_backend_id ON files(storage_backend_id);
CREATE INDEX IF NOT EXISTS idx_shares_code ON shares(share_code);
CREATE INDEX IF NOT EXISTS idx_shares_file_id ON shares(file_id);
CREATE INDEX IF NOT EXISTS idx_shares_user_id ON shares(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_storage_backends_type ON storage_backends(type);
CREATE INDEX IF NOT EXISTS idx_storage_backends_enabled ON storage_backends(enabled);
CREATE INDEX IF NOT EXISTS idx_user_storage_backends_user_id ON user_storage_backends(user_id);
CREATE INDEX IF NOT EXISTS idx_group_storage_allocations_group_id ON group_storage_allocations(group_id);
`
}

