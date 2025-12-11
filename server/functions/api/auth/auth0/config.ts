import type { Env } from '../../../src/utils/db'

// 获取 Auth0 前端配置（不包含敏感信息）
export async function onRequestGet(context: { env: Env; request: Request }): Promise<Response> {
  const { env } = context
  
  const auth0Domain = env.AUTH0_DOMAIN
  const auth0ClientId = env.AUTH0_CLIENT_ID
  
  if (!auth0Domain || !auth0ClientId) {
    return new Response(
      JSON.stringify({ success: false, configured: false }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }
  
  // 只返回前端需要的配置，不返回 Client Secret
  return new Response(
    JSON.stringify({ 
      success: true, 
      configured: true,
      domain: auth0Domain,
      clientId: auth0ClientId
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

