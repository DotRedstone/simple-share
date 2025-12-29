import { verifyToken } from '../utils/auth'
import { Database } from '../utils/db'
import type { Env } from '../utils/db'
import type { JwtPayload } from '../types'

export interface AuthContext {
  user: JwtPayload
}

// 获取生效的 JWT 密钥（支持环境变量或数据库自动生成的密钥）
async function getEffectiveSecret(env: Env, db: Database): Promise<string> {
  // 1. 优先使用有效的环境变量
  const placeholders = ['dev-jwt-secret-change-in-production', 'your-jwt-secret-key-change-in-production'];
  if (env.JWT_SECRET && !placeholders.includes(env.JWT_SECRET)) {
    return env.JWT_SECRET;
  }

  // 2. 尝试从数据库获取
  let secret = await db.getSetting('system_jwt_secret');
  if (secret) return secret;

  // 3. 自动生成并持久化
  secret = crypto.randomUUID() + crypto.randomUUID(); // 生成 72 位强密钥
  await db.setSetting('system_jwt_secret', secret, '自动生成的系统 JWT 密钥');
  return secret;
}

export async function requireAuth(request: Request, env: Env): Promise<JwtPayload> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw new Response(JSON.stringify({ success: false, error: '未授权，请先登录' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const db = new Database(env.DB);
  const secret = await getEffectiveSecret(env, db);
  const payload = await verifyToken(token, secret)
  
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

