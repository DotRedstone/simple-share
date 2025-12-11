<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth0 } from '@auth0/auth0-vue'
import { useAuthStore } from '../stores'

const router = useRouter()
let auth0: ReturnType<typeof useAuth0> | null = null

try {
  auth0 = useAuth0()
} catch (e) {
  // Auth0 未配置
  console.warn('Auth0 not available')
}

const authStore = useAuthStore()

onMounted(async () => {
  if (!auth0) {
    router.push('/')
    return
  }

  // 等待 Auth0 完成认证
  const checkAuth = async () => {
    if (auth0 && auth0.isAuthenticated.value && auth0.user.value) {
      try {
        // 获取 Auth0 access token
        const accessToken = await auth0.getAccessTokenSilently()
        
        // 调用后端 API，验证 Auth0 token 并获取我们的 JWT
        const response = await fetch('/api/auth/auth0/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            auth0User: auth0.user.value
          })
        })
        
        const data = await response.json()
        
        if (data.success && data.data.token && data.data.user) {
          // 使用我们的 auth store 保存用户信息
          authStore.login(data.data.user, data.data.token)
          
          // 跳转到对应的 Dashboard
          const isAdmin = data.data.user?.role === 'admin'
          router.push(isAdmin ? '/admin' : '/dashboard')
        } else {
          console.error('Auth0 verification failed:', data.error)
          router.push('/')
        }
      } catch (error) {
        console.error('Auth0 callback error:', error)
        router.push('/')
      }
    } else {
      // 等待一下再检查（Auth0 SDK 可能需要时间初始化）
      setTimeout(checkAuth, 100)
    }
  }

  // 监听 Auth0 状态变化
  if (auth0) {
    watch(() => auth0?.isAuthenticated.value, (isAuth) => {
      if (isAuth) {
        checkAuth()
      }
    }, { immediate: true })
  } else {
    router.push('/')
  }
})
</script>

<template>
  <div class="min-h-screen w-full flex items-center justify-center">
    <div class="text-center">
      <p class="text-slate-400">正在处理登录...</p>
    </div>
  </div>
</template>

