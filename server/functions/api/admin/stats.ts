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

    // 计算总存储（假设 1TB）
    const totalStorage = 1024 // GB
    const usedStorage = stats.totalSize / (1024 * 1024 * 1024) // 转换为 GB
    const availableStorage = totalStorage - usedStorage

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          totalStorage,
          usedStorage: Math.round(usedStorage * 100) / 100,
          availableStorage: Math.round(availableStorage * 100) / 100,
          r2Buckets: 1,
          totalFiles: stats.totalFiles,
          totalSize: Math.round(usedStorage * 100) / 100,
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

