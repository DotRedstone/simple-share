import { Database } from '../../../src/utils/db'
import { requireAuth } from '../../../src/middleware/auth'
import type { Env } from '../../../src/utils/db'

function generateShareCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function onRequestPost(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const db = new Database(env.DB)

  try {
    const user = await requireAuth(request, env)
    const { fileId, expirationDays = 7 } = await request.json()

    if (!fileId) {
      return new Response(
        JSON.stringify({ success: false, error: '文件ID不能为空' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 检查文件是否存在且属于当前用户
    const file = await db.getFileById(fileId)
    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: '文件不存在' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (file.user_id !== user.userId && user.role !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, error: '无权分享此文件' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 检查是否已有分享
    const existingShare = await db.getShareByFileId(fileId)
    if (existingShare) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            id: existingShare.id,
            shareCode: existingShare.share_code,
            expiresAt: new Date(existingShare.expires_at).toISOString()
          }
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 创建新分享
    const shareId = `share_${Date.now()}`
    const shareCode = generateShareCode()
    const expiresAt = Date.now() + expirationDays * 24 * 60 * 60 * 1000

    await db.createShare({
      id: shareId,
      fileId,
      userId: user.userId,
      shareCode,
      expirationDays,
      expiresAt
    })

    // 记录日志
    await db.createLog({
      action: '生成分享码',
      userId: user.userId,
      userName: user.email,
      status: '成功',
      fileId,
      fileName: file.name,
      details: `分享码: ${shareCode}`,
      ip: request.headers.get('CF-Connecting-IP') || undefined
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: shareId,
          shareCode,
          expiresAt: new Date(expiresAt).toISOString()
        }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    if (error instanceof Response) return error
    
    return new Response(
      JSON.stringify({ success: false, error: '创建分享失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

