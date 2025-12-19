<script setup lang="ts">
import { computed } from 'vue'
import type { MenuItem } from '../types'

interface Props {
  menuItems: MenuItem[]
  activeTab: string
  username?: string
  userRole?: string
  logo?: string
  logoColor?: 'blue' | 'red'
}

const props = withDefaults(defineProps<Props>(), {
  username: '用户',
  userRole: '高级账户',
  logo: 'S',
  logoColor: 'blue'
})

const emit = defineEmits<{
  (e: 'tab-change', tab: string): void
  (e: 'logout'): void
}>()

const logoClasses = computed(() => {
  return props.logoColor === 'red'
    ? 'bg-gradient-to-br from-red-500 to-orange-500 shadow-lg shadow-red-500/20'
    : 'bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-blue-500/20'
})

const getIcon = (iconName: string) => {
  const icons: Record<string, string> = {
    folder: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
    clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    share: 'M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z',
    trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    files: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    logs: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    storage: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4',
    groups: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
  }
  return icons[iconName] || ''
}

const activeColor = computed(() => {
  return props.logoColor === 'red' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
})
</script>

<template>
  <aside class="w-full md:w-64 shrink-0 bg-slate-900/40 border-b md:border-b-0 md:border-r border-white/5 flex flex-col md:h-full max-w-full overflow-hidden">
    <div class="h-16 md:h-20 flex items-center px-6 border-b border-white/5 shrink-0">
      <div :class="logoClasses" class="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold mr-3">
        {{ logo }}
      </div>
      <span class="font-bold text-lg text-white tracking-wide">
        <slot name="title">SimpleShare</slot>
      </span>
    </div>

    <div class="p-2 md:p-4 space-x-1 md:space-x-0 md:space-y-1 flex md:flex-col overflow-x-auto md:overflow-x-visible md:overflow-y-auto md:flex-1 scrollbar-hide -mx-2 md:mx-0">
      <button
        v-for="item in menuItems"
        :key="item.id"
        @click="emit('tab-change', item.id)"
        class="flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
        :class="activeTab === item.id ? activeColor : 'text-slate-400 hover:bg-white/5 hover:text-white'"
      >
        <svg v-if="getIcon(item.icon)" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getIcon(item.icon)" />
        </svg>
        <span>{{ item.label }}</span>
      </button>
    </div>

    <div class="hidden md:block p-6 shrink-0 space-y-4 mt-auto">
      <div class="pt-4 border-t border-white/5 flex items-center justify-between">
        <div class="flex items-center gap-3 overflow-hidden">
          <div class="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-orange-400 shrink-0"></div>
          <div class="flex flex-col min-w-0">
            <span class="text-xs font-bold text-white truncate">{{ username }}</span>
            <span class="text-[10px] text-slate-500 truncate">{{ userRole }}</span>
          </div>
        </div>
        <button @click="emit('logout')" class="text-slate-500 hover:text-red-400 transition-colors shrink-0 p-1">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  </aside>
</template>

