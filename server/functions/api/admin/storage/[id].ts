import { Database } from '../../../../src/utils/db'
import { requireAuth } from '../../../../src/middleware/auth'
import type { Env } from '../../../../src/utils/db'

export async function onRequestPut(
  context: { env: Env; request: Request; params: { id: string } }
): Promise<Response> {
  const { env, request, params } = context
  const db = new Database(env.DB)

  try {
    const user = await requireAuth(request, env)
    if (user.role !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, error: '权限不足' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body = await request.json()
    const updates: any = {}

    if (body.name !== undefined) updates.name = body.name
    if (body.config !== undefined) updates.config = JSON.stringify(body.config)
    if (body.description !== undefined) updates.description = body.description
    if (body.enabled !== undefined) updates.enabled = body.enabled
    if (body.isDefault !== undefined) updates.isDefault = body.isDefault

    await db.updateStorageBackend(params.id, updates)

    // 记录日志
    await db.createLog({
      action: '更新存储后端',
      userId: user.userId,
      userName: user.email,
      status: '成功',
      details: `存储后端ID: ${params.id}`
    })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    if (error instanceof Response) return error
    
    return new Response(
      JSON.stringify({ success: false, error: error.message || '更新存储后端失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function onRequestDelete(
  context: { env: Env; request: Request; params: { id: string } }
): Promise<Response> {
  const { env, request, params } = context
  const db = new Database(env.DB)

  try {
    const user = await requireAuth(request, env)
    if (user.role !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, error: '权限不足' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    await db.deleteStorageBackend(params.id)

    // 记录日志
    await db.createLog({
      action: '删除存储后端',
      userId: user.userId,
      userName: user.email,
      status: '成功',
      details: `存储后端ID: ${params.id}`
    })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    if (error instanceof Response) return error
    
    return new Response(
      JSON.stringify({ success: false, error: error.message || '删除存储后端失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

