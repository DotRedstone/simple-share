import { Database } from '../../../src/utils/db'
import { requireAuth } from '../../../src/middleware/auth'
import type { Env } from '../../../src/utils/db'

export async function onRequestPost(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const db = new Database(env.DB)

  try {
    const user = await requireAuth(request, env)
    const { name, parentId } = await request.json()

    if (!name || !name.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: '文件夹名称不能为空' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 构建路径
    let path = `/${name.trim()}`
    if (parentId) {
      const parent = await db.getFileById(parentId)
      if (parent) {
        path = `${parent.path}/${name.trim()}`
      }
    }

    // 创建文件夹
    const folderId = await db.createFile({
      name: name.trim(),
      sizeBytes: 0,
      storageKey: `folder_${user.userId}_${Date.now()}`,
      userId: user.userId,
      parentId: parentId || null,
      path,
      type: 'folder'
    })

    // 记录日志
    await db.createLog({
      action: '创建文件夹',
      userId: user.userId,
      userName: user.email,
      status: '成功',
      fileId: folderId,
      fileName: name.trim(),
      ip: request.headers.get('CF-Connecting-IP') || undefined
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: folderId,
          name: name.trim(),
          size: '-',
          date: new Date().toISOString().split('T')[0],
          type: 'folder',
          starred: false,
          children: []
        }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    if (error instanceof Response) return error
    
    return new Response(
      JSON.stringify({ success: false, error: '创建文件夹失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

