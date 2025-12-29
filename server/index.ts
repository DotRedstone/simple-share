/**
 * Cloudflare Worker 入口文件
 * 处理静态文件服务和 API 路由
 */

import { corsHeaders, handleOptions } from './src/utils/cors'
import { ensureDatabaseInitialized } from './src/utils/init'
import type { Env } from './src/utils/db'

// 导入所有 API 处理函数
import { onRequestPost as loginHandler } from './functions/api/auth/login'
import { onRequestPost as registerHandler } from './functions/api/auth/register'
import { onRequestGet as extractHandler } from './functions/api/extract/[code]'
import { onRequestGet as filesListHandler } from './functions/api/files/list'
import { onRequestPost as filesUploadHandler } from './functions/api/files/upload'
import { onRequestGet as filesDownloadHandler } from './functions/api/files/download'
import { onRequestPost as filesFoldersHandler } from './functions/api/files/folders'
import { onRequestPost as filesSaveHandler } from './functions/api/files/save'
import { onRequestPost as filesMoveHandler } from './functions/api/files/move'
import { onRequestPut as filesUpdateHandler, onRequestDelete as filesDeleteHandler } from './functions/api/files/[id]'
import { onRequestPost as sharesCreateHandler } from './functions/api/shares/create'
import { onRequestGet as sharesListHandler } from './functions/api/shares/list'
import { onRequestDelete as sharesDeleteHandler } from './functions/api/shares/[id]'
import { onRequestGet as adminUsersHandler, onRequestPost as adminUsersCreateHandler } from './functions/api/admin/users'
import { onRequestPut as adminUsersUpdateHandler, onRequestDelete as adminUsersDeleteHandler } from './functions/api/admin/users/[id]'
import { onRequestGet as adminGroupsHandler, onRequestPost as adminGroupsCreateHandler } from './functions/api/admin/groups'
import { onRequestPut as adminGroupsUpdateHandler, onRequestDelete as adminGroupsDeleteHandler } from './functions/api/admin/groups/[id]'
import { onRequestGet as adminGroupStorageHandler, onRequestPost as adminGroupStorageCreateHandler } from './functions/api/admin/groups/storage'
import { onRequestPut as adminGroupStorageUpdateHandler, onRequestDelete as adminGroupStorageDeleteHandler } from './functions/api/admin/groups/storage/[id]'
import { onRequestGet as adminFilesHandler } from './functions/api/admin/files'
import { onRequestGet as adminStatsHandler } from './functions/api/admin/stats'
import { onRequestGet as adminLogsHandler } from './functions/api/admin/logs'
import { onRequestGet as adminStorageHandler, onRequestPost as adminStorageCreateHandler } from './functions/api/admin/storage'
import { onRequestPut as adminStorageUpdateHandler, onRequestDelete as adminStorageDeleteHandler } from './functions/api/admin/storage/[id]'
import { onRequestGet as userStorageHandler, onRequestPost as userStorageCreateHandler } from './functions/api/user/storage'
import { onRequestPut as userStorageUpdateHandler, onRequestDelete as userStorageDeleteHandler } from './functions/api/user/storage/[id]'

export interface WorkerEnv extends Env {
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>
  }
}

