-- 迁移脚本：添加用户存储、OAuth登录等功能

-- 添加用户存储后端表
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

-- 添加用户组存储分配表
CREATE TABLE IF NOT EXISTS group_storage_allocations (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  storage_backend_id TEXT NOT NULL,
  quota_gb REAL NOT NULL,
  used_gb REAL DEFAULT 0.0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (group_id) REFERENCES user_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (storage_backend_id) REFERENCES storage_backends(id) ON DELETE CASCADE
);

-- 更新用户表，添加OAuth字段
ALTER TABLE users ADD COLUMN phone TEXT;
ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'local';
ALTER TABLE users ADD COLUMN auth_provider_id TEXT;
ALTER TABLE users ADD COLUMN encryption_key TEXT;

-- 更新用户组表，添加系统组标记
ALTER TABLE user_groups ADD COLUMN is_system INTEGER DEFAULT 0;

-- 创建默认用户组
INSERT OR IGNORE INTO user_groups (id, name, description, storage_quota, is_system, created_at, updated_at)
VALUES 
  ('admin_group', '管理员组', '系统管理员组', 1000.0, 1, unixepoch(), unixepoch()),
  ('user_group', '普通用户组', '默认用户组', 50.0, 1, unixepoch(), unixepoch());

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_storage_backends_user_id ON user_storage_backends(user_id);
CREATE INDEX IF NOT EXISTS idx_user_storage_backends_enabled ON user_storage_backends(enabled);
CREATE INDEX IF NOT EXISTS idx_group_storage_allocations_group_id ON group_storage_allocations(group_id);
CREATE INDEX IF NOT EXISTS idx_group_storage_allocations_storage_backend_id ON group_storage_allocations(storage_backend_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);

