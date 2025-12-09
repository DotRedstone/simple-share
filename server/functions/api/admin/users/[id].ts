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
    await requireAdmin(request, env)

    await db.deleteUser(params.id)

    // 记录日志
    await db.createLog({
      action: '删除用户',
      userId: params.id,
      status: '成功',
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

