import { Database } from '../../../src/utils/db'
import { requireAuth } from '../../../src/middleware/auth'
import { createStorageAdapter, type StorageBackendConfig } from '../../../src/utils/storage'
import { corsHeaders } from '../../../src/utils/cors'
import type { Env } from '../../../src/utils/db'

export async function onRequestGet(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const db = new Database(env.DB)
  const origin = request.headers.get('Origin')

  try {
    const url = new URL(request.url)
    const fileId = parseInt(url.searchParams.get('id')!)
    const shareCode = url.searchParams.get('shareCode')
    
    // 如果有分享码，不需要认证
    let user = null
    if (!shareCode) {
      user = await requireAuth(request, env)
    }

    if (!fileId) {
      return new Response(
        JSON.stringify({ success: false, error: '文件ID不能为空' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders(origin)
          } 
        }
      )
    }

    const file = await db.getFileById(fileId)
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

    // 检查权限（文件所有者、管理员或通过分享码）
    let hasAccess = false
    
    if (shareCode) {
      // 通过分享码访问
      const share = await db.getShareByCode(shareCode)
      if (share && share.file_id === fileId) {
        hasAccess = true
        // 增加分享访问计数
        await db.incrementShareAccess(shareCode)
      }
    } else if (user) {
      // 通过认证访问
      hasAccess = file.user_id === user.userId || user.role === 'admin'
    }

    if (!hasAccess) {
      return new Response(
        JSON.stringify({ success: false, error: '无权访问此文件' }),
        { 
          status: 403, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders(origin)
          } 
        }
      )
    }

    // 获取存储后端并创建适配器
    let storageAdapter = null
    if (file.storage_backend_id) {
      const storageBackend = await db.getStorageBackendById(file.storage_backend_id)
      if (!storageBackend || storageBackend.enabled !== 1) {
        return new Response(
          JSON.stringify({ success: false, error: '存储后端不可用' }),
          { 
            status: 500, 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders(origin)
            } 
          }
        )
      }
      const config: StorageBackendConfig = JSON.parse(storageBackend.config)
      config.type = storageBackend.type as 'r2' | 's3' | 'webdav' | 'ftp' | 'sftp'
      storageAdapter = createStorageAdapter(config, env.FILES)
    } else {
      // 默认使用 R2（如果可用）
      if (!env.FILES) {
        return new Response(
          JSON.stringify({ success: false, error: '未配置存储后端' }),
          { 
            status: 500, 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders(origin)
            } 
          }
        )
      }
      storageAdapter = createStorageAdapter({ type: 'r2' }, env.FILES)
    }
    
    // 从存储后端获取文件
    const fileData = await storageAdapter.get(file.storage_key)
    if (!fileData) {
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

    // 增加下载计数
    await db.incrementDownloadCount(fileId)

    // 记录日志
    if (user || shareCode) {
      await db.createLog({
        action: '文件下载',
        userId: user?.userId,
        userName: user?.email || 'guest',
        status: '成功',
        fileId,
        fileName: file.name,
        details: shareCode ? `分享码: ${shareCode}` : undefined,
        ip: request.headers.get('CF-Connecting-IP') || undefined
      })
    }

    // 返回文件
    return new Response(fileData, {
      headers: {
        'Content-Type': file.mime_type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${file.name}"`,
        'Content-Length': file.size_bytes.toString(),
        ...corsHeaders(origin)
      }
    })
  } catch (error: any) {
    if (error instanceof Response) return error
    
    return new Response(
      JSON.stringify({ success: false, error: '下载失败' }),
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

