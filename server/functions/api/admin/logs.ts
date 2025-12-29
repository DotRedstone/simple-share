import { Database } from '../../../src/utils/db'
import { requireAdmin } from '../../../src/middleware/auth'
import type { Env } from '../../../src/utils/db'

export async function onRequestGet(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const db = new Database(env.DB)

  try {
    await requireAdmin(request, env)
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '100')
    const sortBy = url.searchParams.get('sortBy') || 'created_at'
    const order = url.searchParams.get('order') || 'DESC'

    const logs = await db.getLogs(limit, sortBy, order)

    const formattedLogs = logs.map(log => ({
      id: log.id,
      action: log.action,
      user: log.user_name || log.user_id || 'system',
      time: new Date(log.created_at).toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }),
      status: log.status,
      details: log.details,
      ip: log.ip,
      fileId: log.file_id,
      fileName: log.file_name
    }))

    return new Response(
      JSON.stringify({
        success: true,
        data: formattedLogs
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    if (error instanceof Response) return error
    
    return new Response(
      JSON.stringify({ success: false, error: '获取日志失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

