import { Database } from '../../../src/utils/db'
import { hashPassword, verifyPassword, generateToken } from '../../../src/utils/auth'
import type { Env } from '../../../src/utils/db'

export async function onRequestPost(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const db = new Database(env.DB)

  try {
    const body = await request.json() as { username?: string; password?: string; remember?: boolean }
    const { username, password, remember } = body

    if (!username || !password) {
      return new Response(
        JSON.stringify({ success: false, error: '用户名和密码不能为空' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 查找用户（支持用户名或邮箱登录）
    let user = await db.getUserByEmail(username)
    if (!user) {
      user = await db.getUserByEmail(`${username}@simpleshare.com`)
    }

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: '用户名或密码错误' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 验证密码（注意：数据库字段名是 password_hash，D1 返回的是下划线格式）
    // D1 数据库返回的字段名可能是下划线格式，需要兼容处理
    const passwordHash = (user as any).password_hash || (user as any).passwordHash || (user as any)['password_hash']
    
    // 调试信息：打印用户对象的所有键
    console.log('User object keys:', Object.keys(user as any))
    console.log('Password hash field:', {
      'password_hash': (user as any).password_hash,
      'passwordHash': (user as any).passwordHash,
      'has password_hash key': 'password_hash' in (user as any),
      'all keys': Object.keys(user as any)
    })
    
    if (!passwordHash) {
      // OAuth 用户可能没有密码
      if ((user as any).auth_provider !== 'local' || (user as any).auth_provider_id) {
        return new Response(
          JSON.stringify({ success: false, error: '该账户使用第三方登录，请使用对应的登录方式' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }
      console.error('No password hash found for user:', {
        userId: user.id,
        email: user.email,
        userKeys: Object.keys(user as any)
      })
      return new Response(
        JSON.stringify({ success: false, error: '用户数据异常：未找到密码哈希' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const isValid = await verifyPassword(password, passwordHash)
    if (!isValid) {
      // 测试：重新哈希密码看看是否匹配
      const testHash = await hashPassword(password)
      console.error('Password verification failed:', {
        userId: user.id,
        email: user.email,
        providedPasswordLength: password.length,
        storedHashLength: passwordHash.length,
        storedHashPrefix: passwordHash.substring(0, 20) + '...',
        testHashPrefix: testHash.substring(0, 20) + '...',
        hashesMatch: testHash === passwordHash
      })
    }
    if (!isValid) {
      return new Response(
        JSON.stringify({ success: false, error: '用户名或密码错误' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 检查用户状态（数据库存储的是 '活跃' 或 '已暂停'）
    if (user.status === '已暂停') {
      return new Response(
        JSON.stringify({ success: false, error: '账户已被暂停' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 生成 token
    const token = await generateToken(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      env.JWT_SECRET
    )

    // 记录日志
    await db.createLog({
      action: '用户登录',
      userId: user.id,
      userName: user.name,
      status: '成功',
      ip: request.headers.get('CF-Connecting-IP') || undefined
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status as '活跃' | '已暂停',
            storageQuota: user.storage_quota || 0,
            storageUsed: user.storage_used || 0,
            groupId: user.group_id
          }
        }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Login error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: '登录失败，请稍后重试'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

