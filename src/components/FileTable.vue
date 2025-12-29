<script setup lang="ts">
import { useShareStore } from '../stores'

const shareStore = useShareStore()

interface File {
  id: string
  name: string
  uploader: string
  size: string
  uploaded: string
}

defineProps<{
  files: File[]
}>()

const getShareInfo = (fileId: string) => {
  // 尝试将 fileId 转换为 number 来查找分享
  const fileIdNum = parseInt(fileId.replace('file_', ''))
  const share = shareStore.getShareByFileId(fileIdNum)
  return share
}

const emit = defineEmits<{
  (e: 'view', file: File): void
  (e: 'delete', file: File): void
}>()
</script>

<template>
  <div class="glass-card rounded-[2rem] overflow-hidden border border-white/5">
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm text-slate-400">
        <thead class="bg-white/5 text-[10px] uppercase font-black tracking-[0.2em] text-slate-500 border-b border-white/5">
          <tr>
            <th class="px-8 py-5">文件名</th>
            <th class="px-8 py-5">上传者</th>
            <th class="px-8 py-5">大小</th>
            <th class="px-8 py-5">上传日期</th>
            <th class="px-8 py-5 hidden md:table-cell">分享状态</th>
            <th class="px-8 py-5 text-right">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5">
          <tr v-for="file in files" :key="file.id" class="group hover:bg-white/[0.02] transition-colors">
            <td class="px-8 py-5">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke-width="2" /></svg>
                </div>
                <span class="font-bold text-white tracking-tight">{{ file.name }}</span>
              </div>
            </td>
            <td class="px-8 py-5">
              <span class="px-2.5 py-1 rounded-md bg-surface-800 text-[11px] font-bold text-slate-400">{{ file.uploader }}</span>
            </td>
            <td class="px-8 py-5">
              <span class="font-mono text-xs opacity-60">{{ file.size }}</span>
            </td>
            <td class="px-8 py-5 text-xs opacity-60">{{ file.uploaded }}</td>
            <td class="px-8 py-5 hidden md:table-cell">
              <div v-if="getShareInfo(file.id)" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
                </span>
                Active
              </div>
              <span v-else class="text-[10px] font-bold uppercase tracking-widest text-slate-600">Private</span>
            </td>
            <td class="px-8 py-5 text-right">
              <div class="flex gap-2 justify-end">
                <button
                  @click="emit('view', file)"
                  class="p-2.5 rounded-xl text-slate-500 hover:bg-white/10 hover:text-white transition-all"
                  title="查看"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button
                  @click="emit('delete', file)"
                  class="p-2.5 rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all"
                  title="删除"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

