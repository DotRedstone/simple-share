<script setup lang="ts">
import { ref } from 'vue'
import BaseButton from './BaseButton.vue'
import BaseCheckbox from './BaseCheckbox.vue'
import BaseInput from './BaseInput.vue'

const username = ref('')
const password = ref('')
const remember = ref(false)
const isLoading = ref(false)
const error = ref('')

const emit = defineEmits<{
  (e: 'login', data: { username: string; password: string; remember?: boolean }): void
  (e: 'forgot'): void
  (e: 'switch-to-register'): void
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
</script>

<template>
  <form @submit.prevent="handleLogin" class="space-y-4 sm:space-y-6 min-w-0">
    <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400 break-words min-w-0">
      {{ error }}
    </div>

    <div class="min-w-0">
      <BaseInput
          v-model="username"
          label="用户名"
          placeholder="请输入用户名"
          id="username"
          :disabled="isLoading"
      />
    </div>

    <div class="min-w-0">
      <BaseInput
          v-model="password"
          label="密码"
          type="password"
          placeholder="请输入密码"
          id="password"
          :disabled="isLoading"
      />
    </div>

    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 min-w-0">
      <div class="min-w-0 flex-shrink-0">
        <BaseCheckbox v-model="remember" label="记住我" :disabled="isLoading" />
      </div>
      <a href="#" @click.prevent="$emit('forgot')" class="text-xs sm:text-sm text-brand-primary hover:text-brand-secondary transition-colors font-medium whitespace-nowrap flex-shrink-0" :class="{ 'opacity-50 pointer-events-none': isLoading }">忘记密码?</a>
    </div>

    <div class="min-w-0 w-full pt-2">
      <BaseButton type="submit" variant="primary" class="w-full shadow-xl shadow-brand-primary/20" :loading="isLoading" :disabled="isLoading">
        登录
      </BaseButton>
    </div>

    <div class="text-xs sm:text-sm text-slate-500 text-center pt-4 min-w-0 break-words font-medium">
      还没有账号？
      <a href="#" @click.prevent="$emit('switch-to-register')" class="text-brand-primary hover:text-brand-secondary transition-colors" :class="{ 'opacity-50 pointer-events-none': isLoading }">立即注册</a>
    </div>
  </form>
</template>
