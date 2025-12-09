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
  <div class="w-full">
    <label v-if="label" :for="id" class="block text-sm font-medium text-slate-400 mb-2">{{ label }}</label>
    <div class="relative">
      <span v-if="$slots.icon" class="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
        <slot name="icon" />
      </span>

      <input
          :id="id"
          :type="type || 'text'"
          :value="modelValue"
          @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
          :placeholder="placeholder"
          class="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
          :class="{ 'pl-10': $slots.icon }"
      />
    </div>
  </div>
</template>