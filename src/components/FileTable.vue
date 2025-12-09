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
  <div class="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
    <table class="w-full text-left text-sm text-slate-400">
      <thead class="bg-black/20 text-xs uppercase font-bold tracking-wider">
        <tr>
          <th class="px-6 py-4">文件名</th>
          <th class="px-6 py-4">上传者</th>
          <th class="px-6 py-4">大小</th>
          <th class="px-6 py-4">上传日期</th>
          <th class="px-6 py-4 hidden md:table-cell">分享状态</th>
          <th class="px-6 py-4 text-right">操作</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-white/5">
        <tr v-for="file in files" :key="file.id" class="hover:bg-white/5 transition-colors">
          <td class="px-6 py-4 font-medium text-white">{{ file.name }}</td>
          <td class="px-6 py-4">{{ file.uploader }}</td>
          <td class="px-6 py-4 font-mono">{{ file.size }}</td>
          <td class="px-6 py-4">{{ file.uploaded }}</td>
          <td class="px-6 py-4 hidden md:table-cell">
            <span v-if="getShareInfo(file.id)" class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              已分享
            </span>
            <span v-else class="text-slate-500 text-xs">未分享</span>
          </td>
          <td class="px-6 py-4 text-right">
            <div class="flex gap-2 justify-end">
              <button
                @click="emit('view', file)"
                class="p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                title="查看"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
              <button
                @click="emit('delete', file)"
                class="p-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
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
</template>

