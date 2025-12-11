import type { Env } from '../../../src/utils/db'

// 检查 Auth0 是否已配置
export async function onRequestGet(context: { env: Env; request: Request }): Promise<Response> {
  const { env } = context
  
  const isConfigured = !!(env.AUTH0_DOMAIN && env.AUTH0_CLIENT_ID && env.AUTH0_CLIENT_SECRET)
  
  return new Response(
    JSON.stringify({ success: true, configured: isConfigured }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

