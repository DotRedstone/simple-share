<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseButton from './BaseButton.vue'
import BaseModal from './BaseModal.vue'

defineProps<{ show: boolean }>()
const emit = defineEmits(['close', 'upload'])

const files = ref<File[]>([])
const isDragging = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    files.value = Array.from(target.files)
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files) {
    files.value = Array.from(event.dataTransfer.files)
  }
}

const removeFile = (index: number) => {
  files.value.splice(index, 1)
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const totalSize = computed(() => {
  return files.value.reduce((sum, file) => sum + file.size, 0)
})

const handleUpload = async () => {
  if (files.value.length === 0) return
  
  isUploading.value = true
  uploadProgress.value = 0
  
  // 模拟上传进度
  const interval = setInterval(() => {
    uploadProgress.value += 10
    if (uploadProgress.value >= 100) {
      clearInterval(interval)
      setTimeout(() => {
        emit('upload', files.value)
        files.value = []
        isUploading.value = false
        uploadProgress.value = 0
        emit('close')
      }, 500)
    }
  }, 200)
}
</script>

<template>
  <BaseModal :show="show" title="上传文件" width="max-w-2xl" @close="$emit('close')">
    <div
        class="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center transition-colors"
        :class="{ 'bg-slate-700/50': isDragging }"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
    >
      <p class="text-slate-400 mb-4">拖拽文件到此处，或</p>
      <label class="cursor-pointer">
        <span class="text-blue-400 font-semibold hover:underline">选择文件</span>
        <input type="file" multiple class="hidden" @change="handleFileChange" />
      </label>
    </div>

    <div v-if="files.length > 0" class="mt-6 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-600">
      <div v-for="(file, index) in files" :key="index" class="flex items-center justify-between bg-white/5 p-3 rounded-lg mb-2">
        <div class="flex-1 min-w-0">
          <p class="text-sm text-slate-300 truncate font-medium">{{ file.name }}</p>
          <p class="text-xs text-slate-500 mt-1">{{ formatFileSize(file.size) }}</p>
        </div>
        <button
          v-if="!isUploading"
          @click="removeFile(index)"
          class="ml-3 text-slate-500 hover:text-red-400 transition-colors shrink-0"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>
      <div class="mt-3 text-xs text-slate-500 text-center">
        共 {{ files.length }} 个文件，总大小 {{ formatFileSize(totalSize) }}
      </div>
    </div>

    <!-- 上传进度 -->
    <div v-if="isUploading" class="mt-6">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-slate-400">上传中...</span>
        <span class="text-sm text-slate-400">{{ uploadProgress }}%</span>
      </div>
      <div class="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
        <div
          class="bg-blue-500 h-2 rounded-full transition-all duration-300"
          :style="{ width: uploadProgress + '%' }"
        ></div>
      </div>
    </div>

    <div class="mt-8 flex justify-end gap-4">
      <BaseButton variant="glass" @click="$emit('close')" :disabled="isUploading">取消</BaseButton>
      <BaseButton
        variant="primary"
        @click="handleUpload"
        :disabled="files.length === 0 || isUploading"
        :loading="isUploading"
      >
        {{ isUploading ? '上传中...' : '开始上传' }}
      </BaseButton>
    </div>
  </BaseModal>
</template>