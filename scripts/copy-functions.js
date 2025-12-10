import { cpSync } from 'fs'
import { join } from 'path'

// 将 server/functions 复制到 dist/functions
// 同时将 server/src 复制到 dist/src，因为 Functions 文件中的导入路径是相对于 dist/ 的
// 例如：_middleware.ts 使用 '../src/utils/cors'，期望 src 在 dist/ 目录下
const functionsSourceDir = join(process.cwd(), 'server', 'functions')
const functionsDestDir = join(process.cwd(), 'dist', 'functions')
const srcSourceDir = join(process.cwd(), 'server', 'src')
const srcDestDir = join(process.cwd(), 'dist', 'src')

try {
  // 复制 functions 目录
  cpSync(functionsSourceDir, functionsDestDir, { recursive: true })
  console.log('✓ Functions copied to dist/functions')
  
  // 复制 src 目录到 dist/src（Functions 需要引用这些工具文件）
  // Functions 文件中的导入路径如 '../src/utils/cors' 期望 src 在 dist/ 目录下
  cpSync(srcSourceDir, srcDestDir, { recursive: true })
  console.log('✓ Server source files copied to dist/src')
} catch (error) {
  console.error('Error copying files:', error)
  process.exit(1)
}

