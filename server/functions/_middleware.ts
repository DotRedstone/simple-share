import { corsHeaders, handleOptions } from '../src/utils/cors'

export async function onRequest(context: { request: Request; next: () => Promise<Response> }): Promise<Response> {
  const { request, next } = context

  if (request.method === 'OPTIONS') {
    return handleOptions()
  }

  const response = await next()

  const origin = request.headers.get('Origin')
  const headers = new Headers(response.headers)
  Object.entries(corsHeaders(origin)).forEach(([key, value]) => {
    headers.set(key, value as string)
  })

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}

