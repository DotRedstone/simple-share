import { Database } from '../../../src/utils/db'
import { requireAuth } from '../../../src/middleware/auth'
import { encryptConfig, decryptConfig } from '../../../src/utils/encryption'
import type { Env } from '../../../src/utils/db'

export async function onRequestGet(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const db = new Database(env.DB)

  try {
    const user = await requireAuth(request, env)
    const backends = await db.getUserStorageBackends(user.userId)
    
    // 解密配置（仅返回基本信息，不返回敏感信息）
    const formattedBackends = backends.map(backend => ({
      id: backend.id,
      name: backend.name,
      type: backend.type,
      enabled: backend.enabled === 1,
      isDefault: backend.is_default === 1,
      description: backend.description,
      createdAt: backend.created_at,
      updatedAt: backend.updated_at
      // 不返回加密的配置
    }))

    return new Response(
      JSON.stringify({ success: true, data: formattedBackends }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    if (error instanceof Response) return error
    
    return new Response(
      JSON.stringify({ success: false, error: '获取存储后端列表失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function onRequestPost(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const db = new Database(env.DB)

  try {
    const user = await requireAuth(request, env)
    const body = await request.json()
    const { name, type, config, description, enabled, isDefault } = body

    if (!name || !type || !config) {
      return new Response(
        JSON.stringify({ success: false, error: '缺少必要参数' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!['r2', 's3', 'webdav', 'ftp', 'sftp'].includes(type)) {
      return new Response(
        JSON.stringify({ success: false, error: '不支持的存储类型' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 加密配置（使用用户ID作为密钥的一部分）
    const configJson = JSON.stringify(config)
    const encryptedConfig = encryptConfig(configJson, user.userId)

    const id = `usr_storage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    await db.createUserStorageBackend({
      id,
      userId: user.userId,
      name,
      type,
      configEncrypted: encryptedConfig,
      description,
      enabled: enabled !== false,
      isDefault: isDefault === true
    })

    return new Response(
      JSON.stringify({ success: true, data: { id } }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    if (error instanceof Response) return error
    
    return new Response(
      JSON.stringify({ success: false, error: error.message || '创建存储后端失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

