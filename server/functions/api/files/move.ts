import { Database } from '../../../src/utils/db'
import { requireAuth } from '../../../src/middleware/auth'
import type { Env } from '../../../src/utils/db'

export async function onRequestPost(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const db = new Database(env.DB)

  try {
    const user = await requireAuth(request, env)
    const { fileIds, targetFolderId } = await request.json()

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: '请选择要移动的文件' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 验证目标文件夹（如果指定）
    let targetFolderPath = '/'
    if (targetFolderId !== null && targetFolderId !== undefined) {
      const targetFolder = await db.getFileById(targetFolderId)
      if (!targetFolder || targetFolder.type !== 'folder') {
        return new Response(
          JSON.stringify({ success: false, error: '目标文件夹不存在' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
      }
      if (targetFolder.user_id !== user.userId) {
        return new Response(
          JSON.stringify({ success: false, error: '无权访问目标文件夹' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }
      targetFolderPath = targetFolder.path
    }

    // 移动每个文件
    for (const fileId of fileIds) {
      const file = await db.getFileById(fileId)
      if (!file) continue
      
      // 验证文件所有权
      if (file.user_id !== user.userId) {
        continue // 跳过不属于当前用户的文件
      }

      // 防止将文件夹移动到自身或其子文件夹中
      if (file.type === 'folder' && targetFolderId !== null && targetFolderId !== undefined) {
        if (targetFolderId === fileId || targetFolderPath.startsWith(file.path + '/')) {
          continue // 跳过非法移动
        }
      }

      // 如果目标文件夹就是当前父文件夹，跳过
      if (file.parent_id === targetFolderId) {
        continue
      }

      // 更新文件的 parent_id 和 path
      const newPath = targetFolderId 
        ? targetFolderPath + '/' + file.name
        : '/' + file.name

      // 更新当前文件
      await db.db.prepare(
        'UPDATE files SET parent_id = ?, path = ?, updated_at = ? WHERE id = ?'
      ).bind(
        targetFolderId || null,
        newPath,
        Date.now(),
        fileId
      ).run()

      // 如果是文件夹，递归更新所有子项的路径
      if (file.type === 'folder') {
        const oldPathPrefix = file.path + '/'
        const newPathPrefix = newPath + '/'
        
        await db.db.prepare(
          "UPDATE files SET path = ? || substr(path, ?), updated_at = ? WHERE path LIKE ?"
        ).bind(
          newPathPrefix,
          oldPathPrefix.length + 1,
          Date.now(),
          oldPathPrefix + '%'
        ).run()
      }
    }

    // 记录日志
    await db.createLog({
      action: '移动文件',
      userId: user.userId,
      userName: user.email,
      status: '成功',
      details: `移动了 ${fileIds.length} 个文件`
    })

    return new Response(
      JSON.stringify({ success: true, message: '移动成功' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    if (error instanceof Response) return error
    
    return new Response(
      JSON.stringify({ success: false, error: error.message || '移动失败' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

