<script setup lang="ts">
interface Props {
  // 是否移除内部 padding (例如当你需要全宽 Header 时)
  noPadding?: boolean
  // 是否允许内容溢出 (false 时会隐藏溢出，适合定高应用)
  allowOverflow?: boolean
  // 是否全屏模式（用于 Dashboard）
  fullScreen?: boolean
}

withDefaults(defineProps<Props>(), {
  noPadding: false,
  allowOverflow: true,
  fullScreen: false
})
</script>

<template>
  <div 
    class="w-full box-border transition-all duration-500 ease-in-out"
    :class="fullScreen ? 'min-h-screen flex flex-col' : ''"
  >
    <div
        class="relative w-full bg-slate-900/60 backdrop-blur-2xl border border-white/10 shadow-2xl flex flex-col transition-all duration-300"
        :class="[
          fullScreen ? 'flex-1 rounded-none border-x-0 border-t-0' : 'rounded-xl',
          allowOverflow ? '' : 'overflow-hidden'
        ]"
    >
      <div class="absolute top-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-[60px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

      <div class="absolute bottom-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

      <div 
        class="relative z-10 flex flex-col" 
        :class="[
          { 'p-4 sm:p-6': !noPadding },
          fullScreen ? 'flex-1 min-h-0' : ''
        ]"
      >
        <slot />
      </div>
    </div>
  </div>
</template>