<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isDark = ref(true)

const toggleTheme = () => {
  isDark.value = !isDark.value
  updateTheme()
}

const updateTheme = () => {
  if (isDark.value) {
    document.documentElement.classList.remove('light')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.add('light')
    localStorage.setItem('theme', 'light')
  }
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'light') {
    isDark.value = false
    updateTheme()
  } else if (window.matchMedia('(prefers-color-scheme: light)').matches && !savedTheme) {
    isDark.value = false
    updateTheme()
  }
})
</script>

<template>
  <footer class="fixed bottom-0 left-0 right-0 z-40 px-4 py-3 pointer-events-none md:px-8 mb-safe">
    <div class="flex items-center justify-between max-w-screen-2xl mx-auto pointer-events-auto relative">
      <!-- 左侧：占位 (仅中大屏显示，为了平衡布局) -->
      <div class="hidden md:flex flex-1"></div>

      <!-- 中间：文档与仓库 (仅中大屏显示) -->
      <div class="hidden md:flex items-center justify-center gap-4 flex-1">
        <a 
          href="/docs/REPORT_CONTENT.md" 
          target="_blank"
          class="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full bg-slate-800/40 hover:bg-slate-700/60 border border-white/5 backdrop-blur-md transition-all text-slate-400 hover:text-white light:bg-slate-200/50 light:hover:bg-slate-300/50 light:text-slate-600 light:hover:text-slate-900 light:border-slate-300/50"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          项目文档
        </a>
        <a 
          href="https://github.com/dotredstone/simple-share" 
          target="_blank"
          class="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full bg-slate-800/40 hover:bg-slate-700/60 border border-white/5 backdrop-blur-md transition-all text-slate-400 hover:text-white light:bg-slate-200/50 light:hover:bg-slate-300/50 light:text-slate-600 light:hover:text-slate-900 light:border-slate-300/50"
        >
          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
          </svg>
          GitHub
        </a>
      </div>

      <!-- 右侧：主题切换与版权 -->
      <div class="flex items-center justify-end gap-3 flex-1 ml-auto">
        <p class="hidden lg:block text-[10px] text-slate-500 font-mono tracking-wider uppercase opacity-60 light:text-slate-600">
          Built with Cloudflare Stack
        </p>
        
        <button 
          @click="toggleTheme"
          class="group flex items-center justify-center w-9 h-9 rounded-full bg-slate-800/40 hover:bg-slate-700/60 border border-white/5 backdrop-blur-md transition-all relative overflow-hidden light:bg-slate-200/50 light:hover:bg-slate-300/50 light:border-slate-300/50"
          :title="isDark ? '切换到日间模式' : '切换到夜间模式'"
        >
          <transition name="sun-moon">
            <svg v-if="!isDark" class="w-4.5 h-4.5 text-amber-500 absolute" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.364l-.707.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <svg v-else class="w-4.5 h-4.5 text-indigo-300 absolute" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </transition>
        </button>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.sun-moon-enter-active,
.sun-moon-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.sun-moon-enter-from {
  opacity: 0;
  transform: rotate(90deg) scale(0.5);
}

.sun-moon-leave-to {
  opacity: 0;
  transform: rotate(-90deg) scale(0.5);
}

:root.light footer {
  --slate-400: #64748b;
  --slate-500: #94a3b8;
}

.mb-safe {
  margin-bottom: env(safe-area-inset-bottom);
}
</style>

