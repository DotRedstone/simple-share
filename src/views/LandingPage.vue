<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores'
import { useShareStore } from '../stores'
import PageFrame from '../components/PageFrame.vue'
import NavBar from '../components/NavBar.vue'
import HeroSection from '../components/HeroSection.vue'
import LoginForm from '../components/LoginForm.vue'
import RegisterForm from '../components/RegisterForm.vue'
import BaseModal from '../components/BaseModal.vue'
import BaseButton from '../components/BaseButton.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const router = useRouter()
const authStore = useAuthStore()
const shareStore = useShareStore()

const showLogin = ref(false)
const showRegister = ref(false)
const isExtracting = ref(false)
const extractionError = ref('')


const handleExtraction = async (code: string) => {
  isExtracting.value = true
  extractionError.value = ''
  
  try {
    // 使用 shareStore 验证提取码
    const share = await shareStore.getShareByCode(code.toUpperCase())
    if (share) {
      router.push(`/extract/${code.toUpperCase()}`)
    } else {
      // 如果本地没有，尝试从 API 获取
      const response = await fetch(`/api/extract/${code.toUpperCase()}`)
      if (response.ok) {
        router.push(`/extract/${code.toUpperCase()}`)
      } else {
        extractionError.value = '未找到该提取码对应的文件，请检查提取码是否正确'
      }
    }
  } catch (err) {
    extractionError.value = '验证提取码失败，请稍后重试'
  } finally {
    isExtracting.value = false
  }
}

const loginError = ref('')
const registerError = ref('')

const onLoginSuccess = async (data: any) => {
  loginError.value = ''
  const result = await authStore.loginWithAPI(data.username, data.password, data.remember)
  
  if (result.success) {
    showLogin.value = false
    const isAdmin = result.user?.role === 'admin'
    router.push(isAdmin ? '/admin' : '/dashboard')
  } else {
    loginError.value = result.error || '登录失败'
  }
}

const onRegisterSuccess = async (data: any) => {
  registerError.value = ''
  const result = await authStore.registerWithAPI(data.username, data.email, data.password)
  
  if (result.success) {
    showRegister.value = false
    const isAdmin = result.user?.role === 'admin'
    router.push(isAdmin ? '/admin' : '/dashboard')
  } else {
    registerError.value = result.error || '注册失败'
  }
}

const switchToRegister = () => {
  showLogin.value = false
  showRegister.value = true
}

const switchToLogin = () => {
  showRegister.value = false
  showLogin.value = true
}

const handleOAuth = async (provider: 'wechat' | 'github' | 'google') => {
  try {
    const response = await fetch(`/api/auth/oauth?provider=${provider}&redirect_uri=${encodeURIComponent(window.location.origin + '/api/auth/oauth/callback')}`)
    const data = await response.json()
    if (data.success && data.authUrl) {
      window.location.href = data.authUrl
    } else {
      loginError.value = data.error || 'OAuth 登录失败'
    }
  } catch (err) {
    loginError.value = 'OAuth 登录失败，请稍后重试'
  }
}

const handleAuth0 = async () => {
  try {
    const response = await fetch(`/api/auth/auth0?redirect_uri=${encodeURIComponent(window.location.origin + '/api/auth/auth0/callback')}`)
    const data = await response.json()
    if (data.success && data.authUrl) {
      window.location.href = data.authUrl
    } else {
      loginError.value = data.error || 'Auth0 登录失败'
    }
  } catch (err) {
    loginError.value = 'Auth0 登录失败，请稍后重试'
  }
}

// 处理直接 OAuth 回调（非 Auth0）
onMounted(async () => {
  authStore.initAuth()
  
  // 检查是否是直接 OAuth 回调（非 Auth0）
  const url = new URL(window.location.href)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const provider = url.searchParams.get('provider') || localStorage.getItem('oauth_provider')
  
  // Auth0 回调由 Auth0Callback.vue 处理，这里只处理直接 OAuth
  if (code && provider && !url.pathname.includes('/callback')) {
    try {
      const response = await fetch('/api/auth/oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, code, state })
      })
      const data = await response.json()
      
      if (data.success) {
        if (data.data.token && data.data.user) {
          authStore.login(data.data.user, data.data.token)
          const isAdmin = data.data.user?.role === 'admin'
          router.push(isAdmin ? '/admin' : '/dashboard')
        }
      } else {
        loginError.value = data.error || 'OAuth 登录失败'
        showLogin.value = true
      }
    } catch (err) {
      loginError.value = 'OAuth 登录失败，请稍后重试'
      showLogin.value = true
    }
  }
})
</script>

<template>
  <div class="min-h-screen w-full flex items-center justify-center p-4 sm:p-6">
    <div class="w-full max-w-lg">
      <PageFrame>
        <div class="flex flex-col gap-4">
          <NavBar
            :on-login-click="() => showLogin = true"
            :on-register-click="() => showRegister = true"
          />

          <HeroSection :on-extraction="handleExtraction" />
        </div>
      </PageFrame>
    </div>

    <!-- 提取加载状态 -->
    <BaseModal v-if="isExtracting" :show="isExtracting" title="正在查找文件..." width="max-w-sm" :close-on-click-outside="false">
      <LoadingSpinner size="lg" text="正在验证提取码..." />
    </BaseModal>

    <!-- 提取错误提示 -->
    <BaseModal v-if="extractionError" :show="!!extractionError" title="提取失败" width="max-w-sm" @close="extractionError = ''">
      <div class="text-center py-4">
        <p class="text-red-400 mb-4">{{ extractionError }}</p>
        <BaseButton variant="primary" @click="extractionError = ''">确定</BaseButton>
      </div>
    </BaseModal>

    <BaseModal :show="showLogin" title="欢迎回来" width="max-w-sm" @close="showLogin = false">
      <div v-if="loginError" class="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
        {{ loginError }}
      </div>
      <LoginForm 
        @login="onLoginSuccess" 
        @forgot="showLogin = false" 
        @switch-to-register="switchToRegister"
        @oauth="handleOAuth"
        @auth0="handleAuth0"
      />
    </BaseModal>

    <BaseModal :show="showRegister" title="创建账号" width="max-w-sm" @close="showRegister = false">
      <div v-if="registerError" class="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
        {{ registerError }}
      </div>
      <RegisterForm @register="onRegisterSuccess" @switch-to-login="switchToLogin" />
    </BaseModal>
  </div>
</template>