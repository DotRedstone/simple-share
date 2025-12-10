#!/bin/bash
# Cloudflare Worker 部署脚本
# 用于 Cloudflare Dashboard 的部署命令

set -e

echo "📦 安装 server 依赖..."
cd server
if [ ! -d "node_modules" ]; then
  npm install
fi

echo "🚀 部署 Worker..."
npx wrangler deploy

echo "✅ 部署完成！"

