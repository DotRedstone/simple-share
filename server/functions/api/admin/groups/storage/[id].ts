import { Database } from '../../../../../src/utils/db'
import { requireAdmin } from '../../../../../src/middleware/auth'
import type { Env } from '../../../../../src/utils/db'

export async function onRequestPut(context: { env: Env; request: Request; params: { id: string } }): Promise<Response> {
  const { env, request, params } = context
  const db = new Database(env.DB)

  try {
    await requireAdmin(request, env)
    const { quotaGb } = await request.json()

    if (quotaGb === undefined) {
      return new Response(
        JSON.stringify({ success: false, error: 'quotaGb 不能为空' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    await db.updateGroupStorageAllocation(params.id, { quotaGb: Number(quotaGb) })

    return new Response(
      JSON.stringify({ success: true, message: '更新成功' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    if (error instanceof Response) return error

    return new Response(
      JSON.stringify({ success: false, error: '更新用户组存储分配失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function onRequestDelete(context: { env: Env; request: Request; params: { id: string } }): Promise<Response> {
  const { env, request, params } = context
  const db = new Database(env.DB)

  try {
    await requireAdmin(request, env)

    await db.deleteGroupStorageAllocation(params.id)

    return new Response(
      JSON.stringify({ success: true, message: '删除成功' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    if (error instanceof Response) return error

    return new Response(
      JSON.stringify({ success: false, error: '删除用户组存储分配失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}


