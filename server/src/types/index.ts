// 共享类型定义（与前端保持一致）
export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  status: '活跃' | '已暂停'
  storageQuota?: number
  storageUsed?: number
  groupId?: string
  passwordHash?: string
  createdAt?: string
  updatedAt?: string
}

export interface FileItem {
  id: number
  name: string
  size: string
  date: string
  type: 'folder' | 'pdf' | 'image' | 'video' | 'zip' | 'code'
  starred: boolean
  children?: FileItem[]
  mimeType?: string
  uploadTime?: string
  storageKey?: string
  userId?: number
  downloadCount?: number
  parentId?: number
  path?: string
}

export interface ShareRecord {
  id: string
  fileId: number
  shareCode: string
  expirationDays: number
  createdAt: string
  expiresAt: string
  accessCount: number
  maxAccess?: number
  userId: string
}

export interface UserGroup {
  id: string
  name: string
  description?: string
  storageQuota: number
  maxUsers?: number
  currentUsers?: number
  permissions?: string[]
}

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

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface JwtPayload {
  userId: string
  email: string
  role: 'admin' | 'user'
  iat?: number
  exp?: number
}

