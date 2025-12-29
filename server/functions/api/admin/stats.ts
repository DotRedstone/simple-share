import { Database } from '../../../src/utils/db'
import { requireAdmin } from '../../../src/middleware/auth'
import { formatFileSize } from '../../../src/utils/r2'
import type { Env } from '../../../src/utils/db'

export async function onRequestGet(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const db = new Database(env.DB)

  try {
    await requireAdmin(request, env)

    const stats = await db.getStorageStats()

    // 总存储：优先使用所有启用后端的总配额之和（GB）
    // 如果没有设置后端配额，回退到 1TB
    const totalStorage = stats.totalBackendQuota && stats.totalBackendQuota > 0 
      ? stats.totalBackendQuota 
      : 1024 // GB
    
    // 已用存储：根据文件表中 size_bytes 汇总，转换为 GB
    const usedStorage = stats.totalSize / (1024 * 1024 * 1024)
    const availableStorage = Math.max(totalStorage - usedStorage, 0)
    const usedStorageRounded = Math.round(usedStorage * 100) / 100
    const availableStorageRounded = Math.round(availableStorage * 100) / 100

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          totalStorage,
          usedStorage: usedStorageRounded,
          availableStorage: availableStorageRounded,
          r2Buckets: stats.r2Backends || 0,
          totalFiles: stats.totalFiles,
          totalSize: usedStorageRounded,
          totalUsers: stats.totalUsers,
          activeUsers: stats.activeUsers
        }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    if (error instanceof Response) return error
    
    return new Response(
      JSON.stringify({ success: false, error: '获取统计信息失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

