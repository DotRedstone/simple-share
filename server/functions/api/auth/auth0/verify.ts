import { Database } from '../../../../src/utils/db'
import { generateToken } from '../../../../src/utils/auth'
import type { Env } from '../../../../src/utils/db'

// 验证 Auth0 token 并创建/获取用户
export async function onRequestPost(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const db = new Database(env.DB)

  try {
    // 从 Authorization header 获取 Auth0 access token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: '缺少认证令牌' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const auth0Token = authHeader.substring(7)
    const { auth0User } = await request.json()

    if (!auth0User || !auth0User.sub) {
      return new Response(
        JSON.stringify({ success: false, error: '无效的用户信息' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 验证 Auth0 token（可选：可以调用 Auth0 的 userinfo 端点验证）
    const auth0Domain = env.AUTH0_DOMAIN
    if (auth0Domain) {
      try {
        const userInfoResponse = await fetch(`https://${auth0Domain}/userinfo`, {
          headers: {
            'Authorization': `Bearer ${auth0Token}`,
            'Accept': 'application/json',
          },
        })

        if (!userInfoResponse.ok) {
          return new Response(
            JSON.stringify({ success: false, error: 'Auth0 token 验证失败' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          )
        }

        // 使用 Auth0 返回的用户信息
        const verifiedUser = await userInfoResponse.json()
        const providerId = verifiedUser.sub || auth0User.sub
        const name = verifiedUser.name || verifiedUser.nickname || verifiedUser.email?.split('@')[0] || 'User'
        const email = verifiedUser.email || auth0User.email
        const avatarUrl = verifiedUser.picture || auth0User.picture

        // 查找或创建用户
        let user = await db.db
          .prepare('SELECT * FROM users WHERE auth_provider = ? AND auth_provider_id = ?')
          .bind('auth0', providerId)
          .first() as any

        if (!user) {
          const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
          const userEmail = email || `auth0_${providerId}@auth0.local`

          await db.createUser({
            id: userId,
            name,
            email: userEmail,
            authProvider: 'auth0',
            authProviderId: providerId,
            avatarUrl,
            role: 'user',
          })

          user = await db.getUserById(userId)
        }

        // 生成我们自己的 JWT token
        const token = await generateToken(
          {
            userId: user.id,
            email: user.email,
            role: user.role,
          },
          env.JWT_SECRET
        )

        // 记录日志
        await db.createLog({
          action: 'Auth0 登录',
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
                status: user.status,
                storageQuota: user.storage_quota || 0,
                storageUsed: user.storage_used || 0,
                groupId: user.group_id,
                avatarUrl: user.avatar_url,
              }
            }
          }),
          { headers: { 'Content-Type': 'application/json' } }
        )
      } catch (error) {
        console.error('Auth0 verification error:', error)
        return new Response(
          JSON.stringify({ success: false, error: 'Auth0 验证失败' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Auth0 未配置' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Auth0 verify error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: '验证失败，请稍后重试',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

