/**
 * Cloudflare Worker 入口文件
 * 处理静态文件服务和 API 路由
 */

import { corsHeaders, handleOptions } from './src/utils/cors'

export interface Env {
  DB: D1Database
  FILES: R2Bucket
  JWT_SECRET: string
  R2_PUBLIC_URL?: string
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return handleOptions()
    }

    // 处理 API 路由
    if (url.pathname.startsWith('/api/')) {
      try {
        // 动态路由处理
        const apiPath = url.pathname.replace('/api/', '')
        
        // 导入对应的 API 处理函数
        let handler: any = null
        let handlerPath = ''
        
        // 根据路径匹配处理函数
        if (apiPath === 'auth/login') {
          handlerPath = './functions/api/auth/login.ts'
        } else if (apiPath === 'auth/register') {
          handlerPath = './functions/api/auth/register.ts'
        } else if (apiPath.startsWith('extract/')) {
          handlerPath = './functions/api/extract/[code].ts'
        } else if (apiPath === 'files/list') {
          handlerPath = './functions/api/files/list.ts'
        } else if (apiPath === 'files/upload') {
          handlerPath = './functions/api/files/upload.ts'
        } else if (apiPath === 'files/download') {
          handlerPath = './functions/api/files/download.ts'
        } else if (apiPath === 'files/folders') {
          handlerPath = './functions/api/files/folders.ts'
        } else if (apiPath.startsWith('files/') && apiPath.split('/').length === 2) {
          handlerPath = './functions/api/files/[id].ts'
        } else if (apiPath === 'shares/create') {
          handlerPath = './functions/api/shares/create.ts'
        } else if (apiPath === 'shares/list') {
          handlerPath = './functions/api/shares/list.ts'
        } else if (apiPath.startsWith('shares/') && apiPath.split('/').length === 2) {
          handlerPath = './functions/api/shares/[id].ts'
        } else if (apiPath === 'admin/users') {
          handlerPath = './functions/api/admin/users.ts'
        } else if (apiPath.startsWith('admin/users/') && apiPath.split('/').length === 3) {
          handlerPath = './functions/api/admin/users/[id].ts'
        } else if (apiPath === 'admin/groups') {
          handlerPath = './functions/api/admin/groups.ts'
        } else if (apiPath.startsWith('admin/groups/') && apiPath.split('/').length === 3) {
          handlerPath = './functions/api/admin/groups/[id].ts'
        } else if (apiPath === 'admin/files') {
          handlerPath = './functions/api/admin/files.ts'
        } else if (apiPath === 'admin/stats') {
          handlerPath = './functions/api/admin/stats.ts'
        } else if (apiPath === 'admin/logs') {
          handlerPath = './functions/api/admin/logs.ts'
        }
        
        if (handlerPath) {
          try {
            const handlerModule = await import(handlerPath)
            // 尝试不同的导出方式
            handler = handlerModule.default || 
                     handlerModule.onRequest || 
                     handlerModule.onRequestPost || 
                     handlerModule.onRequestGet ||
                     handlerModule.onRequestPut ||
                     handlerModule.onRequestDelete
            
            if (handler) {
              const context = {
                request,
                env,
                next: () => fetch(request, env, ctx)
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
          } catch (importError) {
            console.error('Import error for', handlerPath, importError)
          }
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
        return new Response(
          JSON.stringify({ success: false, error: 'Internal server error' }),
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
    // ASSETS 是一个 Fetcher 对象，可以直接调用 fetch
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
    // 或者返回 404
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
