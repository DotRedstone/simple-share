import { Database } from '../../../../src/utils/db'
import { requireAuth } from '../../../../src/middleware/auth'
import { encryptConfig } from '../../../../src/utils/encryption'
import type { Env } from '../../../../src/utils/db'

export async function onRequestPut(
  context: { env: Env; request: Request; params: { id: string } }
): Promise<Response> {
  const { env, request, params } = context
  const db = new Database(env.DB)

  try {
    const user = await requireAuth(request, env)
    const body = await request.json()
    const updates: any = {}

    if (body.name !== undefined) updates.name = body.name
    if (body.config !== undefined) {
      // 加密新配置
      const configJson = JSON.stringify(body.config)
      updates.configEncrypted = encryptConfig(configJson, user.userId)
    }
    if (body.description !== undefined) updates.description = body.description
    if (body.enabled !== undefined) updates.enabled = body.enabled
    if (body.isDefault !== undefined) updates.isDefault = body.isDefault

    await db.updateUserStorageBackend(params.id, user.userId, updates)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    if (error instanceof Response) return error
    
    return new Response(
      JSON.stringify({ success: false, error: error.message || '更新存储后端失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function onRequestDelete(
  context: { env: Env; request: Request; params: { id: string } }
): Promise<Response> {
  const { env, request, params } = context
  const db = new Database(env.DB)

  try {
    const user = await requireAuth(request, env)
    await db.deleteUserStorageBackend(params.id, user.userId)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    if (error instanceof Response) return error
    
    return new Response(
      JSON.stringify({ success: false, error: error.message || '删除存储后端失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

