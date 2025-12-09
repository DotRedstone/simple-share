// 统一响应格式工具
import type { ApiResponse } from '../types'

export function successResponse<T>(data: T, message?: string): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      message
    } as ApiResponse<T>),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

export function errorResponse(message: string, status: number = 400): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message
    } as ApiResponse),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

