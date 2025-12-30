import { Database } from '../../../../src/utils/db'
import { requireAdmin } from '../../../../src/middleware/auth'
import { generateResetToken } from '../../../../src/utils/auth'
import type { Env } from '../../../../src/utils/db'

export async function onRequestPost(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const db = new Database(env.DB)

  try {
    await requireAdmin(request, env)
    const { email } = await request.json()

    if (!email) {
      return new Response(JSON.stringify({ success: false, error: '缺少邮箱' }), { status: 400 })
    }

    const user = await db.getUserByEmail(email)
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: '用户不存在' }), { status: 404 })
    }

    if (user.role === 'admin') {
      return new Response(JSON.stringify({ success: false, error: '管理员密码必须手动修改' }), { status: 403 })
    }

    const token = await generateResetToken(email, env.JWT_SECRET, user.updated_at)

    return new Response(JSON.stringify({ success: true, token }), { 
      headers: { 'Content-Type': 'application/json' } 
    })
  } catch (error: any) {
    if (error instanceof Response) return error
    return new Response(
      JSON.stringify({ success: false, error: error.message || '生成令牌失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

