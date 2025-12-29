import { Database } from '../../../src/utils/db'
import { requireAuth } from '../../../src/middleware/auth'
import { createStorageAdapter, type StorageBackendConfig } from '../../../src/utils/storage'
import type { Env } from '../../../src/utils/db'

export async function onRequestPost(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const db = new Database(env.DB)

  try {
    const user = await requireAuth(request, env)
    const { fileIds } = await request.json()

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: '未选择要删除的文件' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    let successCount = 0
    let totalFreedBytes = 0

    for (const fileId of fileIds) {
      try {
        const file = await db.getFileById(fileId)
        if (!file) continue

        // 检查权限
        if (file.user_id !== user.userId && user.role !== 'admin') continue

        // 从存储后端删除物理文件（如果不是文件夹）
        if (file.type !== 'folder') {
          let storageAdapter = null
          if (file.storage_backend_id) {
            const storageBackend = await db.getStorageBackendById(file.storage_backend_id)
            if (storageBackend && storageBackend.enabled === 1) {
              const config: StorageBackendConfig = JSON.parse(storageBackend.config)
              config.type = storageBackend.type as 'r2' | 's3' | 'webdav' | 'ftp' | 'sftp'
              storageAdapter = createStorageAdapter(config, env.FILES)
            }
          }
          
          if (!storageAdapter && env.FILES) {
            storageAdapter = createStorageAdapter({ type: 'r2' }, env.FILES)
          }
          
          if (storageAdapter) {
            await storageAdapter.delete(file.storage_key)
          }
          totalFreedBytes += file.size_bytes
        }

        // 删除数据库记录
        await db.deleteFile(fileId)
        successCount++

        // 记录日志
        await db.createLog({
          action: '删除文件 (批量)',
          userId: user.userId,
          userName: user.email,
          status: '成功',
          fileId,
          fileName: file.name,
          ip: request.headers.get('CF-Connecting-IP') || undefined
        })
      } catch (err) {
        console.error(`删除文件 ${fileId} 失败:`, err)
      }
    }

    // 批量更新用户存储使用量
    if (totalFreedBytes > 0) {
      const userData = await db.getUserById(user.userId)
      if (userData) {
        const newSize = Math.max(0, (userData.storage_used || 0) - totalFreedBytes / (1024 * 1024 * 1024))
        await db.updateUser(user.userId, { storageUsed: newSize })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `成功删除 ${successCount} 个文件`,
        data: { successCount }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    if (error instanceof Response) return error
    
    return new Response(
      JSON.stringify({ success: false, error: '批量删除失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

