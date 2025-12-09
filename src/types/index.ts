// 文件相关类型
export interface FileItem {
  id: number
  name: string
  size: string
  date: string
  type: 'folder' | 'pdf' | 'image' | 'video' | 'zip' | 'code'
  starred: boolean
  children?: FileItem[]
  // 元数据扩展
  mimeType?: string
  uploadTime?: string
  storageKey?: string // R2存储的Key
  userId?: number
  downloadCount?: number
}

// 用户相关类型
export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  status: '活跃' | '已暂停'
  storageQuota?: number // 存储配额（GB）
  storageUsed?: number // 已用存储（GB）
  groupId?: string // 所属用户组ID
}

// 用户组类型
export interface UserGroup {
  id: string
  name: string
  description?: string
  storageQuota: number // 组存储配额（GB）
  maxUsers?: number // 最大用户数
  currentUsers?: number // 当前用户数
  permissions?: string[] // 权限列表
}

// 存储统计类型
export interface StorageStats {
  totalStorage: number // 总存储（GB）
  usedStorage: number // 已用存储（GB）
  availableStorage: number // 可用存储（GB）
  r2Buckets: number // R2存储桶数量
  totalFiles: number // 总文件数
  totalSize: number // 总大小（GB）
}

// 系统日志类型
export interface SystemLog {
  id: number
  action: string
  user: string
  time: string
  status: '成功' | '警告' | '失败'
  details?: string
  ip?: string
  fileId?: number
  fileName?: string
}

// 统计卡片类型
export interface StatCard {
  title: string
  value: string
  color: string
}

// 菜单项类型
export interface MenuItem {
  id: string
  label: string
  icon: string
}

// 文件操作类型
export type FileAction = '分享' | '下载' | '重命名' | '删除' | '收藏' | '管理分享'

