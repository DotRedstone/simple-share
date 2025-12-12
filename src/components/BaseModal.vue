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
  <Transition name="fade">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 overflow-hidden">
      <div class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" @click="handleBackdropClick"></div>

      <div
          class="relative w-full glass-panel p-3 sm:p-6 md:p-8 rounded-2xl animate-pop-up flex flex-col max-h-[90vh] max-w-[calc(100vw-1.5rem)] md:max-w-md overflow-y-auto overflow-x-hidden min-w-0"
          :class="width || ''"
      >
        <div v-if="title" class="mb-4 sm:mb-6 min-w-0">
          <h2 class="text-lg sm:text-xl md:text-2xl font-bold text-white text-center break-words">{{ title }}</h2>
        </div>

        <div class="min-w-0 flex-1">
          <slot />
        </div>
      </div>
    </div>
  </Transition>
</template>