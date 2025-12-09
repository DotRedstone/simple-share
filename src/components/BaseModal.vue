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
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" @click="handleBackdropClick"></div>

      <div
          class="relative w-full glass-panel p-4 sm:p-6 md:p-8 rounded-2xl animate-pop-up flex flex-col max-h-[90vh] overflow-y-auto"
          :class="width || 'max-w-md'"
      >
        <div v-if="title" class="mb-4 sm:mb-6">
          <h2 class="text-xl sm:text-2xl font-bold text-white text-center">{{ title }}</h2>
        </div>

        <slot />
      </div>
    </div>
  </Transition>
</template>