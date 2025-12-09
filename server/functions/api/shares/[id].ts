import { Database } from '../../../src/utils/db'
import { requireAuth } from '../../../src/middleware/auth'
import type { Env } from '../../../src/utils/db'

export async function onRequestDelete(context: { env: Env; request: Request; params: { id: string } }): Promise<Response> {
  const { env, request, params } = context
  const db = new Database(env.DB)

  try {
    const user = await requireAuth(request, env)
    const shareId = params.id

    // 检查分享是否存在且属于当前用户
    const shares = await db.getSharesByUserId(user.userId)
    const share = shares.find(s => s.id === shareId)

    if (!share) {
      return new Response(
        JSON.stringify({ success: false, error: '分享不存在' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 删除分享
    await db.deleteShare(shareId)

    // 记录日志
    await db.createLog({
      action: '取消分享',
      userId: user.userId,
      userName: user.email,
      status: '成功',
      details: `分享码: ${share.share_code}`,
      ip: request.headers.get('CF-Connecting-IP') || undefined
    })

    return new Response(
      JSON.stringify({ success: true, message: '取消分享成功' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    if (error instanceof Response) return error
    
    return new Response(
      JSON.stringify({ success: false, error: '取消分享失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

