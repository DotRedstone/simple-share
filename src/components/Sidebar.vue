<script setup lang="ts">
import { ref } from 'vue'
import type { MenuItem } from '../types'

interface Props {
  menuItems: MenuItem[]
  activeTab: string
  username?: string
  userRole?: string
  logo?: string
  logoColor?: 'blue' | 'red'
}

withDefaults(defineProps<Props>(), {
  username: '用户',
  userRole: '高级账户',
  logo: 'S',
  logoColor: 'blue'
})

const emit = defineEmits<{
  (e: 'tab-change', tab: string): void
  (e: 'logout'): void
}>()

const isCollapsed = ref(false)
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

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
    groups: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    download: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10'
  }
  return icons[iconName] || ''
}
</script>

<template>
  <aside 
    :class="[
      'shrink-0 bg-surface-900/80 backdrop-blur-xl border-b md:border-b-0 md:border-r border-white/5 flex flex-col md:h-screen max-w-full transition-all duration-300 z-30 dark:bg-surface-900/80 light:bg-slate-50/80 light:border-slate-200',
      isCollapsed ? 'md:w-20' : 'w-full md:w-72'
    ]"
  >
    <div 
      :class="[
        'h-16 md:h-24 flex items-center shrink-0 relative transition-all duration-300',
        isCollapsed ? 'justify-center px-0' : 'px-4 md:px-8'
      ]"
    >
      <div 
        :class="[
          'w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-xl shrink-0 glass-card transition-all duration-300 dark:shadow-black/20 light:shadow-slate-200/50',
          isCollapsed ? 'mr-0' : 'mr-4'
        ]"
      >
        <img src="/favicon-96x96.png" alt="SimpleShare" class="w-7 h-7 object-contain" />
      </div>
      <div v-if="!isCollapsed" class="flex flex-col min-w-0">
        <span class="font-black text-xl text-white dark:text-white light:text-slate-900 tracking-tighter leading-none italic uppercase">Simple</span>
        <span class="text-[10px] text-brand-primary font-mono tracking-[0.2em] uppercase">Control</span>
      </div>
      <button
        @click="toggleCollapse"
        class="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-brand-primary rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform z-20 hidden md:flex"
      >
        <svg v-if="!isCollapsed" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 19l-7-7 7-7" stroke-width="3" /></svg>
        <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 5l7 7-7 7" stroke-width="3" /></svg>
      </button>
    </div>

    <div class="p-2 md:p-4 space-x-2 md:space-x-0 md:space-y-2 flex md:flex-col overflow-x-auto md:overflow-x-visible md:overflow-y-auto md:flex-1 scrollbar-hide">
      <button
        v-for="item in menuItems"
        :key="item.id"
        @click="emit('tab-change', item.id)"
        :class="[
          'flex-shrink-0 md:w-full flex items-center rounded-2xl text-sm font-bold transition-all duration-300',
          isCollapsed ? 'justify-center w-12 h-12 px-0' : 'gap-4 px-5 py-4',
          activeTab === item.id 
            ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' 
            : 'text-slate-500 hover:text-white hover:bg-white/5 light:hover:bg-slate-200/50 light:hover:text-slate-900'
        ]"
        :title="isCollapsed ? item.label : ''"
      >
        <svg v-if="getIcon(item.icon)" class="w-5 h-5 md:w-6 md:h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getIcon(item.icon)" />
        </svg>
        <span v-if="!isCollapsed" class="truncate tracking-tight hidden md:block text-xs md:text-sm">{{ item.label }}</span>
        <span class="md:hidden text-xs">{{ item.label }}</span>
      </button>
    </div>

    <div 
      :class="[
        'shrink-0 transition-all duration-300 hidden md:block',
        isCollapsed ? 'p-2 md:p-3' : 'p-4 md:p-8'
      ]"
    >
      <div 
        :class="[
          'bg-white/5 rounded-3xl flex items-center border border-white/5 transition-all duration-300 overflow-hidden light:bg-slate-100/50 light:border-slate-200',
          isCollapsed ? 'flex-col justify-center gap-2 py-4 px-2' : 'p-4 gap-4'
        ]"
      >
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary p-[2px] shrink-0 shadow-lg">
          <div class="w-full h-full rounded-[14px] bg-surface-900 flex items-center justify-center text-white font-black text-sm uppercase light:bg-white light:text-slate-900">
            {{ username?.[0] || 'U' }}
          </div>
        </div>
        <div v-if="!isCollapsed" class="flex flex-col min-w-0 flex-1">
          <span class="text-sm font-bold text-white truncate light:text-slate-900">{{ username }}</span>
          <span class="text-[10px] text-slate-500 truncate font-mono uppercase">{{ userRole }}</span>
        </div>
        <button 
          @click="emit('logout')" 
          class="text-slate-500 hover:text-red-400 transition-all p-2 hover:bg-red-500/10 rounded-xl shrink-0"
          :class="isCollapsed ? 'mt-2' : ''"
          :title="isCollapsed ? '退出登录' : ''"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  </aside>
</template>

