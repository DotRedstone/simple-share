const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

const request = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = localStorage.getItem('authToken')
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || data.message || '请求失败',
      }
    }

    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '网络错误',
    }
  }
}

export const get = <T = any>(endpoint: string) => {
  return request<T>(endpoint, { method: 'GET' })
}

export const post = <T = any>(endpoint: string, body?: any) => {
  return request<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export const put = <T = any>(endpoint: string, body?: any) => {
  return request<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export const del = <T = any>(endpoint: string) => {
  return request<T>(endpoint, { method: 'DELETE' })
}

export const uploadFile = async (
  endpoint: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<ApiResponse> => {
  const token = localStorage.getItem('authToken')
  const formData = new FormData()
  formData.append('file', file)

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress((e.loaded / e.total) * 100)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText)
          resolve({ success: true, data })
        } catch {
          resolve({ success: true, data: xhr.responseText })
        }
      } else {
        resolve({
          success: false,
          error: `上传失败: ${xhr.statusText}`,
        })
      }
    })

    xhr.addEventListener('error', () => {
      resolve({
        success: false,
        error: '网络错误',
      })
    })

    xhr.open('POST', `${API_BASE_URL}${endpoint}`)
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    }
    xhr.send(formData)
  })
}

export default {
  get,
  post,
  put,
  delete: del,
  uploadFile,
}

