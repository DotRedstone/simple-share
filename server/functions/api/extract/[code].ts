import { Database } from '../../../src/utils/db'
import { getR2Object } from '../../../src/utils/r2'
import { formatFileSize } from '../../../src/utils/r2'
import { corsHeaders } from '../../../src/utils/cors'
import type { Env } from '../../../src/utils/db'

export async function onRequestGet(context: { env: Env; request: Request; params: { code: string } }): Promise<Response> {
  const { env, request, params } = context
  const db = new Database(env.DB)
  const origin = request.headers.get('Origin')

  try {
    const shareCode = params.code.toUpperCase()

    // 查找分享记录
    const share = await db.getShareByCode(shareCode)
    if (!share) {
      return new Response(
        JSON.stringify({ success: false, error: '提取码无效或已过期' }),
        { 
          status: 404, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders(origin)
          } 
        }
      )
    }

    // 检查是否超过最大访问次数
    if (share.max_access && share.access_count >= share.max_access) {
      return new Response(
        JSON.stringify({ success: false, error: '分享链接已达到最大访问次数' }),
        { 
          status: 403, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders(origin)
          } 
        }
      )
    }

    // 获取文件信息
    const url = new URL(request.url)
    const folderIdParam = url.searchParams.get('folderId')
    const folderId = folderIdParam ? parseInt(folderIdParam) : null

    // 获取被分享的根文件/文件夹
    const rootFile = await db.getFileById(share.file_id)
    if (!rootFile) {
      return new Response(
        JSON.stringify({ success: false, error: '分享的文件已不存在' }),
        { 
          status: 404, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders(origin)
          } 
        }
      )
    }

    // 如果指定了 folderId，验证它是否是被分享文件夹的子项目
    let currentFile = rootFile
    if (folderId && folderId !== rootFile.id) {
      const targetFolder = await db.getFileById(folderId)
      const isDescendant = targetFolder && (
        targetFolder.path === rootFile.path || 
        targetFolder.path.startsWith(rootFile.path + '/')
      )
      
      if (!targetFolder || !isDescendant) {
        return new Response(
          JSON.stringify({ success: false, error: '无权访问此目录' }),
          { 
            status: 403, 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders(origin)
            } 
          }
        )
      }
      currentFile = targetFolder
    }

    // 增加访问计数
    await db.incrementShareAccess(shareCode)

    // 如果是文件夹，获取其下的子项目
    let children = []
    if (currentFile.type === 'folder') {
      const childFiles = await db.getFilesByUserId(currentFile.user_id, currentFile.id)
      children = childFiles.map(cf => ({
        id: cf.id,
        name: cf.name,
        size: cf.type === 'folder' ? '-' : formatFileSize(cf.size_bytes),
        type: cf.type,
        downloadUrl: cf.type === 'folder' ? null : `/api/files/download?id=${cf.id}&shareCode=${shareCode}`
      }))
    }

    // 记录日志
    await db.createLog({
      action: '提取文件',
      userId: share.user_id,
      status: '成功',
      fileId: rootFile.id,
      fileName: rootFile.name,
      details: `提取码: ${shareCode}${folderId ? `, 目录ID: ${folderId}` : ''}`,
      ip: request.headers.get('CF-Connecting-IP') || undefined
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: currentFile.id,
          name: currentFile.name,
          size: currentFile.type === 'folder' ? '-' : formatFileSize(currentFile.size_bytes),
          uploadTime: new Date(currentFile.created_at).toISOString(),
          type: currentFile.type,
          downloadUrl: currentFile.type === 'folder' ? null : `/api/files/download?id=${currentFile.id}&shareCode=${shareCode}`,
          children: children.length > 0 ? children : undefined,
          isRoot: currentFile.id === rootFile.id,
          rootName: rootFile.name
        }
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders(origin)
        } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: '获取文件信息失败' }),
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

