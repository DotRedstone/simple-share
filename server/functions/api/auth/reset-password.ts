import { Database } from '../../../src/utils/db'
import { hashPassword, generateResetToken } from '../../../src/utils/auth'
import type { Env } from '../../../src/utils/db'

export async function onRequestPost(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const db = new Database(env.DB)

  try {
    const body = await request.json() as { email?: string; resetToken?: string; newPassword?: string }
    const { email, resetToken, newPassword } = body

    if (!email || !resetToken || !newPassword) {
      return new Response(
        JSON.stringify({ success: false, error: '请填写完整信息' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ success: false, error: '新密码长度至少为 6 位' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 查找用户
    const user = await db.getUserByEmail(email)
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: '用户不存在' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 安全约束：管理员不能通过此方式重置密码
    if (user.role === 'admin') {
      return new Response(
        JSON.stringify({ success: false, error: '出于安全考虑，管理员密码必须通过数据库手动修改' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 验证重置令牌
    const expectedToken = await generateResetToken(email, env.JWT_SECRET)
    if (resetToken.toUpperCase() !== expectedToken) {
      return new Response(
        JSON.stringify({ success: false, error: '重置令牌无效或已过期' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 更新密码
    const newPasswordHash = await hashPassword(newPassword)
    await db.db.prepare(
      'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?'
    ).bind(
      newPasswordHash,
      Date.now(),
      user.id
    ).run()

    // 记录日志
    await db.createLog({
      action: '重置密码',
      userId: user.id,
      userName: user.name,
      status: '成功',
      details: '通过无状态重置令牌成功重置密码',
      ip: request.headers.get('CF-Connecting-IP') || undefined
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: '密码已成功重置'
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Reset password error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || '重置密码失败，请稍后重试'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

