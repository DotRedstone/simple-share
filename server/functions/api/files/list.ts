import { Database } from '../../../src/utils/db'
import { requireAuth } from '../../../src/middleware/auth'
import { formatFileSize, getFileType } from '../../../src/utils/r2'
import type { Env } from '../../../src/utils/db'

export async function onRequestGet(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const db = new Database(env.DB)

  try {
    const user = await requireAuth(request, env)
    const url = new URL(request.url)
    24|    const parentId = url.searchParams.get('parentId') ? parseInt(url.searchParams.get('parentId')!) : null
    25|    const tab = url.searchParams.get('tab') || 'all'
    26|    const sortBy = url.searchParams.get('sortBy') || 'created_at'
    27|    const order = url.searchParams.get('order') || 'DESC'
    28|
    29|    let files: any[] = []
    30|
    31|    if (tab === 'recent') {
    32|      // 最近7天的文件
    33|      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    34|      const result = await db.db
    35|        .prepare(`SELECT * FROM files WHERE user_id = ? AND type != "folder" AND created_at > ? ORDER BY ${sortBy} ${order}`)
    36|        .bind(user.userId, sevenDaysAgo)
    37|        .all()
    38|      files = result.results as any[]
    39|    } else if (tab === 'starred') {
    40|      // 收藏的文件
    41|      const result = await db.db
    42|        .prepare(`SELECT * FROM files WHERE user_id = ? AND starred = 1 ORDER BY ${sortBy} ${order}`)
    43|        .bind(user.userId)
    44|        .all()
    45|      files = result.results as any[]
    46|    } else if (tab === 'shares') {
    47|      // 已分享的文件
    48|      const shares = await db.getSharesByUserId(user.userId)
    49|      const fileIds = shares.map(s => s.file_id)
    50|      if (fileIds.length > 0) {
    51|        const placeholders = fileIds.map(() => '?').join(',')
    52|        const result = await db.db
    53|          .prepare(`SELECT * FROM files WHERE id IN (${placeholders}) ORDER BY ${sortBy} ${order}`)
    54|          .bind(...fileIds)
    55|          .all()
    56|        files = result.results as any[]
    57|      }
    58|    } else {
    59|      // 所有文件或指定文件夹
    60|      files = await db.getFilesByUserId(user.userId, parentId, sortBy, order)
    61|    }

    // 转换为前端格式
    const formattedFiles = files.map(file => ({
      id: file.id,
      name: file.name,
      size: file.type === 'folder' ? '-' : formatFileSize(file.size_bytes),
      date: new Date(file.created_at).toISOString().split('T')[0],
      type: file.type,
      starred: file.starred === 1,
      mimeType: file.mime_type,
      uploadTime: new Date(file.created_at).toISOString(),
      storageKey: file.storage_key,
      userId: file.user_id,
      downloadCount: file.download_count,
      parentId: file.parent_id
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

