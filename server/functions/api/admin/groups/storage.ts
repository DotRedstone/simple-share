import { Database } from '../../../../src/utils/db'
import { requireAdmin } from '../../../../src/middleware/auth'
import type { Env } from '../../../../src/utils/db'

export async function onRequestGet(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const db = new Database(env.DB)

  try {
    await requireAdmin(request, env)
    const url = new URL(request.url)
    const groupId = url.searchParams.get('groupId')

    if (!groupId) {
      return new Response(
        JSON.stringify({ success: false, error: '缺少 groupId 参数' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const allocations = await db.getGroupStorageAllocationsByGroup(groupId)

    const formatted = allocations.map(a => ({
      id: a.id,
      groupId: a.group_id,
      storageBackendId: a.storage_backend_id,
      quotaGb: a.quota_gb,
      backendName: a.backend_name,
      backendType: a.backend_type,
      backendEnabled: a.backend_enabled === 1,
      createdAt: a.created_at,
      updatedAt: a.updated_at
    }))

    return new Response(
      JSON.stringify({ success: true, data: formatted }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    if (error instanceof Response) return error

    return new Response(
      JSON.stringify({ success: false, error: '获取用户组存储分配失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function onRequestPost(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const db = new Database(env.DB)

  try {
    await requireAdmin(request, env)
    const { groupId, storageBackendId, quotaGb } = await request.json()

    if (!groupId || !storageBackendId || quotaGb === undefined) {
      return new Response(
        JSON.stringify({ success: false, error: 'groupId、storageBackendId 和 quotaGb 不能为空' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const id = `gsa_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    await db.createGroupStorageAllocation({
      id,
      groupId,
      storageBackendId,
      quotaGb: Number(quotaGb)
    })

    return new Response(
      JSON.stringify({ success: true, data: { id } }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    if (error instanceof Response) return error

    return new Response(
      JSON.stringify({ success: false, error: '创建用户组存储分配失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}


