import { Database } from '../../../src/utils/db'
import { getR2Object } from '../../../src/utils/r2'
import { formatFileSize } from '../../../src/utils/r2'
import { corsHeaders } from '../../../src/utils/cors'
import type { Env } from '../../../src/utils/db'

export async function onRequestGet(context: { env: Env; request: Request; params: { code: string } }): Promise<Response> {
  const { env, request, params } = context
  const db = new Database(env.DB)
  const origin = request.headers.get('Origin')

  try {
    const shareCode = params.code.toUpperCase()

    // 查找分享记录
    const share = await db.getShareByCode(shareCode)
    if (!share) {
      return new Response(
        JSON.stringify({ success: false, error: '提取码无效或已过期' }),
        { 
          status: 404, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders(origin)
          } 
        }
      )
    }

    // 检查是否超过最大访问次数
    if (share.max_access && share.access_count >= share.max_access) {
      return new Response(
        JSON.stringify({ success: false, error: '分享链接已达到最大访问次数' }),
        { 
          status: 403, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders(origin)
          } 
        }
      )
    }

    // 获取文件信息
    const file = await db.getFileById(share.file_id)
    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: '文件不存在' }),
        { 
          status: 404, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders(origin)
          } 
        }
      )
    }

    // 增加访问计数
    await db.incrementShareAccess(shareCode)

    // 记录日志
    await db.createLog({
      action: '提取文件',
      userId: share.user_id,
      status: '成功',
      fileId: file.id,
      fileName: file.name,
      details: `提取码: ${shareCode}`,
      ip: request.headers.get('CF-Connecting-IP') || undefined
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          name: file.name,
          size: formatFileSize(file.size_bytes),
          uploadTime: new Date(file.created_at).toISOString(),
          type: file.type,
          downloadUrl: `/api/files/download?id=${file.id}&shareCode=${shareCode}`
        }
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders(origin)
        } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: '获取文件信息失败' }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders(origin)
        } 
      }
    )
  }
}

export async function onRequestOptions(context: { request: Request }): Promise<Response> {
  const origin = context.request.headers.get('Origin')
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin)
  })
}

