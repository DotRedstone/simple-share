import { SignJWT, jwtVerify } from 'jose'
import type { JwtPayload } from '../types'

// 默认密钥回退，确保即使不设置环境变量系统也能运行
const getSecret = (secret?: string) => {
  return new TextEncoder().encode(secret || 'simpleshare-default-secret-key-2025-please-change-in-prod')
}

export async function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>, secret: string, remember?: boolean): Promise<string> {
  const secretKey = getSecret(secret)
  
  // 如果 remember 为 true，token 有效期 30 天，否则 7 天
  const expirationTime = remember ? '30d' : '7d'
  
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(secretKey)

  return token
}

export async function verifyToken(token: string, secret: string): Promise<JwtPayload | null> {
  try {
    const secretKey = getSecret(secret)
    const { payload } = await jwtVerify(token, secretKey)
    return payload as JwtPayload
  } catch (error) {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  // 使用 Web Crypto API 进行简单的哈希（生产环境应使用 bcrypt 或 Argon2）
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

export function getAuthToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

/**
 * 生成无状态重置令牌 (基于 Email + 日期 + 密钥 + 用户版本)
 * 这种令牌不需要存储在数据库，当天有效，且使用一次即失效（因为版本会变）
 */
export async function generateResetToken(email: string, secret: string, version: string | number): Promise<string> {
  const dateStr = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const encoder = new TextEncoder()
  const data = encoder.encode(`${email.toLowerCase()}:${dateStr}:${version}`)
  
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret || 'simpleshare-default-secret-key-2025-please-change-in-prod'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', key, data)
  const hashArray = Array.from(new Uint8Array(signature))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  // 返回前 16 位作为令牌，方便用户输入
  return hashHex.substring(0, 16).toUpperCase()
}

