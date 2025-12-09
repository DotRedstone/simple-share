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
    await requireAdmin(request, env)

    await db.deleteUserGroup(params.id)

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

