import { Database } from '../../../src/utils/db'
import { hashPassword, generateToken } from '../../../src/utils/auth'
import type { Env } from '../../../src/utils/db'

export async function onRequestPost(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const db = new Database(env.DB)

  try {
    const { username, email, password } = await request.json()

    if (!username || !password) {
      return new Response(
        JSON.stringify({ success: false, error: '用户名和密码不能为空' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ success: false, error: '密码长度至少为6位' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const userEmail = email || `${username}@simpleshare.com`

    // 检查用户是否已存在
    const existingUser = await db.getUserByEmail(userEmail)
    if (existingUser) {
      return new Response(
        JSON.stringify({ success: false, error: '该邮箱已被注册' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 创建用户
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const passwordHash = await hashPassword(password)

    await db.createUser({
      id: userId,
      name: username,
      email: userEmail,
      passwordHash,
      role: 'user'
    })

    // 生成 token
    const token = await generateToken(
      {
        userId,
        email: userEmail,
        role: 'user'
      },
      env.JWT_SECRET
    )

    // 记录日志
    await db.createLog({
      action: '用户注册',
      userId,
      userName: username,
      status: '成功',
      ip: request.headers.get('CF-Connecting-IP') || undefined
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          token,
          user: {
            id: userId,
            name: username,
            email: userEmail,
            role: 'user',
            status: '活跃',
            storageQuota: 50,
            storageUsed: 0
          }
        }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Register error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: '注册失败，请稍后重试',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

