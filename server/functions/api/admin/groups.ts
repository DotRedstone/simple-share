import { Database } from '../../../src/utils/db'
import { requireAdmin } from '../../../src/middleware/auth'
import type { Env } from '../../../src/utils/db'

export async function onRequestGet(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const db = new Database(env.DB)

  try {
    await requireAdmin(request, env)

    const groups = await db.getUserGroups()

    const formattedGroups = groups.map(group => ({
      id: group.id,
      name: group.name,
      description: group.description,
      storageQuota: group.storage_quota,
      maxUsers: group.max_users,
      currentUsers: group.current_users
    }))

    return new Response(
      JSON.stringify({
        success: true,
        data: formattedGroups
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    if (error instanceof Response) return error
    
    return new Response(
      JSON.stringify({ success: false, error: '获取用户组列表失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function onRequestPost(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const db = new Database(env.DB)

  try {
    await requireAdmin(request, env)
    const { name, description, storageQuota, maxUsers } = await request.json()

    if (!name) {
      return new Response(
        JSON.stringify({ success: false, error: '用户组名称不能为空' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const groupId = `grp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    await db.createUserGroup({
      id: groupId,
      name,
      description,
      storageQuota: storageQuota || 50,
      maxUsers
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: groupId,
          name,
          description,
          storageQuota: storageQuota || 50,
          maxUsers,
          currentUsers: 0
        }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    if (error instanceof Response) return error
    
    return new Response(
      JSON.stringify({ success: false, error: '创建用户组失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

