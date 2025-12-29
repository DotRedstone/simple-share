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
    <label v-if="label" :for="id" class="block text-sm font-semibold text-slate-400 dark:text-slate-400 light:text-slate-600 mb-1.5 px-1">{{ label }}</label>
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
          class="w-full bg-surface-900/50 dark:bg-surface-900/50 light:bg-slate-100/80 border border-white/5 dark:border-white/5 light:border-slate-200 rounded-xl py-2.5 px-4 text-white dark:text-white light:text-slate-900 focus:border-brand-primary/50 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all placeholder:text-slate-600 dark:placeholder:text-slate-600 light:placeholder:text-slate-400 min-w-0 font-sans tracking-tight"
          :class="{ 'pl-11': $slots.icon }"
      />
    </div>
  </div>
</template>