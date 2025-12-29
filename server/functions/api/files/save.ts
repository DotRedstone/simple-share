import { Database } from '../../../src/utils/db'
import { requireAuth } from '../../../src/middleware/auth'
import type { Env } from '../../../src/utils/db'

export async function onRequestPost(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const db = new Database(env.DB)

  try {
    const user = await requireAuth(request, env)
    const { fileId, shareCode } = await request.json()

    if (!fileId || !shareCode) {
      return new Response(
        JSON.stringify({ success: false, error: '缺少必要参数' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 验证分享码
    const share = await db.getShareByCode(shareCode.toUpperCase())
    if (!share) {
      return new Response(
        JSON.stringify({ success: false, error: '分享码无效或已过期' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (share.file_id !== fileId) {
      return new Response(
        JSON.stringify({ success: false, error: '文件ID与分享码不匹配' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 获取原文件信息
    const originalFile = await db.getFileById(fileId)
    if (!originalFile) {
      return new Response(
        JSON.stringify({ success: false, error: '文件不存在' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 创建新文件记录（复制到当前用户）
    const now = Date.now()
    const newFileId = await db.createFile({
      name: originalFile.name,
      sizeBytes: originalFile.size_bytes,
      mimeType: originalFile.mime_type,
      storageKey: originalFile.storage_key,
      storageBackendId: originalFile.storage_backend_id,
      userId: user.userId,
      parentId: null,
      path: `/${originalFile.name}`,
      type: originalFile.type as any
    })

    // 记录日志
    await db.createLog({
      action: '转存文件',
      userId: user.userId,
      userName: user.email,
      status: '成功',
      fileId: newFileId,
      fileName: originalFile.name,
      details: `从分享码 ${shareCode} 转存`
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: { fileId: newFileId }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    if (error instanceof Response) return error
    
    return new Response(
      JSON.stringify({ success: false, error: error.message || '转存失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

