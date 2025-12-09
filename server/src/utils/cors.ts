// CORS 工具函数
export function corsHeaders(origin?: string | null): HeadersInit {
  const headers: HeadersInit = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  // 允许所有来源（生产环境应限制为特定域名）
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin
  } else {
    headers['Access-Control-Allow-Origin'] = '*'
  }

  return headers
}

export function handleOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  })
}

