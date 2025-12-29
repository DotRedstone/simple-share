<script setup lang="ts">
defineProps<{
  modelValue: string | number
  label?: string
  type?: string
  placeholder?: string
  id?: string
}>()

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="w-full min-w-0">
    <label v-if="label" :for="id" class="block text-sm font-semibold text-slate-400 mb-1.5 px-1">{{ label }}</label>
    <div class="relative min-w-0 group">
      <span v-if="$slots.icon" class="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none text-slate-500 group-focus-within:text-brand-primary transition-colors">
        <slot name="icon" />
      </span>

      <input
          :id="id"
          :type="type || 'text'"
          :value="modelValue"
          @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
          :placeholder="placeholder"
          class="w-full bg-surface-900/50 border border-white/5 rounded-xl py-2.5 px-4 text-white focus:border-brand-primary/50 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all placeholder:text-slate-600 min-w-0"
          :class="{ 'pl-11': $slots.icon }"
      />
    </div>
  </div>
</template>