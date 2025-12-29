/**
 * SimpleShare Server Entry
 * 基于 Cloudflare Workers 的全栈网盘系统后端
 */

import { corsHeaders, handleOptions } from './src/utils/cors'
import { ensureDatabaseInitialized } from './src/utils/init'
import type { Env } from './src/utils/db'

// 核心功能处理函数导入
import { onRequestPost as loginHandler } from './functions/api/auth/login'
import { onRequestPost as registerHandler } from './functions/api/auth/register'
import { onRequestPost as resetPasswordHandler } from './functions/api/auth/reset-password'
import { onRequestGet as extractHandler } from './functions/api/extract/[code]'
import { onRequestGet as filesListHandler } from './functions/api/files/list'
import { onRequestPost as filesUploadHandler } from './functions/api/files/upload'
import { onRequestGet as filesDownloadHandler } from './functions/api/files/download'
import { onRequestPost as filesFoldersHandler } from './functions/api/files/folders'
import { onRequestPost as filesSaveHandler } from './functions/api/files/save'
import { onRequestPost as filesMoveHandler } from './functions/api/files/move'
import { onRequestPost as filesBatchDeleteHandler } from './functions/api/files/batch-delete'
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

// 静态路由表定义
const apiRoutes: Record<string, Record<string, (context: any) => Promise<Response>>> = {
  'auth/login': { 'POST': loginHandler },
  'auth/register': { 'POST': registerHandler },
  'auth/reset-password': { 'POST': resetPasswordHandler },
  'files/list': { 'GET': filesListHandler },
  'files/upload': { 'POST': filesUploadHandler },
  'files/download': { 'GET': filesDownloadHandler },
  'files/folders': { 'POST': filesFoldersHandler },
  'files/save': { 'POST': filesSaveHandler },
  'files/move': { 'POST': filesMoveHandler },
  'files/batch-delete': { 'POST': filesBatchDeleteHandler },
  'shares/create': { 'POST': sharesCreateHandler },
  'shares/list': { 'GET': sharesListHandler },
  'admin/users': { 'GET': adminUsersHandler, 'POST': adminUsersCreateHandler },
  'admin/groups': { 'GET': adminGroupsHandler, 'POST': adminGroupsCreateHandler },
  'admin/groups/storage': { 'GET': adminGroupStorageHandler, 'POST': adminGroupStorageCreateHandler },
  'admin/files': { 'GET': adminFilesHandler },
  'admin/stats': { 'GET': adminStatsHandler },
  'admin/logs': { 'GET': adminLogsHandler },
  'admin/storage': { 'GET': adminStorageHandler, 'POST': adminStorageCreateHandler }
}

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin') || ''
    
    // 初始化数据库环境
    if (env.DB) {
      try {
        await ensureDatabaseInitialized(env.DB)
      } catch (error) {
        console.error('Core init failure:', error)
      }
    }
    
    // 跨域预检请求处理
    if (request.method === 'OPTIONS') {
      return handleOptions()
    }

    // API 路由网关
    if (url.pathname.startsWith('/api/')) {
      if (!env.DB) {
        return new Response(JSON.stringify({ success: false, error: 'Database binding required' }), { status: 503 })
      }

      try {
        const apiPath = url.pathname.replace('/api/', '')
        const method = request.method
        let handler: ((context: any) => Promise<Response>) | null = null
        let params: Record<string, string> = {}
        
        // 匹配静态路由
        const staticRoute = apiRoutes[apiPath]
        if (staticRoute && staticRoute[method]) {
          handler = staticRoute[method]
        } else {
          // 动态路径参数解析逻辑
          if (apiPath.startsWith('extract/')) {
            params = { code: apiPath.replace('extract/', '') }
            handler = extractHandler
          } else if (apiPath.match(/^files\/\d+$/)) {
            params = { id: apiPath.split('/')[1] }
            if (method === 'PUT') handler = filesUpdateHandler
            else if (method === 'DELETE') handler = filesDeleteHandler
          } else if (apiPath.match(/^admin\/users\/[^/]+$/)) {
            params = { id: apiPath.split('/')[2] }
            if (method === 'PUT') handler = adminUsersUpdateHandler
            else if (method === 'DELETE') handler = adminUsersDeleteHandler
          } else if (apiPath.match(/^admin\/storage\/[a-zA-Z0-9_-]+$/)) {
            params = { id: apiPath.split('/')[2] }
            if (method === 'PUT') handler = adminStorageUpdateHandler
            else if (method === 'DELETE') handler = adminStorageDeleteHandler
          }
          // ... 其他动态匹配
        }
        
        if (handler) {
          const context = { request, env, params, next: () => fetch(request, env, ctx) }
          const response = await handler(context)
          const headers = new Headers(response.headers)
          Object.entries(corsHeaders(origin)).forEach(([k, v]) => headers.set(k, v as string))
          return new Response(response.body, { status: response.status, headers })
        }
        
        return new Response(JSON.stringify({ success: false, error: 'Endpoint not found' }), { status: 404 })
      } catch (error: any) {
        return new Response(JSON.stringify({ success: false, error: 'Internal Error', details: error.message }), { status: 500 })
      }
    }

    // SPA 静态资源转发处理
    if (env.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(request)
      if (assetResponse.status !== 404) return assetResponse
      if (url.pathname === '/' || !url.pathname.includes('.')) {
        return env.ASSETS.fetch(new Request(new URL('/index.html', request.url)))
      }
    }
    
    return new Response('Resource Not Found', { status: 404 })
  }
}
