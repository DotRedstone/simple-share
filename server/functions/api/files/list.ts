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
    const parentId = url.searchParams.get('parentId') ? parseInt(url.searchParams.get('parentId')!) : null
    const tab = url.searchParams.get('tab') || 'all'

    let files: any[] = []

    if (tab === 'recent') {
      // 最近7天的文件
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      const result = await db.db
        .prepare('SELECT * FROM files WHERE user_id = ? AND type != "folder" AND created_at > ? ORDER BY created_at DESC')
        .bind(user.userId, sevenDaysAgo)
        .all()
      files = result.results as any[]
    } else if (tab === 'starred') {
      // 收藏的文件
      const result = await db.db
        .prepare('SELECT * FROM files WHERE user_id = ? AND starred = 1 ORDER BY created_at DESC')
        .bind(user.userId)
        .all()
      files = result.results as any[]
    } else if (tab === 'shares') {
      // 已分享的文件
      const shares = await db.getSharesByUserId(user.userId)
      const fileIds = shares.map(s => s.file_id)
      if (fileIds.length > 0) {
        const placeholders = fileIds.map(() => '?').join(',')
        const result = await db.db
          .prepare(`SELECT * FROM files WHERE id IN (${placeholders}) ORDER BY created_at DESC`)
          .bind(...fileIds)
          .all()
        files = result.results as any[]
      }
    } else {
      // 所有文件或指定文件夹
      files = await db.getFilesByUserId(user.userId, parentId)
    }

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

    // 构建文件夹树结构
    const buildTree = (parentId: number | null): any[] => {
      return formattedFiles
        .filter(f => f.parentId === parentId)
        .map(file => {
          if (file.type === 'folder') {
            return {
              ...file,
              children: buildTree(file.id)
            }
          }
          return file
        })
    }

    const tree = buildTree(parentId)

    return new Response(
      JSON.stringify({
        success: true,
        data: tree
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

