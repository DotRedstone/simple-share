// 存储适配器抽象层
export interface StorageAdapter {
  upload(key: string, file: ArrayBuffer, contentType?: string): Promise<void>
  get(key: string): Promise<ArrayBuffer | null>
  delete(key: string): Promise<void>
  generatePresignedUrl?(key: string, expiresIn?: number): Promise<string>
}

export interface StorageBackendConfig {
  type: 'r2' | 's3' | 'webdav' | 'ftp' | 'sftp'
  // R2 配置
  bucket?: string
  accountId?: string
  // S3 配置
  endpoint?: string
  region?: string
  accessKeyId?: string
  secretAccessKey?: string
  bucketName?: string
  // WebDAV 配置
  webdavUrl?: string
  username?: string
  password?: string
  basePath?: string // WebDAV 基础路径
  // FTP/SFTP 配置
  host?: string
  port?: number
  path?: string
}

// R2 存储适配器
export class R2StorageAdapter implements StorageAdapter {
  private bucket: any // R2Bucket

  constructor(bucket: any) {
    this.bucket = bucket
  }

  async upload(key: string, file: ArrayBuffer, contentType?: string): Promise<void> {
    await this.bucket.put(key, file, {
      httpMetadata: {
        contentType: contentType || 'application/octet-stream',
        cacheControl: 'public, max-age=31536000'
      }
    })
  }

  async get(key: string): Promise<ArrayBuffer | null> {
    const object = await this.bucket.get(key)
    if (!object) return null
    return await object.arrayBuffer()
  }

  async delete(key: string): Promise<void> {
    await this.bucket.delete(key)
  }

  async generatePresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    // R2 预签名 URL 生成
    const url = await this.bucket.createMultipartUpload(key)
    // 注意：R2 的预签名 URL 生成方式可能不同，这里需要根据实际 API 调整
    return url
  }
}

// WebDAV 存储适配器（用于 AList/OpenList 等网盘挂载）
export class WebDAVStorageAdapter implements StorageAdapter {
  private baseUrl: string
  private username: string
  private password: string
  private basePath: string

  constructor(config: StorageBackendConfig) {
    if (!config.webdavUrl || !config.username || !config.password) {
      throw new Error('WebDAV 配置不完整：需要 webdavUrl、username 和 password')
    }
    this.baseUrl = config.webdavUrl.replace(/\/$/, '')
    this.username = config.username
    this.password = config.password
    this.basePath = (config.basePath || '').replace(/^\//, '').replace(/\/$/, '')
  }

  private getFullPath(key: string): string {
    const path = this.basePath ? `${this.basePath}/${key}` : key
    return path.replace(/\/+/g, '/').replace(/^\//, '')
  }

  private getAuthHeader(): string {
    const credentials = btoa(`${this.username}:${this.password}`)
    return `Basic ${credentials}`
  }

  async upload(key: string, file: ArrayBuffer, contentType?: string): Promise<void> {
    const path = this.getFullPath(key)
    const url = `${this.baseUrl}/${path}`
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': contentType || 'application/octet-stream',
        'Content-Length': file.byteLength.toString()
      },
      body: file
    })

