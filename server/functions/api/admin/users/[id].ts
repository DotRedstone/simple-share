import { Database } from '../../../../src/utils/db'
import { requireAdmin } from '../../../../src/middleware/auth'
import type { Env } from '../../../../src/utils/db'

export async function onRequestPut(context: { env: Env; request: Request; params: { id: string } }): Promise<Response> {
  const { env, request, params } = context
  const db = new Database(env.DB)

  try {
    await requireAdmin(request, env)
    const { name, status, storageQuota, groupId } = await request.json()

    const updates: any = {}
    if (name) updates.name = name
    if (status) updates.status = status
    if (storageQuota !== undefined) updates.storageQuota = storageQuota
    if (groupId !== undefined) updates.groupId = groupId

    await db.updateUser(params.id, updates)

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

export async function onRequestDelete(context: { env: Env; request: Request; params: { id: string } }): Promise<Response> {
  const { env, request, params } = context
  const db = new Database(env.DB)

  try {
    const admin = await requireAdmin(request, env)

    // 先获取用户信息用于日志（因为删除后就查不到了）
    const targetUser = await db.getUserById(params.id)
    const targetUserName = targetUser ? targetUser.name : params.id

    // 物理删除用户
    await db.deleteUser(params.id)

    // 记录日志，使用管理员身份
    await db.createLog({
      action: '删除用户',
      userId: admin.userId,
      userName: admin.name,
      status: '成功',
      details: `已删除用户: ${targetUserName} (ID: ${params.id})`,
      ip: request.headers.get('CF-Connecting-IP') || undefined
    })

    return new Response(
      JSON.stringify({ success: true, message: '删除成功' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    if (error instanceof Response) return error
    
    console.error('Delete user error:', error)
    return new Response(
      JSON.stringify({ success: false, error: '删除失败: ' + (error.message || '未知错误') }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

