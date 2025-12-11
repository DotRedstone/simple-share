<script setup lang="ts">
import { ref, onMounted } from 'vue'
import BaseButton from './BaseButton.vue'
import BaseCheckbox from './BaseCheckbox.vue'
import BaseInput from './BaseInput.vue'

const username = ref('')
const password = ref('')
const remember = ref(false)
const isLoading = ref(false)
const error = ref('')
const availableProviders = ref<string[]>([])

const emit = defineEmits<{
  (e: 'login', data: { username: string; password: string; remember?: boolean }): void
  (e: 'forgot'): void
  (e: 'switch-to-register'): void
  (e: 'oauth', provider: 'wechat' | 'github' | 'google'): void
}>()

const handleLogin = async () => {
  error.value = ''
  
  if (!username.value.trim()) {
    error.value = '请输入用户名'
    return
  }
  
  if (!password.value) {
    error.value = '请输入密码'
    return
  }
  
  if (password.value.length < 3) {
    error.value = '密码长度至少为3位'
    return
  }
  
  isLoading.value = true
  
  try {
    emit('login', { 
      username: username.value.trim(), 
      password: password.value,
      remember: remember.value
    })
  } catch (err) {
    error.value = '登录失败，请检查用户名和密码'
  } finally {
    isLoading.value = false
  }
}

const handleOAuthClick = (provider: 'wechat' | 'github' | 'google') => {
  localStorage.setItem('oauth_provider', provider)
  emit('oauth', provider)
}

// 获取可用的 OAuth 提供商
onMounted(async () => {
  try {
    const response = await fetch('/api/auth/oauth/providers')
    const data = await response.json()
    if (data.success && data.providers) {
      availableProviders.value = data.providers
    }
  } catch (err) {
    console.error('获取 OAuth 提供商失败:', err)
  }
})
</script>

<template>
  <form @submit.prevent="handleLogin" class="space-y-4 sm:space-y-6">
    <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
      {{ error }}
    </div>

    <BaseInput
        v-model="username"
        label="用户名"
        placeholder="请输入用户名"
        id="username"
        :disabled="isLoading"
    />

    <BaseInput
        v-model="password"
        label="密码"
        type="password"
        placeholder="请输入密码"
        id="password"
        :disabled="isLoading"
    />

    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
      <BaseCheckbox v-model="remember" label="记住我" :disabled="isLoading" />
      <a href="#" @click.prevent="$emit('forgot')" class="text-sm text-blue-400 hover:underline" :class="{ 'opacity-50 pointer-events-none': isLoading }">忘记密码?</a>
    </div>

    <BaseButton type="submit" variant="primary" class="w-full !py-2.5 sm:!py-3" :loading="isLoading" :disabled="isLoading">
      登录
    </BaseButton>

    <div v-if="availableProviders.length > 0" class="relative my-4">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-slate-700"></div>
      </div>
      <div class="relative flex justify-center text-xs">
        <span class="px-2 bg-slate-900 text-slate-400">或使用第三方登录</span>
      </div>
    </div>

    <div v-if="availableProviders.length > 0" class="grid gap-2" :class="availableProviders.length === 1 ? 'grid-cols-1' : availableProviders.length === 2 ? 'grid-cols-2' : 'grid-cols-3'">
      <BaseButton
        v-if="availableProviders.includes('wechat')"
        type="button"
        variant="glass"
        class="!py-2 flex flex-col items-center gap-1"
        :disabled="isLoading"
        @click="handleOAuthClick('wechat')"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-1.898-2.186-3.542-4.495-4.414A9.654 9.654 0 0 0 8.691 2.188zm-.744 5.524c-.587 0-1.062.42-1.062.938 0 .517.475.937 1.062.937.588 0 1.063-.42 1.063-.937 0-.518-.475-.938-1.063-.938zm4.001 0c-.587 0-1.062.42-1.062.938 0 .517.475.937 1.062.937.588 0 1.063-.42 1.063-.937 0-.518-.475-.938-1.063-.938z"/>
        </svg>
        <span class="text-xs">微信</span>
      </BaseButton>
      <BaseButton
        v-if="availableProviders.includes('github')"
        type="button"
        variant="glass"
        class="!py-2 flex flex-col items-center gap-1"
        :disabled="isLoading"
        @click="handleOAuthClick('github')"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        <span class="text-xs">GitHub</span>
      </BaseButton>
      <BaseButton
        v-if="availableProviders.includes('google')"
        type="button"
        variant="glass"
        class="!py-2 flex flex-col items-center gap-1"
        :disabled="isLoading"
        @click="handleOAuthClick('google')"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span class="text-xs">Google</span>
      </BaseButton>
    </div>

    <div class="text-xs sm:text-sm text-slate-400 text-center pt-2">
      还没有账号？
      <a href="#" @click.prevent="$emit('switch-to-register')" class="text-blue-400 hover:underline" :class="{ 'opacity-50 pointer-events-none': isLoading }">立即注册</a>
    </div>
  </form>
</template>