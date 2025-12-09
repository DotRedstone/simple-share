import { verifyToken } from '../utils/auth'
import type { Env } from '../utils/db'
import type { JwtPayload } from '../types'

export interface AuthContext {
  user: JwtPayload
}

export async function requireAuth(request: Request, env: Env): Promise<JwtPayload> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw new Response(JSON.stringify({ success: false, error: '未授权，请先登录' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const payload = await verifyToken(token, env.JWT_SECRET)
  
  if (!payload) {
    throw new Response(JSON.stringify({ success: false, error: '令牌无效或已过期' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return payload
}

export async function requireAdmin(request: Request, env: Env): Promise<JwtPayload> {
  const user = await requireAuth(request, env)
  
  if (user.role !== 'admin') {
    throw new Response(JSON.stringify({ success: false, error: '需要管理员权限' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return user
}

