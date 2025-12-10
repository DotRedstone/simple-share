#!/usr/bin/env node
/**
 * 数据库初始化脚本
 * 检查数据库表是否存在，如果不存在则初始化
 */

import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { join } from 'path'

const schemaPath = join(process.cwd(), 'server', 'src', 'db', 'schema.sql')
const dbName = 'simpleshare-db'

console.log('🔍 检查数据库初始化状态...')

try {
  // 读取 schema.sql
  const schema = readFileSync(schemaPath, 'utf-8')
  
  // 执行数据库初始化
  // 注意：这需要在 Cloudflare 环境中执行，本地无法直接执行
  // 这里只是输出提示信息
  console.log('📝 数据库 Schema 文件已准备：', schemaPath)
  console.log('')
  console.log('⚠️  注意：数据库初始化需要在 Cloudflare Dashboard 中手动执行，或使用 Wrangler CLI：')
  console.log('')
  console.log('   方法一：使用 Wrangler CLI（推荐）')
  console.log('   cd server')
  console.log(`   npx wrangler d1 execute ${dbName} --file=./src/db/schema.sql`)
  console.log('')
  console.log('   方法二：在 Cloudflare Dashboard 中执行')
  console.log('   1. 进入 Workers & Pages → D1')
  console.log(`   2. 选择数据库 ${dbName}`)
  console.log('   3. 点击 "Console" 或 "Execute SQL"')
  console.log('   4. 复制并执行 server/src/db/schema.sql 中的 SQL')
  console.log('')
  
  // 检查是否在 CI/CD 环境中（Cloudflare Pages 构建）
  if (process.env.CF_PAGES || process.env.CI) {
    console.log('ℹ️  检测到 CI/CD 环境，数据库初始化需要在部署后手动执行')
  }
  
  process.exit(0)
} catch (error) {
  console.error('❌ 数据库初始化检查失败:', error)
  process.exit(1)
}

