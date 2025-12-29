import { Database } from '../../../src/utils/db'
import { requireAdmin } from '../../../src/middleware/auth'
import type { Env } from '../../../src/utils/db'

export async function onRequestGet(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const db = new Database(env.DB)

  try {
    await requireAdmin(request, env)
    const url = new URL(request.url)
    const sortBy = url.searchParams.get('sortBy') || 'created_at'
    const order = url.searchParams.get('order') || 'DESC'

    const users = await db.getAllUsers(sortBy, order)

    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      storageQuota: user.storage_quota,
      storageUsed: user.storage_used,
      groupId: user.group_id
    }))

    return new Response(
      JSON.stringify({
        success: true,
        data: formattedUsers
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    if (error instanceof Response) return error
    
    return new Response(
      JSON.stringify({ success: false, error: '获取用户列表失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function onRequestPost(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const db = new Database(env.DB)

  try {
    await requireAdmin(request, env)
    const { name, email, password, role = 'user', storageQuota = 50, groupId } = await request.json()

    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ success: false, error: '用户名、邮箱和密码不能为空' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 检查用户是否已存在
    const existing = await db.getUserByEmail(email)
    if (existing) {
      return new Response(
        JSON.stringify({ success: false, error: '该邮箱已被注册' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { hashPassword } = await import('../../../src/utils/auth')
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const passwordHash = await hashPassword(password)

    await db.createUser({
      id: userId,
      name,
      email,
      passwordHash,
      role: role as 'admin' | 'user',
      groupId
    })

    if (storageQuota !== 50) {
      await db.updateUser(userId, { storageQuota })
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: userId,
          name,
          email,
          role,
          status: '活跃',
          storageQuota,
          storageUsed: 0,
          groupId
        }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    if (error instanceof Response) return error
    
    return new Response(
      JSON.stringify({ success: false, error: '创建用户失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

