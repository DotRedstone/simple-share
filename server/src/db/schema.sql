-- SimpleShare Database Schema for Cloudflare D1

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
  status TEXT NOT NULL DEFAULT '活跃' CHECK(status IN ('活跃', '已暂停')),
  storage_quota REAL DEFAULT 50.0, -- GB
  storage_used REAL DEFAULT 0.0, -- GB
  group_id TEXT,
  auth_provider TEXT DEFAULT 'local' CHECK(auth_provider IN ('local', 'google', 'github', 'wechat', 'phone')),
  auth_provider_id TEXT,
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
  permissions TEXT, -- JSON array
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 文件表（元数据）
CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  mime_type TEXT,
  storage_key TEXT NOT NULL, -- 存储键
  storage_backend_id TEXT, -- 存储后端ID
  user_id TEXT NOT NULL,
  parent_id INTEGER, -- 父文件夹ID，NULL表示根目录
  path TEXT NOT NULL, -- 文件路径
  type TEXT NOT NULL CHECK(type IN ('folder', 'pdf', 'image', 'video', 'zip', 'code')),
  starred INTEGER DEFAULT 0, -- 0 or 1
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

-- 存储后端表（系统/管理员存储）
-- 存储后端表（管理员共享的存储）
CREATE TABLE IF NOT EXISTS storage_backends (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('r2', 's3', 'webdav', 'ftp', 'sftp')),
  enabled INTEGER DEFAULT 1, -- 0 or 1
  is_default INTEGER DEFAULT 0, -- 0 or 1
  is_shared INTEGER DEFAULT 1, -- 0 or 1, 是否共享给用户组
  config TEXT NOT NULL, -- JSON 配置
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
  enabled INTEGER DEFAULT 1, -- 0 or 1
  is_default INTEGER DEFAULT 0, -- 0 or 1
  config_encrypted TEXT NOT NULL, -- 加密的 JSON 配置
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

-- 用户存储后端表（用户自己的存储，加密）
CREATE TABLE IF NOT EXISTS user_storage_backends (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('r2', 's3', 'webdav', 'ftp', 'sftp')),
  enabled INTEGER DEFAULT 1, -- 0 or 1
  is_default INTEGER DEFAULT 0, -- 0 or 1
  config_encrypted TEXT NOT NULL, -- 加密的配置（使用用户密钥加密）
  description TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 用户组存储分配表（管理员分配给用户组的存储空间）
CREATE TABLE IF NOT EXISTS group_storage_allocations (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  storage_backend_id TEXT NOT NULL,
  quota_gb REAL NOT NULL, -- 分配的存储配额（GB）
  used_gb REAL DEFAULT 0.0, -- 已使用（GB）
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (group_id) REFERENCES user_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (storage_backend_id) REFERENCES storage_backends(id) ON DELETE CASCADE
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
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_parent_id ON files(parent_id);
CREATE INDEX IF NOT EXISTS idx_files_path ON files(path);
CREATE INDEX IF NOT EXISTS idx_shares_code ON shares(share_code);
CREATE INDEX IF NOT EXISTS idx_shares_file_id ON shares(file_id);
CREATE INDEX IF NOT EXISTS idx_shares_user_id ON shares(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_storage_backends_type ON storage_backends(type);
CREATE INDEX IF NOT EXISTS idx_storage_backends_enabled ON storage_backends(enabled);
CREATE INDEX IF NOT EXISTS idx_files_storage_backend_id ON files(storage_backend_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider, auth_provider_id);
CREATE INDEX IF NOT EXISTS idx_user_storage_backends_user_id ON user_storage_backends(user_id);
CREATE INDEX IF NOT EXISTS idx_group_storage_allocations_group_id ON group_storage_allocations(group_id);
CREATE INDEX IF NOT EXISTS idx_user_storage_backends_user_id ON user_storage_backends(user_id);
CREATE INDEX IF NOT EXISTS idx_user_storage_backends_enabled ON user_storage_backends(enabled);
CREATE INDEX IF NOT EXISTS idx_group_storage_allocations_group_id ON group_storage_allocations(group_id);
CREATE INDEX IF NOT EXISTS idx_group_storage_allocations_storage_backend_id ON group_storage_allocations(storage_backend_id);

