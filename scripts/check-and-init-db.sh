#!/bin/bash
# 数据库检查和初始化脚本
# 在构建时检查数据库是否已初始化

set -e

echo "🔍 检查数据库初始化状态..."

# 检查是否安装了 wrangler
if ! command -v npx &> /dev/null; then
  echo "⚠️  npx 未安装，跳过数据库检查"
  exit 0
fi

cd server

# 检查数据库是否存在表
DB_NAME="simpleshare-db"
SCHEMA_FILE="./src/db/schema.sql"

echo "📝 检查数据库表是否存在..."

# 尝试查询 users 表（如果表不存在会返回错误）
if npx wrangler d1 execute $DB_NAME --command="SELECT name FROM sqlite_master WHERE type='table' AND name='users';" 2>/dev/null | grep -q "users"; then
  echo "✅ 数据库表已存在，跳过初始化"
else
  echo "⚠️  数据库表不存在，需要初始化"
  echo ""
  echo "请执行以下命令初始化数据库："
  echo "  cd server"
  echo "  npx wrangler d1 execute $DB_NAME --file=$SCHEMA_FILE"
  echo ""
  echo "或者在 Cloudflare Dashboard 中："
  echo "  1. 进入 Workers & Pages → D1"
  echo "  2. 选择数据库 $DB_NAME"
  echo "  3. 执行 server/src/db/schema.sql 中的 SQL"
  echo ""
  # 不退出，让构建继续，但会显示警告
fi

cd ..

