<script setup lang="ts">
import type { FileItem } from '../types'
import FileItemComponent from './FileItem.vue'
import EmptyState from './EmptyState.vue'

interface Props {
  files: FileItem[]
  viewMode: 'list' | 'grid'
  activeOptionsMenu: number | null
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'file-click', file: FileItem): void
  (e: 'file-action', action: string, file: FileItem): void
  (e: 'upload'): void
}>()
</script>

<template>
  <div v-if="files.length > 0">
    <table v-if="viewMode === 'list'" class="w-full text-left text-sm text-slate-400">
      <thead class="bg-black/20 text-xs uppercase font-bold tracking-wider">
        <tr>
          <th class="px-6 py-4">名称</th>
          <th class="px-6 py-4 w-32 hidden sm:table-cell">大小</th>
          <th class="px-6 py-4 w-40 hidden sm:table-cell">修改日期</th>
          <th class="px-6 py-4 w-20 text-right"></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-white/5">
        <FileItemComponent
          v-for="file in files"
          :key="file.id"
          :file="file"
          :view-mode="viewMode"
          :show-options="activeOptionsMenu === file.id"
          @click="emit('file-click', $event)"
          @action="(action, f) => emit('file-action', action, f)"
        />
      </tbody>
    </table>
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      <FileItemComponent
        v-for="file in files"
        :key="file.id"
        :file="file"
        :view-mode="viewMode"
        :show-options="activeOptionsMenu === file.id"
        @click="emit('file-click', $event)"
        @action="(action, f) => emit('file-action', action, f)"
      />
    </div>
  </div>
  <EmptyState
    v-else
    icon="folder"
    title="此文件夹为空"
    description="当前目录下还没有任何文件或文件夹"
    action-label="上传文件"
    @action="$emit('upload')"
  />
</template>

