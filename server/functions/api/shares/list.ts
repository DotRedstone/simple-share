import { Database } from '../../../src/utils/db'
import { requireAuth } from '../../../src/middleware/auth'
import type { Env } from '../../../src/utils/db'

export async function onRequestGet(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const db = new Database(env.DB)

  try {
    const user = await requireAuth(request, env)

    const shares = await db.getSharesByUserId(user.userId)

    const formattedShares = shares.map(share => ({
      id: share.id,
      fileId: share.file_id,
      shareCode: share.share_code,
      expirationDays: share.expiration_days,
      createdAt: new Date(share.created_at).toISOString(),
      expiresAt: new Date(share.expires_at).toISOString(),
      accessCount: share.access_count,
      maxAccess: share.max_access
    }))

    return new Response(
      JSON.stringify({
        success: true,
        data: formattedShares
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    if (error instanceof Response) return error
    
    return new Response(
      JSON.stringify({ success: false, error: '获取分享列表失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

