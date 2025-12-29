import { Database } from '../../../src/utils/db'
import { requireAdmin } from '../../../src/middleware/auth'
import { createStorageAdapter } from '../../../src/utils/storage'
import type { Env } from '../../../src/utils/db'

export async function onRequestPost(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const db = new Database(env.DB)

  try {
    const admin = await requireAdmin(request, env)
    const { fileId, reason } = await request.json() as { fileId: number, reason?: string }

    if (!fileId) {
      return new Response(JSON.stringify({ success: false, error: '文件ID不能为空' }), { status: 400 })
    }

    const file = await db.getFileById(fileId)
    if (!file) {
      return new Response(JSON.stringify({ success: false, error: '文件不存在' }), { status: 404 })
    }

    // 1. 从存储后端物理删除文件（如果不是文件夹且尚未删除）
    if (file.type !== 'folder' && file.size_bytes > 0) {
      try {
        let storageAdapter = null
        if (file.storage_backend_id) {
          const backend = await db.getStorageBackendById(file.storage_backend_id)
          if (backend && backend.enabled) {
            storageAdapter = createStorageAdapter(JSON.parse(backend.config), env.FILES)
          }
        }
        
        if (!storageAdapter && env.FILES) {
          storageAdapter = createStorageAdapter({ type: 'r2' }, env.FILES)
        }

        if (storageAdapter) {
          await storageAdapter.delete(file.storage_key)
        }
      } catch (err) {
        console.error('Physical delete failed during takedown:', err)
        // 继续，即使物理删除失败也要更新数据库状态
      }
    }

    // 2. 更新数据库记录为“违规下架”状态（占位符）
    const originalName = file.name
    await db.db.prepare(
      'UPDATE files SET name = ?, size_bytes = 0, updated_at = ? WHERE id = ?'
    ).bind(
      `[违规已下架] ${originalName}`,
      Date.now(),
      fileId
    ).run()

    // 3. 记录管理日志
    await db.createLog({
      action: '下架文件',
      userId: admin.userId,
      userName: admin.email,
      status: '成功',
      details: `下架文件: ${originalName} (ID: ${fileId})${reason ? ` 原因: ${reason}` : ''}`,
      fileId,
      fileName: originalName
    })

    return new Response(JSON.stringify({ success: true, message: '文件已下架并替换为占位符' }))
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 })
  }
}

