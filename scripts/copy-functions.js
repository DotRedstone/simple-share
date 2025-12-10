import { cpSync } from 'fs'
import { join } from 'path'

// 将 server/functions 复制到 dist/functions
const sourceDir = join(process.cwd(), 'server', 'functions')
const destDir = join(process.cwd(), 'dist', 'functions')

try {
  cpSync(sourceDir, destDir, { recursive: true })
  console.log('✓ Functions copied to dist/functions')
} catch (error) {
  console.error('Error copying functions:', error)
  process.exit(1)
}

