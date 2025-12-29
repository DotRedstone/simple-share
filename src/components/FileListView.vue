<script setup lang="ts">
import type { FileItem } from '../types'
import FileItemComponent from './FileItem.vue'
import EmptyState from './EmptyState.vue'
import BaseCheckbox from './BaseCheckbox.vue'

interface Props {
  files: FileItem[]
  viewMode: 'list' | 'grid'
  activeOptionsMenu: number | null
  selectedFiles?: number[]
}

const { files, viewMode, activeOptionsMenu, selectedFiles = [] } = defineProps<Props>()

const emit = defineEmits<{
  (e: 'file-click', file: FileItem): void
  (e: 'file-action', action: string, file: FileItem): void
  (e: 'file-select', fileId: number, selected: boolean): void
  (e: 'select-all', selected: boolean): void
  (e: 'upload'): void
}>()

const handleSelectAll = (selected: boolean) => {
  emit('select-all', selected)
}
</script>

<template>
  <div v-if="files.length > 0">
    <div v-if="viewMode === 'list'" class="overflow-x-auto -mx-4 md:mx-0">
      <table class="w-full text-left text-sm text-slate-400 min-w-[600px]">
        <thead class="bg-black/20 text-xs uppercase font-bold tracking-wider">
          <tr>
            <th class="px-3 md:px-6 py-4 w-12">
              <BaseCheckbox
                :model-value="selectedFiles.length === files.length && files.length > 0"
                @update:model-value="handleSelectAll"
              />
            </th>
            <th class="px-3 md:px-6 py-4">名称</th>
            <th class="px-3 md:px-6 py-4 w-32 hidden sm:table-cell">大小</th>
            <th class="px-3 md:px-6 py-4 w-40 hidden sm:table-cell">修改日期</th>
            <th class="px-3 md:px-6 py-4 w-20 text-right"></th>
          </tr>
        </thead>
      <tbody class="divide-y divide-white/5">
        <FileItemComponent
          v-for="file in files"
          :key="file.id"
          :file="file"
          :view-mode="viewMode"
          :show-options="activeOptionsMenu === file.id"
          :selected="selectedFiles.includes(file.id)"
          @click="emit('file-click', $event)"
          @action="(action, f) => emit('file-action', action, f)"
          @select="(selected) => emit('file-select', file.id, selected)"
        />
      </tbody>
      </table>
    </div>
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
      <FileItemComponent
        v-for="file in files"
        :key="file.id"
        :file="file"
        :view-mode="viewMode"
        :show-options="activeOptionsMenu === file.id"
        :selected="selectedFiles.includes(file.id)"
        @click="emit('file-click', $event)"
        @action="(action, f) => emit('file-action', action, f)"
        @select="(selected) => emit('file-select', file.id, selected)"
      />
    </div>
  </div>
  <EmptyState
    v-else
    icon="folder"
    title="此文件夹为空"
    description="当前目录下还没有任何文件或文件夹"
  />
</template>

