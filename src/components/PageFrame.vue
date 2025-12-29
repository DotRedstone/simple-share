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
    class="w-full max-w-full box-border transition-all duration-500 ease-in-out"
    :class="fullScreen ? 'min-h-screen flex flex-col' : ''"
  >
    <div
        class="relative w-full glass-card flex flex-col transition-all duration-300 overflow-hidden"
        :class="[
          fullScreen ? 'flex-1 rounded-none border-x-0 border-t-0 border-b-0' : 'rounded-[2.5rem]',
        ]"
    >
      <div 
        class="relative z-10 flex flex-col" 
        :class="[
          { 'p-6 sm:p-10': !noPadding },
          fullScreen ? 'flex-1 min-h-0' : ''
        ]"
      >
        <slot />
      </div>
    </div>
  </div>
</template>