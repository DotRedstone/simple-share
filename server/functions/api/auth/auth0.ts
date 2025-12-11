import { Database } from '../../../src/utils/db'
import { generateToken } from '../../../src/utils/auth'
import type { Env } from '../../../src/utils/db'

// Auth0 登录 - 获取授权 URL
export async function onRequestGet(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const url = new URL(request.url)
  const redirectUri = url.searchParams.get('redirect_uri') || `${url.origin}/api/auth/auth0/callback`

  const auth0Domain = env.AUTH0_DOMAIN
  const auth0ClientId = env.AUTH0_CLIENT_ID

  if (!auth0Domain || !auth0ClientId) {
    return new Response(
      JSON.stringify({ success: false, error: 'Auth0 未配置' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // 生成 state 用于防止 CSRF
  const state = crypto.randomUUID()
  
  // 构建 Auth0 授权 URL
  const authUrl = `https://${auth0Domain}/authorize?` + new URLSearchParams({
    client_id: auth0ClientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    state,
  }).toString()

  return new Response(
    JSON.stringify({ success: true, authUrl, state }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

// Auth0 回调处理
export async function onRequestPost(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const db = new Database(env.DB)

  try {
    const { code, state } = await request.json()

    const auth0Domain = env.AUTH0_DOMAIN
    const auth0ClientId = env.AUTH0_CLIENT_ID
    const auth0ClientSecret = env.AUTH0_CLIENT_SECRET

    if (!auth0Domain || !auth0ClientId || !auth0ClientSecret) {
      return new Response(
        JSON.stringify({ success: false, error: 'Auth0 未配置' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 交换 access_token
    const redirectUri = new URL(request.url).origin + '/api/auth/auth0/callback'
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: auth0ClientId,
      client_secret: auth0ClientSecret,
      code,
      redirect_uri: redirectUri,
    })
    
    const tokenResponse = await fetch(`https://${auth0Domain}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}))
      console.error('Auth0 token error:', errorData)
      return new Response(
        JSON.stringify({ success: false, error: '获取访问令牌失败' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token
    const idToken = tokenData.id_token

    if (!accessToken) {
      return new Response(
        JSON.stringify({ success: false, error: '无效的访问令牌' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 获取用户信息（使用 access_token 或 id_token）
    // Auth0 的 userinfo 端点
    const userInfoResponse = await fetch(`https://${auth0Domain}/userinfo`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    })

    if (!userInfoResponse.ok) {
      // 如果 userinfo 失败，尝试解析 id_token（JWT）
      if (idToken) {
        try {
          const parts = idToken.split('.')
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
            const userInfo = {
              sub: payload.sub,
              name: payload.name || payload.nickname || payload.email?.split('@')[0] || 'User',
              email: payload.email,
              picture: payload.picture,
              // 从 provider 信息中提取
              provider: payload.sub?.split('|')[0] || 'auth0',
            }
            
            // 查找或创建用户
            const providerId = payload.sub
            let user = await db.db
              .prepare('SELECT * FROM users WHERE auth_provider = ? AND auth_provider_id = ?')
              .bind('auth0', providerId)
              .first() as any

            if (!user) {
              const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
              const userEmail = userInfo.email || `auth0_${providerId}@auth0.local`

              await db.createUser({
                id: userId,
                name: userInfo.name,
                email: userEmail,
                authProvider: 'auth0',
                authProviderId: providerId,
                avatarUrl: userInfo.picture,
                role: 'user',
              })

              user = await db.getUserById(userId)
            }

            // 生成 token
            const token = await generateToken(
              {
                userId: user.id,
                email: user.email,
                role: user.role,
              },
              env.JWT_SECRET
            )

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
          }
        } catch (e) {
          console.error('Failed to parse id_token:', e)
        }
      }
      
      return new Response(
        JSON.stringify({ success: false, error: '获取用户信息失败' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const userInfo = await userInfoResponse.json()
    
    // 提取用户信息
    const providerId = userInfo.sub
    const name = userInfo.name || userInfo.nickname || userInfo.email?.split('@')[0] || 'User'
    const email = userInfo.email
    const avatarUrl = userInfo.picture
    const provider = userInfo.sub?.split('|')[0] || 'auth0' // Auth0 的 sub 格式通常是 "provider|id"

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

    // 生成 token
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
    console.error('Auth0 error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Auth0 登录失败，请稍后重试',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

