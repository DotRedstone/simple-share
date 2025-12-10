#!/usr/bin/env node
/**
 * 部署前准备脚本
 * 如果设置了 D1_DATABASE_ID 环境变量，会自动取消注释 wrangler.toml 中的绑定配置
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const wranglerPath = join(process.cwd(), 'wrangler.toml')
const d1DatabaseId = process.env.D1_DATABASE_ID

if (!d1DatabaseId) {
  console.log('ℹ️  D1_DATABASE_ID 环境变量未设置，使用 Dashboard 绑定配置')
  process.exit(0)
}

console.log('📝 检测到 D1_DATABASE_ID 环境变量，正在更新 wrangler.toml...')

let content = readFileSync(wranglerPath, 'utf-8')

// 取消注释本地开发配置
content = content.replace(
  /# \[\[d1_databases\]\]\s*\n# binding = "DB"\s*\n# database_name = "simpleshare-db"\s*\n# database_id = "\$\{D1_DATABASE_ID\}"/,
  `[[d1_databases]]
binding = "DB"
database_name = "simpleshare-db"
database_id = "${d1DatabaseId}"`
)

content = content.replace(
  /# \[\[r2_buckets\]\]\s*\n# binding = "FILES"\s*\n# bucket_name = "simpleshare-files"/,
  `[[r2_buckets]]
binding = "FILES"
bucket_name = "simpleshare-files"`
)

// 取消注释生产环境配置
content = content.replace(
  /# \[\[env\.production\.d1_databases\]\]\s*\n# binding = "DB"\s*\n# database_name = "simpleshare-db"\s*\n# database_id = "YOUR_DATABASE_ID_HERE"/,
  `[[env.production.d1_databases]]
binding = "DB"
database_name = "simpleshare-db"
database_id = "${d1DatabaseId}"`
)

content = content.replace(
  /# \[\[env\.production\.r2_buckets\]\]\s*\n# binding = "FILES"\s*\n# bucket_name = "simpleshare-files"/,
  `[[env.production.r2_buckets]]
binding = "FILES"
bucket_name = "simpleshare-files"`
)

writeFileSync(wranglerPath, content, 'utf-8')
console.log('✅ wrangler.toml 已更新')

