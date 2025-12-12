import { SignJWT, jwtVerify } from 'jose'
import type { JwtPayload } from '../types'

export async function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>, secret: string, remember?: boolean): Promise<string> {
  const secretKey = new TextEncoder().encode(secret)
  
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
    const secretKey = new TextEncoder().encode(secret)
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

