<script setup lang="ts">
const props = withDefaults(defineProps<{
  show: boolean
  title?: string
  width?: string // 允许自定义宽度，例如 'max-w-sm'
  closeOnClickOutside?: boolean
}>(), {
  closeOnClickOutside: true
})

const emit = defineEmits(['close'])

const handleBackdropClick = () => {
  if (props.closeOnClickOutside) {
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition 
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="show" class="fixed inset-0 z-[999] flex items-center justify-center p-4">
        <!-- 遮罩层 -->
        <div class="absolute inset-0 bg-surface-950/60 backdrop-blur-md" @click="handleBackdropClick"></div>

        <!-- 模态框主体 -->
        <div
            class="relative w-full glass-card p-6 rounded-3xl flex flex-col max-h-[90vh] overflow-hidden shadow-2xl border border-white/10"
            :class="width || 'max-w-md'"
        >
          <div v-if="title" class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-white tracking-tight">{{ title }}</h2>
            <button @click="emit('close')" class="p-2 hover:bg-white/10 rounded-full transition-colors">
              <svg class="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="overflow-y-auto custom-scrollbar pr-1">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
