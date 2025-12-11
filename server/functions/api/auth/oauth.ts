import { Database } from '../../../src/utils/db'
import { generateToken } from '../../../src/utils/auth'
import type { Env } from '../../../src/utils/db'

// OAuth 提供商配置
const OAUTH_PROVIDERS = {
  wechat: {
    name: '微信',
    authUrl: 'https://open.weixin.qq.com/connect/qrconnect',
    tokenUrl: 'https://api.weixin.qq.com/sns/oauth2/access_token',
    userInfoUrl: 'https://api.weixin.qq.com/sns/userinfo',
  },
  github: {
    name: 'GitHub',
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
  },
  google: {
    name: 'Google',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
  },
}

// 获取 OAuth 授权 URL
export async function onRequestGet(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const url = new URL(request.url)
  const provider = url.searchParams.get('provider')
  const redirectUri = url.searchParams.get('redirect_uri') || `${url.origin}/api/auth/oauth/callback`

  if (!provider || !(provider in OAUTH_PROVIDERS)) {
    return new Response(
      JSON.stringify({ success: false, error: '不支持的 OAuth 提供商' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const config = OAUTH_PROVIDERS[provider as keyof typeof OAUTH_PROVIDERS]
  const clientId = env[`${provider.toUpperCase()}_CLIENT_ID` as keyof Env] as string
  const clientSecret = env[`${provider.toUpperCase()}_CLIENT_SECRET` as keyof Env] as string

  if (!clientId) {
    return new Response(
      JSON.stringify({ success: false, error: `${config.name} OAuth 未配置` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // 生成 state 用于防止 CSRF
  const state = crypto.randomUUID()
  
  // 构建授权 URL
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: provider === 'wechat' ? 'snsapi_login' : provider === 'github' ? 'user:email' : 'openid profile email',
    state,
  })

  const authUrl = `${config.authUrl}?${params.toString()}`

  return new Response(
    JSON.stringify({ success: true, authUrl, state }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

// OAuth 回调处理
export async function onRequestPost(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const db = new Database(env.DB)

  try {
    const { provider, code, state } = await request.json()

    if (!provider || !(provider in OAUTH_PROVIDERS)) {
      return new Response(
        JSON.stringify({ success: false, error: '不支持的 OAuth 提供商' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const config = OAUTH_PROVIDERS[provider as keyof typeof OAUTH_PROVIDERS]
    const clientId = env[`${provider.toUpperCase()}_CLIENT_ID` as keyof Env] as string
    const clientSecret = env[`${provider.toUpperCase()}_CLIENT_SECRET` as keyof Env] as string

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ success: false, error: `${config.name} OAuth 未配置` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 交换 access_token
    const redirectUri = new URL(request.url).origin + '/api/auth/oauth/callback'
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    })

    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: tokenParams.toString(),
    })

    if (!tokenResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, error: '获取访问令牌失败' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token || tokenData.token

    if (!accessToken) {
      return new Response(
        JSON.stringify({ success: false, error: '无效的访问令牌' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 获取用户信息
    const userInfoResponse = await fetch(config.userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    })

    if (!userInfoResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, error: '获取用户信息失败' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const userInfo = await userInfoResponse.json()
    
    // 提取用户信息（不同提供商字段不同）
    let oauthId: string
    let name: string
    let email: string | undefined
    let avatarUrl: string | undefined

    if (provider === 'wechat') {
      oauthId = userInfo.openid || tokenData.openid
      name = userInfo.nickname || `微信用户_${(oauthId || '').substring(0, 8)}`
      avatarUrl = userInfo.headimgurl
    } else if (provider === 'github') {
      oauthId = userInfo.id?.toString() || userInfo.node_id
      name = userInfo.name || userInfo.login
      email = userInfo.email
      avatarUrl = userInfo.avatar_url
    } else if (provider === 'google') {
      oauthId = userInfo.id || userInfo.sub
      name = userInfo.name
      email = userInfo.email
      avatarUrl = userInfo.picture
    } else {
      return new Response(
        JSON.stringify({ success: false, error: '不支持的提供商' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    if (!oauthId) {
      return new Response(
        JSON.stringify({ success: false, error: '无法获取用户ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 查找或创建用户
    let user = await db.db
      .prepare('SELECT * FROM users WHERE auth_provider = ? AND auth_provider_id = ?')
      .bind(provider, oauthId)
      .first() as any

    if (!user) {
      // 创建新用户
      const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      const userEmail = email || `${provider}_${oauthId}@oauth.local`

      await db.createUser({
        id: userId,
        name,
        email: userEmail,
        authProvider: provider,
        authProviderId: oauthId,
        avatarUrl,
        role: 'user',
      })

      user = await db.getUserById(userId)
    }

    // 生成 token
    const token = await generateToken(
      {
        userId: (user as any).id,
        email: (user as any).email,
        role: (user as any).role,
      },
      env.JWT_SECRET
    )

    // 记录日志
    await db.createLog({
      action: 'OAuth 登录',
      userId: (user as any).id,
      userName: (user as any).name,
      status: '成功',
      ip: request.headers.get('CF-Connecting-IP') || undefined
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          token,
          user: {
            id: (user as any).id,
            name: (user as any).name,
            email: (user as any).email,
            role: (user as any).role,
            status: (user as any).status,
            storageQuota: (user as any).storage_quota || 0,
            storageUsed: (user as any).storage_used || 0,
            groupId: (user as any).group_id,
            avatarUrl: (user as any).avatar_url,
          }
        }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('OAuth error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'OAuth 登录失败，请稍后重试',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

