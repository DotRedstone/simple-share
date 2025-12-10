#!/bin/bash
# Cloudflare Worker 部署脚本
# 用于 Cloudflare Dashboard 的部署命令

set -e

echo "📦 安装 server 依赖..."
cd server
if [ ! -d "node_modules" ]; then
  npm install
fi

echo "🔍 检查数据库初始化状态..."
# 尝试检查 users 表是否存在
if npx wrangler d1 execute simpleshare-db --command="SELECT name FROM sqlite_master WHERE type='table' AND name='users';" 2>/dev/null | grep -q "users"; then
  echo "✅ 数据库表已存在，跳过初始化"
else
  echo "📝 数据库表不存在，正在初始化..."
  echo "执行数据库 Schema..."
  npx wrangler d1 execute simpleshare-db --file=./src/db/schema.sql
  echo "✅ 数据库初始化完成"
fi

echo "🚀 部署 Worker..."
npx wrangler deploy

echo "✅ 部署完成！"

