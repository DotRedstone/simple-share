import type { Env } from '../../../../src/utils/db'

// 获取 Auth0 中已配置的 Social Connections
export async function onRequestGet(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  
  const auth0Domain = env.AUTH0_DOMAIN
  const auth0ClientId = env.AUTH0_CLIENT_ID
  const auth0ClientSecret = env.AUTH0_CLIENT_SECRET
  
  if (!auth0Domain || !auth0ClientId || !auth0ClientSecret) {
    return new Response(
      JSON.stringify({ success: false, connections: [] }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }
  
  try {
    // 获取 Auth0 Management API token
    const tokenResponse = await fetch(`https://${auth0Domain}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: auth0ClientId,
        client_secret: auth0ClientSecret,
        audience: `https://${auth0Domain}/api/v2/`,
        grant_type: 'client_credentials',
      }),
    })
    
    if (!tokenResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, connections: [] }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token
    
    // 获取 Social Connections
    const connectionsResponse = await fetch(`https://${auth0Domain}/api/v2/connections?strategy=social`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!connectionsResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, connections: [] }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    const connectionsData = await connectionsResponse.json()
    
    // 映射常见的 connection 名称到显示名称
    const connectionMap: Record<string, string> = {
      'google-oauth2': 'Google',
      'github': 'GitHub',
      'windowslive': 'Microsoft',
      'wechat': '微信',
      'apple': 'Apple',
      'facebook': 'Facebook',
      'twitter': 'Twitter',
      'linkedin': 'LinkedIn',
    }
    
    // 过滤并格式化已启用的连接
    const enabledConnections = connectionsData
      .filter((conn: any) => conn.enabled)
      .map((conn: any) => ({
        id: conn.name,
        name: connectionMap[conn.name] || conn.name,
        strategy: conn.strategy,
      }))
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        connections: enabledConnections 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Failed to fetch Auth0 connections:', error)
    return new Response(
      JSON.stringify({ success: false, connections: [] }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }
}

