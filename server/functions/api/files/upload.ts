import { Database } from '../../../src/utils/db'
import { requireAuth } from '../../../src/middleware/auth'
import { generateR2Key, getFileType, formatFileSize } from '../../../src/utils/r2'
import { createStorageAdapter, type StorageBackendConfig } from '../../../src/utils/storage'
import { corsHeaders } from '../../../src/utils/cors'
import type { Env } from '../../../src/utils/db'

export async function onRequestPost(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const db = new Database(env.DB)

  try {
    const user = await requireAuth(request, env)

    const formData = await request.formData()
    const file = formData.get('file') as File
    const parentId = formData.get('parentId') ? parseInt(formData.get('parentId') as string) : null

    if (!file) {
      const origin = request.headers.get('Origin')
      return new Response(
        JSON.stringify({ success: false, error: '请选择要上传的文件' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders(origin)
          } 
        }
      )
    }

    // 检查存储配额
    const userData = await db.getUserById(user.userId)
    if (userData) {
      const newSize = (userData.storage_used || 0) + file.size
      if (userData.storage_quota && newSize > userData.storage_quota * 1024 * 1024 * 1024) {
        const origin = request.headers.get('Origin')
        return new Response(
          JSON.stringify({ success: false, error: '存储空间不足' }),
          { 
            status: 403, 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders(origin)
            } 
          }
        )
      }
    }

    // 获取默认存储后端或指定的存储后端
    const storageBackendId = formData.get('storageBackendId') as string | null
    let storageBackend = null
    let storageAdapter = null
    let backendConfig: StorageBackendConfig | null = null
    
    if (storageBackendId) {
      storageBackend = await db.getStorageBackendById(storageBackendId)
      if (!storageBackend || storageBackend.enabled !== 1) {
        const origin = request.headers.get('Origin')
        return new Response(
          JSON.stringify({ success: false, error: '指定的存储后端不可用' }),
          { 
            status: 400, 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders(origin)
            } 
          }
        )
      }
    } else {
      storageBackend = await db.getDefaultStorageBackend()
    }
    
    // 如果没有配置存储后端，尝试使用默认的 R2
    if (!storageBackend) {
      if (!env.FILES) {
        const origin = request.headers.get('Origin')
        return new Response(
          JSON.stringify({ success: false, error: '未配置存储后端，请在管理员面板或用户设置中添加存储后端' }),
          { 
            status: 400, 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders(origin)
            } 
          }
        )
      }
      backendConfig = { type: 'r2' }
      storageAdapter = createStorageAdapter(backendConfig, env.FILES)
    } else {
      backendConfig = JSON.parse(storageBackend.config)
      backendConfig!.type = storageBackend.type as 'r2' | 's3' | 'webdav' | 'ftp' | 'sftp'
      storageAdapter = createStorageAdapter(backendConfig!, env.FILES)
    }

    // 检查存储后端总配额（如果设置了）
    if (backendConfig && backendConfig.quotaGb && backendConfig.quotaGb > 0) {
      const totalSizeResult = await db.db.prepare('SELECT SUM(size_bytes) as total FROM files WHERE storage_backend_id = ? OR (storage_backend_id IS NULL AND ? = "r2")')
        .bind(storageBackend?.id || null, backendConfig.type)
        .first<{ total: number }>()
      
      const currentUsedBytes = totalSizeResult?.total || 0
      const quotaBytes = backendConfig.quotaGb * 1024 * 1024 * 1024
      
      if (currentUsedBytes + file.size > quotaBytes) {
        const origin = request.headers.get('Origin')
        return new Response(
          JSON.stringify({ success: false, error: `存储后端空间不足 (最大配额: ${backendConfig.quotaGb}GB)` }),
          { 
            status: 403, 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders(origin)
            } 
          }
        )
      }
    }
    
    // 上传文件
    const storageKey = generateR2Key(user.userId, file.name)
    const fileBuffer = await file.arrayBuffer()
    await storageAdapter.upload(storageKey, fileBuffer, file.type)

    // 构建文件路径
    let path = `/${file.name}`
    if (parentId) {
      const parent = await db.getFileById(parentId)
      if (parent) {
        path = `${parent.path}/${file.name}`
      }
    }

    // 保存文件元数据
    const fileId = await db.createFile({
      name: file.name,
      sizeBytes: file.size,
      mimeType: file.type,
      storageKey,
      storageBackendId: storageBackend?.id || null,
      userId: user.userId,
      parentId,
      path,
      type: getFileType(file.name, file.type)
    })

    // 更新用户存储使用量
    if (userData) {
      await db.updateUser(user.userId, {
        storageUsed: ((userData.storage_used || 0) + file.size) / (1024 * 1024 * 1024)
      })
    }

    // 记录日志
    await db.createLog({
      action: '文件上传',
      userId: user.userId,
      userName: user.email,
      status: '成功',
      fileId,
      fileName: file.name,
      ip: request.headers.get('CF-Connecting-IP') || undefined
    })

    const origin = request.headers.get('Origin')
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: fileId,
          name: file.name,
          size: formatFileSize(file.size),
          type: getFileType(file.name, file.type),
          date: new Date().toISOString().split('T')[0],
          starred: false
        }
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders(origin)
        } 
      }
    )
  } catch (error: any) {
    if (error instanceof Response) {
      const origin = request.headers.get('Origin')
      const headers = new Headers(error.headers)
      Object.entries(corsHeaders(origin)).forEach(([key, value]) => {
        headers.set(key, value as string)
      })
      return new Response(error.body, {
        status: error.status,
        statusText: error.statusText,
        headers
      })
    }
    
    const origin = request.headers.get('Origin')
    return new Response(
      JSON.stringify({ success: false, error: '上传失败，请稍后重试' }),
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

