<script setup lang="ts">
import { computed } from 'vue'
import type { FileItem as FileItemType } from '../types'
import FileOptionsMenu from './FileOptionsMenu.vue'

interface Props {
  file: FileItemType
  viewMode: 'list' | 'grid'
  showOptions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showOptions: false
})

const emit = defineEmits<{
  (e: 'click', file: FileItemType): void
  (e: 'action', action: string, file: FileItemType): void
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

const iconColor = computed(() => getFileIconColor(props.file.type))
</script>

<template>
  <!-- 列表视图 -->
  <tr
    v-if="viewMode === 'list'"
    @click="emit('click', file)"
    class="hover:bg-white/5 transition-colors group"
    :class="file.type === 'folder' ? 'cursor-pointer' : ''"
  >
    <td class="px-6 py-4 font-medium text-white">
      <div class="flex items-center gap-3">
        <svg class="w-6 h-6 shrink-0" :class="iconColor" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
        </svg>
        <span>{{ file.name }}</span>
      </div>
    </td>
    <td class="px-6 py-4 font-mono hidden sm:table-cell">{{ file.size }}</td>
    <td class="px-6 py-4 hidden sm:table-cell">{{ file.date }}</td>
    <td class="px-6 py-4 text-right">
      <div class="relative options-menu-container">
        <button
          @click.stop="$emit('action', 'options', file)"
          class="p-1.5 rounded-full text-slate-400 hover:bg-black/20 hover:text-white transition-colors"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
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
    @click="emit('click', file)"
    :class="file.type === 'folder' ? 'cursor-pointer' : ''"
    class="group relative bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 rounded-2xl p-4 transition-all flex flex-col items-center justify-between aspect-[4/5]"
  >
    <div class="flex-1 flex items-center justify-center w-full text-center">
      <svg v-if="file.type === 'folder'" class="w-20 h-20 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M2.165 19.551c.086.58.586 1.01 1.173 1.01h17.324c.587 0 1.087-.43 1.173-1.01l1.161-7.854c.099-.672-.42-1.282-1.096-1.282H2.099c-.676 0-1.195.61-1.096 1.282l1.162 7.854z" opacity=".4"></path>
        <path d="M3.338 10.415h17.324c.969 0 1.713.874 1.571 1.833L21.071 20.1c-.086.58-.586 1.01-1.173 1.01H4.101c-.587 0-1.087-.43-1.173-1.01L1.767 12.248c-.142-.959.602-1.833 1.571-1.833z"></path>
        <path d="M20.5 7h-9.25l-1.5-2h-6.5A1.25 1.25 0 002 6.25v12.5c0 .69.56 1.25 1.25 1.25h.5l1.09-7.39A2.496 2.496 0 017.33 10.5h14.42c.4 0 .75.22.95.55L22 7.75A.75.75 0 0021.25 7h-.75z" opacity=".6"></path>
      </svg>
      <svg v-else class="w-16 h-16" :class="iconColor" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h5v5h5v11H6z"/>
      </svg>
    </div>
    <div class="w-full text-center mt-3">
      <p class="text-sm font-medium text-slate-200 truncate">{{ file.name }}</p>
      <p class="text-[10px] text-slate-500 font-mono mt-0.5">{{ file.size }}</p>
    </div>
    <div class="absolute top-2 right-2 options-menu-container">
      <button
        @click.stop="$emit('action', 'options', file)"
        class="p-1.5 rounded-full text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-black/20 hover:text-white transition-all"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>
      <FileOptionsMenu v-if="showOptions" :file="file" :show="showOptions" @action="(action, f) => $emit('action', action, f)" />
    </div>
  </div>
</template>

