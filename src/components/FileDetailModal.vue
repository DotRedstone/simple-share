<script setup lang="ts">
import type { FileItem } from '../types'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'

interface Props {
  show: boolean
  file: FileItem | null
}

defineProps<Props>()

const emit = defineEmits(['close', 'download', 'share', 'delete'])

const getFileTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    folder: '文件夹',
    pdf: 'PDF文档',
    image: '图片',
    video: '视频',
    zip: '压缩包',
    code: '代码文件'
  }
  return labels[type] || '未知类型'
}
</script>

<template>
  <BaseModal v-if="file" :show="show" title="文件详情" width="max-w-lg" @close="$emit('close')">
    <div class="space-y-6">
      <!-- 文件图标和名称 -->
      <div class="text-center">
        <div class="w-20 h-20 mx-auto mb-4 flex items-center justify-center bg-blue-500/20 rounded-2xl">
          <svg v-if="file.type === 'folder'" class="w-12 h-12 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.165 19.551c.086.58.586 1.01 1.173 1.01h17.324c.587 0 1.087-.43 1.173-1.01l1.161-7.854c.099-.672-.42-1.282-1.096-1.282H2.099c-.676 0-1.195.61-1.096 1.282l1.162 7.854z" opacity=".4"></path>
            <path d="M3.338 10.415h17.324c.969 0 1.713.874 1.571 1.833L21.071 20.1c-.086.58-.586 1.01-1.173 1.01H4.101c-.587 0-1.087-.43-1.173-1.01L1.767 12.248c-.142-.959.602-1.833 1.571-1.833z"></path>
          </svg>
          <svg v-else class="w-12 h-12 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h5v5h5v11H6z"/>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-white mb-2">{{ file.name }}</h3>
        <p class="text-sm text-slate-400">{{ getFileTypeLabel(file.type) }}</p>
      </div>

      <!-- 文件信息 -->
      <div class="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
        <div class="flex justify-between items-center">
          <span class="text-slate-400">文件大小</span>
          <span class="text-white font-mono">{{ file.size }}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-slate-400">上传日期</span>
          <span class="text-white">{{ file.date }}</span>
        </div>
        <div v-if="file.uploadTime" class="flex justify-between items-center">
          <span class="text-slate-400">上传时间</span>
          <span class="text-white">{{ file.uploadTime }}</span>
        </div>
        <div v-if="file.mimeType" class="flex justify-between items-center">
          <span class="text-slate-400">MIME类型</span>
          <span class="text-white text-sm">{{ file.mimeType }}</span>
        </div>
        <div v-if="file.downloadCount !== undefined" class="flex justify-between items-center">
          <span class="text-slate-400">下载次数</span>
          <span class="text-white">{{ file.downloadCount }}</span>
        </div>
        <div v-if="file.storageKey" class="flex justify-between items-center">
          <span class="text-slate-400">存储Key</span>
          <span class="text-white text-xs font-mono truncate max-w-xs">{{ file.storageKey }}</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div v-if="file.type !== 'folder'" class="flex gap-3">
        <BaseButton variant="glass" class="flex-1" @click="$emit('download', file)">下载</BaseButton>
        <BaseButton variant="glass" class="flex-1" @click="$emit('share', file)">分享</BaseButton>
        <BaseButton variant="danger" class="flex-1" @click="$emit('delete', file)">删除</BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

