-- Seed data for development
-- Run this with: wrangler d1 execute simpleshare-db --file=./src/db/seed.sql

-- 创建默认管理员账户
-- 密码: admin123 (请在生产环境中修改)
INSERT OR IGNORE INTO users (id, name, email, password_hash, role, status, storage_quota, created_at, updated_at)
VALUES (
  'admin_001',
  'admin',
  'admin@simpleshare.com',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', -- admin123
  'admin',
  '活跃',
  1000.0,
  unixepoch(),
  unixepoch()
);

-- 创建默认用户组
INSERT OR IGNORE INTO user_groups (id, name, description, storage_quota, max_users, current_users, created_at, updated_at)
VALUES
  ('grp_001', '管理员组', '系统管理员', 1000.0, 10, 1, unixepoch(), unixepoch()),
  ('grp_002', '标准用户组', '普通用户', 50.0, 1000, 0, unixepoch(), unixepoch()),
  ('grp_003', '高级用户组', '高级用户', 200.0, 100, 0, unixepoch(), unixepoch());

