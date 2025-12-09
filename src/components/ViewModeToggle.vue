<script setup lang="ts">
defineProps<{
  modelValue: 'list' | 'grid'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: 'list' | 'grid'): void
}>()
</script>

<template>
  <div class="hidden md:flex bg-slate-800/50 rounded-lg p-1 border border-white/5">
    <button
      @click="emit('update:modelValue', 'grid')"
      class="p-1.5 rounded"
      :class="modelValue === 'grid' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'"
    >
      <svg class="w-4 h-4" viewBox="0 0 24 24">
        <path fill="currentColor" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
      </svg>
    </button>
    <button
      @click="emit('update:modelValue', 'list')"
      class="p-1.5 rounded"
      :class="modelValue === 'list' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'"
    >
      <svg class="w-4 h-4" viewBox="0 0 24 24">
        <path fill="currentColor" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  </div>
</template>

