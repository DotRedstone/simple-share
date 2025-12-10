#!/usr/bin/env node
/**
 * 空部署脚本
 * 
 * Cloudflare Pages 会自动部署 dist 目录，不需要额外的部署命令。
 * 如果 Cloudflare Pages 配置了部署命令，这个脚本会成功执行但不做任何操作。
 * 
 * 正确的做法：在 Cloudflare Dashboard 中删除部署命令（Deploy command），留空即可。
 */

console.log('ℹ️  Cloudflare Pages 会自动部署 dist 目录，不需要额外的部署命令。')
console.log('ℹ️  请在 Cloudflare Dashboard → Settings → Builds & deployments 中删除 Deploy command。')
console.log('✓  部署脚本执行完成（无操作）')

process.exit(0)

