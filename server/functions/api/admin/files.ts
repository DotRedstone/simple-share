import { Database } from '../../../src/utils/db'
import { requireAdmin } from '../../../src/middleware/auth'
import { formatFileSize } from '../../../src/utils/r2'
import type { Env } from '../../../src/utils/db'

export async function onRequestGet(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const db = new Database(env.DB)

  try {
    await requireAdmin(request, env)

    // 获取所有文件
    const result = await db.db.prepare('SELECT f.*, u.name as uploader_name, u.email as uploader_email FROM files f LEFT JOIN users u ON f.user_id = u.id WHERE f.type != "folder" ORDER BY f.created_at DESC LIMIT 100').all()
    const files = result.results as any[]

    const formattedFiles = files.map(file => ({
      id: `file_${file.id}`,
      name: file.name,
      uploader: file.uploader_name || file.uploader_email || 'unknown',
      size: formatFileSize(file.size_bytes),
      uploaded: new Date(file.created_at).toISOString().split('T')[0]
    }))

    return new Response(
      JSON.stringify({
        success: true,
        data: formattedFiles
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    if (error instanceof Response) return error
    
    return new Response(
      JSON.stringify({ success: false, error: '获取文件列表失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