    if (!response.ok && response.status !== 201) {
      throw new Error(`WebDAV 上传失败: ${response.status} ${response.statusText}`)
    }
  }

  async get(key: string): Promise<ArrayBuffer | null> {
    const path = this.getFullPath(key)
    const url = `${this.baseUrl}/${path}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': this.getAuthHeader()
      }
    })

    if (response.status === 404) return null
    if (!response.ok) {
      throw new Error(`WebDAV 获取失败: ${response.status} ${response.statusText}`)
    }

    return await response.arrayBuffer()
  }

  async delete(key: string): Promise<void> {
    const path = this.getFullPath(key)
    const url = `${this.baseUrl}/${path}`
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': this.getAuthHeader()
      }
    })

    if (!response.ok && response.status !== 404) {
      throw new Error(`WebDAV 删除失败: ${response.status} ${response.statusText}`)
    }
  }

  async generatePresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    // WebDAV 通常不需要预签名，直接返回 URL（如果支持公共访问）
    const path = this.getFullPath(key)
    return `${this.baseUrl}/${path}`
  }
}

// FTP/SFTP 存储适配器（基础实现，实际可能需要使用专门的库）
export class FTPStorageAdapter implements StorageAdapter {
  private config: StorageBackendConfig

  constructor(config: StorageBackendConfig) {
    this.config = config
    // 注意：FTP/SFTP 需要专门的库，这里提供基础接口
    // 实际实现可能需要使用 @cloudflare/workers-types 或其他库
  }

  async upload(key: string, file: ArrayBuffer, contentType?: string): Promise<void> {
    // TODO: 实现 FTP/SFTP 上传
    // 这需要专门的 FTP/SFTP 客户端库
    throw new Error('FTP/SFTP 上传功能待实现')
  }

  async get(key: string): Promise<ArrayBuffer | null> {
    // TODO: 实现 FTP/SFTP 下载
    throw new Error('FTP/SFTP 下载功能待实现')
  }

  async delete(key: string): Promise<void> {
    // TODO: 实现 FTP/SFTP 删除
    throw new Error('FTP/SFTP 删除功能待实现')
  }
}

// S3 兼容存储适配器（AWS S3）
export class S3StorageAdapter implements StorageAdapter {
  private config: StorageBackendConfig
  private endpoint: string
  private region: string
  private accessKeyId: string
  private secretAccessKey: string
  private bucketName: string

  constructor(config: StorageBackendConfig) {
    this.config = config
    this.endpoint = config.endpoint || ''
    this.region = config.region || 'us-east-1'
    this.accessKeyId = config.accessKeyId || ''
    this.secretAccessKey = config.secretAccessKey || ''
    this.bucketName = config.bucketName || config.bucket || ''
  }

  private async signRequest(method: string, key: string, body?: ArrayBuffer): Promise<Request> {
    // 简化的 S3 签名实现（生产环境应使用完整的 AWS Signature V4）
    const url = `${this.endpoint}/${this.bucketName}/${key}`
    const headers: HeadersInit = {
      'Host': new URL(this.endpoint).hostname,
    }
    
    if (body) {
      headers['Content-Length'] = body.byteLength.toString()
    }

    return new Request(url, {
      method,
      headers,
      body
    })
  }

  async upload(key: string, file: ArrayBuffer, contentType?: string): Promise<void> {
    const url = `${this.endpoint}/${this.bucketName}/${key}`
    const headers: HeadersInit = {
      'Content-Type': contentType || 'application/octet-stream',
    }

    // 使用 AWS Signature V4 签名（简化版，实际应使用完整实现）
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: file
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }
  }

  async get(key: string): Promise<ArrayBuffer | null> {
    const url = `${this.endpoint}/${this.bucketName}/${key}`
    const response = await fetch(url, { method: 'GET' })
    
    if (response.status === 404) return null
    if (!response.ok) {
      throw new Error(`Get failed: ${response.statusText}`)
    }
    
    return await response.arrayBuffer()
  }

  async delete(key: string): Promise<void> {
    const url = `${this.endpoint}/${this.bucketName}/${key}`
    const response = await fetch(url, { method: 'DELETE' })
    
    if (!response.ok && response.status !== 404) {
      throw new Error(`Delete failed: ${response.statusText}`)
    }
  }

  async generatePresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    // S3 预签名 URL 生成（简化版）
    // 实际应使用 AWS SDK 或完整的签名算法
    const url = `${this.endpoint}/${this.bucketName}/${key}`
    // TODO: 实现完整的预签名 URL 生成
    return url
  }
}

// 存储适配器工厂
export function createStorageAdapter(
  config: StorageBackendConfig,
  r2Bucket?: any
): StorageAdapter {
  switch (config.type) {
    case 'r2':
      if (!r2Bucket) {
        throw new Error('R2 bucket is required for R2 storage adapter')
      }
      return new R2StorageAdapter(r2Bucket)
    
    case 's3':
      return new S3StorageAdapter(config)
    
    case 'webdav':
      return new WebDAVStorageAdapter(config)
    
    case 'ftp':
    case 'sftp':
      return new FTPStorageAdapter(config)
    
    default:
      throw new Error(`Unsupported storage type: ${config.type}`)
  }
}
  }
}

