#!/usr/bin/env node
// 部署前准备：如果设置了 D1_DATABASE_ID 环境变量，自动配置绑定

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const wranglerPath = join(process.cwd(), 'wrangler.toml')
const d1DatabaseId = process.env.D1_DATABASE_ID

if (!d1DatabaseId) {
  // 未设置环境变量，使用 Dashboard 绑定（推荐）
  process.exit(0)
}

console.log('配置 D1 数据库绑定...')
let content = readFileSync(wranglerPath, 'utf-8')

// 取消注释并配置本地开发绑定
const localPattern = /# \[\[d1_databases\]\]\s*\n# binding = "DB"\s*\n# database_name = "simpleshare-db"\s*\n# database_id = ""\s*\n\n# \[\[r2_buckets\]\]\s*\n# binding = "FILES"\s*\n# bucket_name = "simpleshare-files"/s
if (localPattern.test(content)) {
  content = content.replace(
    localPattern,
    `[[d1_databases]]
binding = "DB"
database_name = "simpleshare-db"
database_id = "${d1DatabaseId}"

[[r2_buckets]]
binding = "FILES"
bucket_name = "simpleshare-files"`
  )
}

// 取消注释并配置生产环境绑定
const prodPattern = /# \[\[env\.production\.d1_databases\]\]\s*\n# binding = "DB"\s*\n# database_name = "simpleshare-db"\s*\n# database_id = ""\s*\n\n# \[\[env\.production\.r2_buckets\]\]\s*\n# binding = "FILES"\s*\n# bucket_name = "simpleshare-files"/s
if (prodPattern.test(content)) {
  content = content.replace(
    prodPattern,
    `[[env.production.d1_databases]]
binding = "DB"
database_name = "simpleshare-db"
database_id = "${d1DatabaseId}"

[[env.production.r2_buckets]]
binding = "FILES"
bucket_name = "simpleshare-files"`
  )
}

writeFileSync(wranglerPath, content, 'utf-8')
console.log('✅ 绑定配置已更新')
