<script setup lang="ts">
import type { FileItem, FileAction } from '../types'

defineProps<{
  file: FileItem
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'action', action: FileAction, file: FileItem): void
}>()

const handleAction = (action: FileAction, file: FileItem) => {
  emit('action', action, file)
}
</script>

<template>
  <div v-if="show" class="absolute right-0 mt-2 w-auto min-w-[140px] bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-1">
    <button
      v-if="file.type !== 'folder'"
      @click.stop="handleAction('分享', file)"
      class="w-full flex items-center justify-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-700"
      title="分享"
    >
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
      </svg>
    </button>
    <button
      v-if="file.type !== 'folder'"
      @click.stop="handleAction('管理分享', file)"
      class="w-full flex items-center justify-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-700"
      title="管理分享"
    >
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>
    <button
      v-if="file.type !== 'folder'"
      @click.stop="handleAction('下载', file)"
      class="w-full flex items-center justify-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-700"
      title="下载"
    >
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    </button>
    <button
      @click.stop="handleAction('收藏', file)"
      class="w-full flex items-center justify-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-700"
      :title="file.starred ? '取消收藏' : '添加到收藏'"
    >
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" :class="file.starred ? 'fill-yellow-400 text-yellow-400' : ''">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    </button>
    <button
      @click.stop="handleAction('重命名', file)"
      class="w-full flex items-center justify-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-700"
      title="重命名"
    >
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 5.232z" />
      </svg>
    </button>
    <button
      @click.stop="handleAction('移动', file)"
      class="w-full flex items-center justify-center gap-2 px-3 py-2 text-slate-300 hover:bg-slate-700"
      title="移动"
    >
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    </button>
    <div class="my-1 h-[1px] bg-slate-700"></div>
    <button
      @click.stop="handleAction('删除', file)"
      class="w-full flex items-center justify-center gap-2 px-3 py-2 text-red-400 hover:bg-slate-700 hover:text-red-300"
      title="删除"
    >
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  </div>
</template>

