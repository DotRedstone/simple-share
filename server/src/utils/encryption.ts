// 简单的加密工具（用于用户存储配置加密）
// 注意：这是基础实现，生产环境应使用更强的加密算法

export function encryptConfig(config: string, userKey: string): string {
  // 使用简单的 XOR 加密（实际应使用 AES 等）
  // 这里使用 base64 编码 + 简单的密钥混合
  const key = generateKey(userKey)
  let encrypted = ''
  for (let i = 0; i < config.length; i++) {
    encrypted += String.fromCharCode(config.charCodeAt(i) ^ key.charCodeAt(i % key.length))
  }
  return btoa(encrypted)
}

export function decryptConfig(encrypted: string, userKey: string): string {
  try {
    const key = generateKey(userKey)
    const decoded = atob(encrypted)
    let decrypted = ''
    for (let i = 0; i < decoded.length; i++) {
      decrypted += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length))
    }
    return decrypted
  } catch (error) {
    throw new Error('解密失败')
  }
}

function generateKey(userKey: string): string {
  // 基于用户ID生成密钥
  // 实际应使用更安全的方法
  const hash = userKey.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0)
  }, 0)
  return Math.abs(hash).toString(36).repeat(10)
}

