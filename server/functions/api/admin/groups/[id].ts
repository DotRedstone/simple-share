import { Database } from '../../../../src/utils/db'
import { requireAdmin } from '../../../../src/middleware/auth'
import type { Env } from '../../../../src/utils/db'

export async function onRequestPut(context: { env: Env; request: Request; params: { id: string } }): Promise<Response> {
  const { env, request, params } = context
  const db = new Database(env.DB)

  try {
    await requireAdmin(request, env)
    const { name, description, storageQuota, maxUsers } = await request.json()

    const updates: any = {}
    if (name) updates.name = name
    if (description !== undefined) updates.description = description
    if (storageQuota !== undefined) updates.storageQuota = storageQuota
    if (maxUsers !== undefined) updates.maxUsers = maxUsers

    await db.updateUserGroup(params.id, updates)

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

    // 获取组名用于日志
    const groups = await db.getUserGroups()
    const targetGroup = groups.find(g => g.id === params.id)
    const targetGroupName = targetGroup ? targetGroup.name : params.id

    await db.deleteUserGroup(params.id)

    // 记录日志
    await db.createLog({
      action: '删除用户组',
      userId: admin.userId,
      userName: admin.name,
      status: '成功',
      details: `已删除用户组: ${targetGroupName} (ID: ${params.id})`,
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

