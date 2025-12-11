import type { Env } from '../../../src/utils/db'

// 获取已配置的 OAuth 提供商列表
export async function onRequestGet(context: { env: Env; request: Request }): Promise<Response> {
  const { env } = context
  
  const providers: string[] = []
  
  // 检查各个提供商的配置
  if (env.WECHAT_CLIENT_ID && env.WECHAT_CLIENT_SECRET) {
    providers.push('wechat')
  }
  
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
    providers.push('github')
  }
  
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.push('google')
  }
  
  return new Response(
    JSON.stringify({ success: true, providers }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

