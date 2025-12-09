#!/bin/bash

# SimpleShare 本地开发启动脚本

echo "🚀 启动 SimpleShare 开发环境..."
echo ""

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
  echo "❌ 错误: 请在项目根目录运行此脚本"
  exit 1
fi

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
  echo "📦 安装前端依赖..."
  npm install
fi

if [ ! -d "server/node_modules" ]; then
  echo "📦 安装后端依赖..."
  cd server
  npm install
  cd ..
fi

# 确保 functions 目录链接存在
if [ ! -d "dist/functions" ]; then
  echo "🔗 创建 functions 目录链接..."
  mkdir -p dist
  ln -sf ../server/functions dist/functions
fi

# 启动后端服务器（在 server 目录）
echo "📦 启动后端服务器 (端口 8788)..."
cd server
npm run dev &
BACKEND_PID=$!
cd ..

# 等待后端启动
echo "⏳ 等待后端服务器启动..."
sleep 5

# 启动前端开发服务器
echo "🎨 启动前端开发服务器 (端口 5173)..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ 开发环境已启动！"
echo "📡 后端 API: http://localhost:8788"
echo "🌐 前端应用: http://localhost:5173"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "echo ''; echo '🛑 正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait

