import { Database } from '../../../src/utils/db'
import { requireAdmin } from '../../../src/middleware/auth'
import { formatFileSize } from '../../../src/utils/r2'
import type { Env } from '../../../src/utils/db'

export async function onRequestGet(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const db = new Database(env.DB)

  try {
    await requireAdmin(request, env)

    const url = new URL(request.url)
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 100
    const sortBy = url.searchParams.get('sortBy') || 'f.created_at'
    const order = url.searchParams.get('order') || 'DESC'

    // 获取所有文件
    const result = await db.db.prepare(`SELECT f.*, u.name as uploader_name, u.email as uploader_email FROM files f LEFT JOIN users u ON f.user_id = u.id WHERE f.type != "folder" ORDER BY ${sortBy} ${order} LIMIT ?`).bind(limit).all()
    const files = result.results as any[]

    const formattedFiles = files.map(file => ({
      id: file.id, // 使用原始 ID
      name: file.name,
      uploader: file.uploader_name || file.uploader_email || '未知',
      size: file.size_bytes === 0 ? '已下架' : formatFileSize(file.size_bytes),
      size_bytes: file.size_bytes, // 传回原始字节用于前端排序
      uploaded: new Date(file.created_at).toISOString().split('T')[0],
      type: file.type,
      status: file.size_bytes === 0 ? '违规' : '正常'
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
