<script setup lang="ts">
import { computed } from 'vue'
import type { FileItem as FileItemType } from '../types'
import FileOptionsMenu from './FileOptionsMenu.vue'

interface Props {
  file: FileItemType
  viewMode: 'list' | 'grid'
  showOptions?: boolean
  selected?: boolean
  enableSelect?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showOptions: false,
  selected: false,
  enableSelect: true
})

const emit = defineEmits<{
  (e: 'click', file: FileItemType): void
  (e: 'action', action: string, file: FileItemType): void
  (e: 'select', selected: boolean): void
}>()

const getFileIconColor = (type: string) => {
  const colors: Record<string, string> = {
    folder: 'text-yellow-400',
    pdf: 'text-red-400',
    image: 'text-purple-400',
    video: 'text-blue-400',
    zip: 'text-orange-400',
    code: 'text-green-400'
  }
  return colors[type] || 'text-slate-400'
}

const iconColor = computed(() => {
  if (isViolated.value) return 'text-red-500'
  return getFileIconColor(props.file.type)
})

const isViolated = computed(() => {
  const file = props.file as any;
  return file.size_bytes === 0 && 
    file.type !== 'folder' && 
    (file.name.includes('[违规已下架]') || file.status === '违规');
})
</script>

<template>
  <!-- 列表视图 -->
  <tr
    v-if="viewMode === 'list'"
    @click.stop="emit('click', file)"
    class="hover:bg-white/5 transition-colors group relative"
    :class="[
      file.type === 'folder' ? 'cursor-pointer' : '',
      selected ? 'bg-brand-primary/10' : ''
    ]"
  >
    <td class="px-3 md:px-6 py-4 font-medium text-white min-w-0" :class="{ 'pl-6 md:pl-12': !enableSelect, 'opacity-60': isViolated }">
      <div class="flex items-center gap-2 md:gap-3 min-w-0">
        <svg v-if="isViolated" class="w-5 h-5 md:w-6 md:h-6 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <svg v-else class="w-5 h-5 md:w-6 md:h-6 shrink-0" :class="iconColor" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
        </svg>
        <div class="flex flex-col min-w-0">
          <span class="truncate" :class="{'text-red-400 font-bold': isViolated}">{{ file.name }}</span>
          <span v-if="isViolated" class="text-[10px] text-red-500 font-medium">管理员已执行下架</span>
        </div>
      </div>
    </td>
    <td class="px-3 md:px-6 py-4 font-mono text-xs md:text-sm hidden sm:table-cell whitespace-nowrap">{{ file.size }}</td>
    <td class="px-3 md:px-6 py-4 text-xs md:text-sm hidden sm:table-cell whitespace-nowrap">{{ file.date }}</td>
    <td class="px-3 md:px-6 py-4 text-right">
      <div class="relative options-menu-container inline-block">
        <button
          @click.stop="$emit('action', 'options', file)"
          class="p-1.5 md:p-2 rounded-full text-slate-400 hover:bg-black/20 hover:text-white active:bg-black/30 transition-colors touch-manipulation"
          aria-label="文件选项"
        >
          <svg class="w-5 h-5 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
        <FileOptionsMenu v-if="showOptions" :file="file" :show="showOptions" @action="(action, f) => $emit('action', action, f)" />
      </div>
    </td>
  </tr>

  <!-- 网格视图 -->
  <div
    v-else
    @click.stop="emit('click', file)"
    :class="[
      file.type === 'folder' ? 'cursor-pointer' : '',
      selected ? 'bg-brand-primary/20 border-brand-primary/50' : 'bg-white/5 border-white/5'
    ]"
    class="group relative hover:bg-white/10 hover:border-white/20 rounded-2xl p-4 transition-all flex flex-col items-center justify-between aspect-[4/5] border"
  >
    <div class="flex-1 flex items-center justify-center w-full text-center" :class="{'opacity-50': isViolated}">
      <svg v-if="isViolated" class="w-16 h-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <svg v-else-if="file.type === 'folder'" class="w-20 h-20 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M2.165 19.551c.086.58.586 1.01 1.173 1.01h17.324c.587 0 1.087-.43 1.173-1.01l1.161-7.854c.099-.672-.42-1.282-1.096-1.282H2.099c-.676 0-1.195.61-1.096 1.282l1.162 7.854z" opacity=".4"></path>
        <path d="M3.338 10.415h17.324c.969 0 1.713.874 1.571 1.833L21.071 20.1c-.086.58-.586 1.01-1.173 1.01H4.101c-.587 0-1.087-.43-1.173-1.01L1.767 12.248c-.142-.959.602-1.833 1.571-1.833z"></path>
        <path d="M20.5 7h-9.25l-1.5-2h-6.5A1.25 1.25 0 002 6.25v12.5c0 .69.56 1.25 1.25 1.25h.5l1.09-7.39A2.496 2.496 0 017.33 10.5h14.42c.4 0 .75.22.95.55L22 7.75A.75.75 0 0021.25 7h-.75z" opacity=".6"></path>
      </svg>
      <svg v-else class="w-16 h-16" :class="iconColor" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h5v5h5v11H6z"/>
      </svg>
    </div>
    <div class="w-full text-center mt-3">
      <p class="text-sm font-medium truncate" :class="isViolated ? 'text-red-400' : 'text-slate-200'">{{ file.name }}</p>
      <p class="text-[10px] font-mono mt-0.5" :class="isViolated ? 'text-red-500' : 'text-slate-500'">{{ isViolated ? '违规已下架' : file.size }}</p>
    </div>
    <div class="absolute top-2 right-2 options-menu-container z-10">
      <button
        @click.stop="$emit('action', 'options', file)"
        class="p-1.5 md:p-2 rounded-full text-slate-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-black/20 hover:text-white active:bg-black/30 transition-all touch-manipulation"
        aria-label="文件选项"
      >
        <svg class="w-4 h-4 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>
      <FileOptionsMenu v-if="showOptions" :file="file" :show="showOptions" @action="(action, f) => $emit('action', action, f)" />
    </div>
  </div>
</template>