// API 路由映射
const apiRoutes: Record<string, Record<string, (context: any) => Promise<Response>>> = {
  'auth/login': {
    'POST': loginHandler
  },
  'auth/register': {
    'POST': registerHandler
  },
  'files/list': {
    'GET': filesListHandler
  },
  'files/upload': {
    'POST': filesUploadHandler
  },
  'files/download': {
    'GET': filesDownloadHandler
  },
  'files/folders': {
    'POST': filesFoldersHandler
  },
  'files/save': {
    'POST': filesSaveHandler
  },
  'files/move': {
    'POST': filesMoveHandler
  },
  'shares/create': {
    'POST': sharesCreateHandler
  },
  'shares/list': {
    'GET': sharesListHandler
  },
  'admin/users': {
    'GET': adminUsersHandler,
    'POST': adminUsersCreateHandler
  },
  'admin/groups': {
    'GET': adminGroupsHandler,
    'POST': adminGroupsCreateHandler
  },
  'admin/groups/storage': {
    'GET': adminGroupStorageHandler,
    'POST': adminGroupStorageCreateHandler
  },
  'admin/files': {
    'GET': adminFilesHandler
  },
  'admin/stats': {
    'GET': adminStatsHandler
  },
  'admin/logs': {
    'GET': adminLogsHandler
  },
  'admin/storage': {
    'GET': adminStorageHandler,
    'POST': adminStorageCreateHandler
  }
}

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    
    // 自动初始化数据库（仅在检测到绑定时执行）
    if (env.DB) {
      try {
        await ensureDatabaseInitialized(env.DB)
      } catch (error) {
        console.error('数据库初始化延迟或错误:', error)
      }
    }
    
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return handleOptions()
    }

    // 检查是否是 API 请求
    if (url.pathname.startsWith('/api/')) {
      // 检查关键绑定是否缺失
      if (!env.DB) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: '数据库未绑定', 
            details: '请前往 Cloudflare Dashboard 为此 Worker 添加名为 "DB" 的 D1 绑定。' 
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      }
      try {
        const apiPath = url.pathname.replace('/api/', '')
        const method = request.method
        
        // 处理动态路由
        let handler: ((context: any) => Promise<Response>) | null = null
        let params: Record<string, string> = {}
        
        // 先检查静态路由（必须在动态路由之前）
        const staticRoute = apiRoutes[apiPath]
        if (staticRoute && staticRoute[method]) {
          handler = staticRoute[method]
        } else {
          // 检查是否是动态路由（带参数的路由）
          if (apiPath.startsWith('extract/')) {
            // extract/[code] 路由
            const code = apiPath.replace('extract/', '')
            params = { code }
            handler = extractHandler
          } else if (apiPath.match(/^files\/\d+$/)) {
            // files/[id] 路由（必须是数字）
            const id = apiPath.split('/')[1]
            params = { id }
            if (method === 'PUT') {
              handler = filesUpdateHandler
            } else if (method === 'DELETE') {
              handler = filesDeleteHandler
            }
          } else if (apiPath.match(/^shares\/[a-zA-Z0-9_-]+$/) && !apiPath.startsWith('shares/create') && !apiPath.startsWith('shares/list')) {
            // shares/[id] 路由（排除 shares/create 和 shares/list）
            const id = apiPath.split('/')[1]
            params = { id }
            if (method === 'DELETE') {
              handler = sharesDeleteHandler
            }
          } else if (apiPath.match(/^admin\/users\/[^/]+$/)) {
            // admin/users/[id] 路由（支持字符串ID）
            const id = apiPath.split('/')[2]
            params = { id }
            if (method === 'PUT') {
              handler = adminUsersUpdateHandler
            } else if (method === 'DELETE') {
              handler = adminUsersDeleteHandler
            }
          } else if (apiPath.match(/^admin\/groups\/[^/]+$/)) {
            // admin/groups/... 路由（支持字符串ID）
            const parts = apiPath.split('/')
            const idOrSegment = parts[2]

            if (idOrSegment === 'storage' && parts.length === 4) {
              // admin/groups/storage/[id]
              const id = parts[3]
              params = { id }
              if (method === 'PUT') {
                handler = adminGroupStorageUpdateHandler
              } else if (method === 'DELETE') {
                handler = adminGroupStorageDeleteHandler
              }
            } else if (parts.length === 3) {
              // admin/groups/[id]
              const id = idOrSegment
            params = { id }
            if (method === 'PUT') {
              handler = adminGroupsUpdateHandler
            } else if (method === 'DELETE') {
              handler = adminGroupsDeleteHandler
              }
            }
          } else if (apiPath.match(/^admin\/storage\/[a-zA-Z0-9_-]+$/)) {
            // admin/storage/[id] 路由
            const id = apiPath.split('/')[2]
            params = { id }
            if (method === 'PUT') {
              handler = adminStorageUpdateHandler
            } else if (method === 'DELETE') {
              handler = adminStorageDeleteHandler
            }
          }
        }
        
        if (handler) {
          // 检查必要的环境变量
          if (!env.JWT_SECRET) {
            return new Response(
              JSON.stringify({ success: false, error: 'JWT_SECRET not configured' }),
              { 
                status: 500, 
                headers: { 
                  'Content-Type': 'application/json',
                  ...corsHeaders(request.headers.get('Origin') || '')
                } 
              }
            )
          }
          
          if (!env.DB) {
            return new Response(
              JSON.stringify({ success: false, error: 'Database not configured' }),
              { 
                status: 500, 
                headers: { 
                  'Content-Type': 'application/json',
                  ...corsHeaders(request.headers.get('Origin') || '')
                } 
              }
            )
          }
          
          const context: any = {
            request,
            env,
            next: () => fetch(request, env, ctx)
          }
          
          // 如果有参数，添加到 context
          if (Object.keys(params).length > 0) {
            context.params = params
          }
          
          const response = await handler(context)
          
          // 添加 CORS 头
          const origin = request.headers.get('Origin')
          const headers = new Headers(response.headers)
          Object.entries(corsHeaders(origin || '')).forEach(([key, value]) => {
            headers.set(key, value as string)
          })
          
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers
          })
        }
        
        // 如果找不到处理函数，返回 404
        return new Response(
          JSON.stringify({ success: false, error: 'API endpoint not found' }),
          { 
            status: 404, 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders(request.headers.get('Origin') || '')
            } 
          }
        )
      } catch (error) {
        console.error('API handler error:', error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        const errorStack = error instanceof Error ? error.stack : undefined
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Internal server error',
            details: errorMessage,
            stack: errorStack
          }),
          { 
            status: 500, 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders(request.headers.get('Origin') || '')
            } 
          }
        )
      }
    }

    // 处理静态文件 - 通过 ASSETS 绑定
    if (env.ASSETS) {
      try {
        const assetResponse = await env.ASSETS.fetch(request)
        // 如果找到静态文件，直接返回
        if (assetResponse.status !== 404) {
          return assetResponse
        }
      } catch (error) {
        console.error('Asset fetch error:', error)
      }
    }
    
    // 如果没有找到静态文件，返回 index.html（用于 SPA 路由）
    if (url.pathname === '/' || !url.pathname.includes('.')) {
      // SPA 路由，返回 index.html
      if (env.ASSETS) {
        const indexRequest = new Request(new URL('/index.html', request.url))
        const indexResponse = await env.ASSETS.fetch(indexRequest)
        if (indexResponse.status !== 404) {
          return indexResponse
        }
      }
    }
    
    // 如果都没有找到，返回 404
    return new Response('Not Found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain',
        ...corsHeaders(request.headers.get('Origin') || '')
      }
    })
  }
}
