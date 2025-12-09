import { Database } from '../../../src/utils/db'
import { requireAuth } from '../../../src/middleware/auth'
import { deleteFromR2 } from '../../../src/utils/r2'
import type { Env } from '../../../src/utils/db'

// 更新文件（重命名、收藏）
export async function onRequestPut(context: { env: Env; request: Request; params: { id: string } }): Promise<Response> {
  const { env, request, params } = context
  const db = new Database(env.DB)

  try {
    const user = await requireAuth(request, env)
    const fileId = parseInt(params.id)
    const { name, starred } = await request.json()

    const file = await db.getFileById(fileId)
    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: '文件不存在' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 检查权限
    if (file.user_id !== user.userId && user.role !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, error: '无权修改此文件' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const updates: any = {}
    if (name) updates.name = name
    if (starred !== undefined) updates.starred = starred

    await db.updateFile(fileId, updates)

    // 记录日志
    await db.createLog({
      action: name ? '重命名文件' : '收藏文件',
      userId: user.userId,
      userName: user.email,
      status: '成功',
      fileId,
      fileName: file.name,
      ip: request.headers.get('CF-Connecting-IP') || undefined
    })

    return new Response(
      JSON.stringify({ success: true, message: '更新成功' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    if (error instanceof Response) return error
    
    return new Response(
      JSON.stringify({ success: false, error: '更新失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// 删除文件
export async function onRequestDelete(context: { env: Env; request: Request; params: { id: string } }): Promise<Response> {
  const { env, request, params } = context
  const db = new Database(env.DB)

  try {
    const user = await requireAuth(request, env)
    const fileId = parseInt(params.id)

    const file = await db.getFileById(fileId)
    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: '文件不存在' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 检查权限
    if (file.user_id !== user.userId && user.role !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, error: '无权删除此文件' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 从 R2 删除文件（如果不是文件夹）
    if (file.type !== 'folder') {
      await deleteFromR2(env.FILES, file.storage_key)
    }

    // 更新用户存储使用量
    const userData = await db.getUserById(user.userId)
    if (userData && file.type !== 'folder') {
      const newSize = Math.max(0, (userData.storage_used || 0) - file.size_bytes / (1024 * 1024 * 1024))
      await db.updateUser(user.userId, { storageUsed: newSize })
    }

    // 删除数据库记录
    await db.deleteFile(fileId)

    // 记录日志
    await db.createLog({
      action: '删除文件',
      userId: user.userId,
      userName: user.email,
      status: '成功',
      fileId,
      fileName: file.name,
      ip: request.headers.get('CF-Connecting-IP') || undefined
    })

    return new Response(
      JSON.stringify({ success: true, message: '删除成功' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    if (error instanceof Response) return error
    
    return new Response(
      JSON.stringify({ success: false, error: '删除失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

