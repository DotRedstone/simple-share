import { Database } from '../../../src/utils/db'
import { requireAuth } from '../../../src/middleware/auth'
import type { Env } from '../../../src/utils/db'

export async function onRequestGet(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const db = new Database(env.DB)

  try {
    const user = await requireAuth(request, env)
    if (user.role !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, error: '权限不足' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 确保至少有一个默认存储后端
    await db.ensureDefaultStorageBackend(env)

    const backends = await db.getAllStorageBackends()
    const formattedBackends = backends.map(backend => ({
      id: backend.id,
      name: backend.name,
      type: backend.type,
      enabled: backend.enabled === 1,
      isDefault: backend.is_default === 1,
      description: backend.description,
      config: JSON.parse(backend.config || '{}'),
      createdAt: backend.created_at,
      updatedAt: backend.updated_at
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
    if (user.role !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, error: '权限不足' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

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

    const id = `storage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    await db.createStorageBackend({
      id,
      name,
      type,
      config: JSON.stringify(config),
      description,
      enabled: enabled !== false,
      isDefault: isDefault === true
    })

    // 记录日志
    await db.createLog({
      action: '创建存储后端',
      userId: user.userId,
      userName: user.email,
      status: '成功',
      details: `存储后端: ${name} (${type})`
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

