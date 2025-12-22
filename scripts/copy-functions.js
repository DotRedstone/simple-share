import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const projectRoot = path.resolve(__dirname, '..')
const sourceDir = path.join(projectRoot, 'server', 'functions')
const targetDir = path.join(projectRoot, 'dist', 'functions')

async function main() {
  try {
    if (!fs.existsSync(sourceDir)) {
      console.warn('[copy-functions] 源目录不存在:', sourceDir)
      return
    }

    // 确保 dist 目录存在
    const distDir = path.join(projectRoot, 'dist')
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true })
    }

    // 清理旧的目标目录
    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true })
    }

    // 递归复制 server/functions 到 dist/functions
    fs.cpSync(sourceDir, targetDir, { recursive: true })

    console.log('[copy-functions] 已将 server/functions 复制到 dist/functions')
  } catch (err) {
    console.error('[copy-functions] 复制函数目录失败:', err)
    process.exitCode = 1
  }
}

main()


