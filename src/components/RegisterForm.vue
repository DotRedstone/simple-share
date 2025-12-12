<script setup lang="ts">
import { ref } from 'vue'
import BaseButton from './BaseButton.vue'
import BaseInput from './BaseInput.vue'

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const error = ref('')

const emit = defineEmits(['register', 'switch-to-login'])

const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const handleRegister = async () => {
  error.value = ''
  
  if (!username.value.trim()) {
    error.value = '请输入用户名'
    return
  }
  
  if (username.value.trim().length < 3) {
    error.value = '用户名长度至少为3位'
    return
  }
  
  if (!email.value.trim()) {
    error.value = '请输入邮箱'
    return
  }
  
  if (!validateEmail(email.value.trim())) {
    error.value = '请输入有效的邮箱地址'
    return
  }
  
  if (!password.value) {
    error.value = '请输入密码'
    return
  }
  
  if (password.value.length < 6) {
    error.value = '密码长度至少为6位'
    return
  }
  
  if (password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致'
    return
  }
  
  isLoading.value = true
  
  try {
    emit('register', {
      username: username.value.trim(),
      email: email.value.trim(),
      password: password.value
    })
  } catch (err) {
    error.value = '注册失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleRegister" class="space-y-4 sm:space-y-6 min-w-0">
    <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400 break-words min-w-0">
      {{ error }}
    </div>

    <div class="min-w-0">
      <BaseInput
        v-model="username"
        label="用户名"
        placeholder="请输入用户名（至少3位）"
        id="username"
        :disabled="isLoading"
      />
    </div>

    <div class="min-w-0">
      <BaseInput
        v-model="email"
        label="邮箱"
        type="email"
        placeholder="请输入邮箱地址"
        id="email"
        :disabled="isLoading"
      />
    </div>

    <div class="min-w-0">
      <BaseInput
        v-model="password"
        label="密码"
        type="password"
        placeholder="请输入密码（至少6位）"
        id="password"
        :disabled="isLoading"
      />
    </div>

    <div class="min-w-0">
      <BaseInput
        v-model="confirmPassword"
        label="确认密码"
        type="password"
        placeholder="请再次输入密码"
        id="confirmPassword"
        :disabled="isLoading"
      />
    </div>

    <div class="text-xs sm:text-sm text-slate-400 text-center min-w-0 break-words">
      已有账号？
      <a href="#" @click.prevent="$emit('switch-to-login')" class="text-blue-400 hover:underline whitespace-nowrap" :class="{ 'opacity-50 pointer-events-none': isLoading }">立即登录</a>
    </div>

    <div class="min-w-0 w-full">
      <BaseButton type="submit" variant="primary" class="w-full !py-2.5 sm:!py-3 min-w-0" :loading="isLoading" :disabled="isLoading">
        注册
      </BaseButton>
    </div>
  </form>
</template>

