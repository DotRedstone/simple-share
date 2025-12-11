import type { Env } from '../../../../src/utils/db'

// 获取特定 Social Connection 的授权 URL
export async function onRequestGet(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const url = new URL(request.url)
  const connection = url.searchParams.get('connection') // 例如: 'google-oauth2', 'github', 'windowslive'
  const redirectUri = url.searchParams.get('redirect_uri') || `${url.origin}/callback`

  const auth0Domain = env.AUTH0_DOMAIN
  const auth0ClientId = env.AUTH0_CLIENT_ID

  if (!auth0Domain || !auth0ClientId) {
    return new Response(
      JSON.stringify({ success: false, error: 'Auth0 未配置' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (!connection) {
    return new Response(
      JSON.stringify({ success: false, error: '缺少 connection 参数' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // 生成 state 用于防止 CSRF
  const state = crypto.randomUUID()
  
  // 构建 Auth0 授权 URL，使用 connection 参数直接跳转到指定的 Social Connection
  const authUrl = `https://${auth0Domain}/authorize?` + new URLSearchParams({
    client_id: auth0ClientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    state,
    connection, // 关键：指定要使用的 Social Connection
  }).toString()

  return new Response(
    JSON.stringify({ success: true, authUrl, state }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

