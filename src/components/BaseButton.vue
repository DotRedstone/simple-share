<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'glass' | 'danger'
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  loading: false,
  disabled: false,
  type: 'button'
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()
</script>

<template>
  <button
      :type="type"
      :disabled="disabled || loading"
    class="relative flex items-center justify-center px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden"
    :class="{
      'bg-brand-primary text-white hover:bg-brand-primary/90 shadow-lg shadow-brand-primary/20': variant === 'primary',
      'bg-white/10 border border-white/10 text-white hover:bg-white/20 hover:border-white/20 backdrop-blur-sm': variant === 'glass',
      'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30': variant === 'danger'
    }"
      @click="(e) => emit('click', e)"
  >
    <span v-if="loading" class="absolute inset-0 flex items-center justify-center">
      <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </span>

    <span :class="{ 'opacity-0': loading }" class="flex items-center gap-2 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
      <slot />
    </span>
  </button>
</template>