-- Seed data for development
-- Run this with: wrangler d1 execute simpleshare-db --file=./src/db/seed.sql

-- 创建默认用户组（必须的两个组）
INSERT OR IGNORE INTO user_groups (id, name, description, storage_quota, max_users, current_users, created_at, updated_at)
VALUES
  ('admin_group', '管理员组', '系统管理员组', 1000.0, 100, 0, unixepoch(), unixepoch()),
  ('user_group', '用户组', '普通用户组', 50.0, 10000, 0, unixepoch(), unixepoch());

