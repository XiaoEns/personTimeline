<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { listPersons, uploadBiography, listBiographyTexts, deleteBiography, extractEvents } from '@/api/persons'
import type { PersonListItem, BiographyTextItem, ExtractEventItem } from '@person-timeline/api-types'

// ========== 人物选择 ==========
const persons = ref<PersonListItem[]>([])
const selectedPersonId = ref('')
const personsLoading = ref(false)

/** 加载人物列表供选择 */
async function loadPersons() {
  personsLoading.value = true
  try {
    const res = await listPersons({ page_size: 200 })
    persons.value = res.data.items
  } finally {
    personsLoading.value = false
  }
}

// ========== 文件上传 ==========
const uploading = ref(false)
const dragOver = ref(false)
const uploadError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

/** 处理文件选择（拖拽或点击） */
async function handleFile(file: File) {
  uploadError.value = ''
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ext || !['txt', 'pdf'].includes(ext)) {
    uploadError.value = '仅支持 .txt 和 .pdf 格式'
    return
  }
  if (!selectedPersonId.value) {
    uploadError.value = '请先选择关联人物'
    return
  }

  uploading.value = true
  try {
    await uploadBiography(file, selectedPersonId.value)
    await loadBiographies()
  } catch {
    uploadError.value = '上传失败，请重试'
  } finally {
    uploading.value = false
  }
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  const f = e.dataTransfer?.files[0]
  if (f) handleFile(f)
}

function onFileInputChange(e: Event) {
  const target = e.target as HTMLInputElement
  const f = target.files?.[0]
  if (f) handleFile(f)
  target.value = ''
}

// ========== 传记文本列表 ==========
const biographies = ref<BiographyTextItem[]>([])
const bioLoading = ref(false)

async function loadBiographies() {
  if (!selectedPersonId.value) {
    biographies.value = []
    return
  }
  bioLoading.value = true
  try {
    const res = await listBiographyTexts(selectedPersonId.value)
    biographies.value = res.data.items
  } finally {
    bioLoading.value = false
  }
}

async function handleDeleteBio(id: string) {
  if (!window.confirm('确定删除该传记文本？')) return
  await deleteBiography(id)
  await loadBiographies()
}

watch(selectedPersonId, () => {
  biographies.value = []
  extractResult.value = null
  loadBiographies()
})

// ========== AI 事件抽取 ==========
const extracting = ref(false)
const extractResult = ref<ExtractEventItem[] | null>(null)
const extractError = ref('')

async function handleExtract() {
  if (!selectedPersonId.value) return
  extracting.value = true
  extractError.value = ''
  extractResult.value = null
  try {
    const res = await extractEvents(selectedPersonId.value)
    extractResult.value = res.data.events
  } catch {
    extractError.value = 'AI 抽取失败，请重试'
  } finally {
    extracting.value = false
  }
}

// ========== 工具函数 ==========
function formatFileSize(len: number): string {
  if (len < 1024) return `${len} B`
  if (len < 1024 * 1024) return `${(len / 1024).toFixed(1)} KB`
  return `${(len / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return iso.slice(0, 10)
}

// ========== 初始化 ==========
onMounted(() => {
  loadPersons()
})
</script>

<template>
  <div class="max-w-3xl">
    <h2 class="mb-6 text-xl font-semibold text-gray-900">上传与抽取</h2>

    <!-- 人物选择 -->
    <section class="mb-6 rounded-lg border border-gray-200 bg-white p-6">
      <label class="mb-2 block text-sm font-medium text-gray-700">选择人物</label>
      <select
        v-model="selectedPersonId"
        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
      >
        <option value="" disabled>请选择人物</option>
        <option v-for="p in persons" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
    </section>

    <!-- 文件上传 -->
    <section class="mb-6 rounded-lg border border-gray-200 bg-white p-6">
      <h3 class="mb-3 text-base font-medium text-gray-900">上传传记文件</h3>

      <div
        class="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 transition-colors"
        :class="dragOver
          ? 'border-primary-500 bg-primary-50'
          : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'"
        @dragover.prevent="dragOver = true"
        @dragleave.prevent="dragOver = false"
        @drop.prevent="onDrop"
        @click="fileInput?.click()"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".txt,.pdf"
          class="hidden"
          @change="onFileInputChange"
        />
        <template v-if="uploading">
          <div class="mb-2 h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></div>
          <p class="text-sm text-gray-500">上传中...</p>
        </template>
        <template v-else>
          <svg class="mb-2 h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p class="text-sm text-gray-500">拖拽文件到此处，或点击上传</p>
          <p class="mt-1 text-xs text-gray-400">支持 .txt .pdf 格式</p>
        </template>
      </div>

      <p v-if="uploadError" class="mt-2 text-sm text-red-500">{{ uploadError }}</p>
    </section>

    <!-- 传记文本列表 -->
    <section v-if="selectedPersonId" class="mb-6 rounded-lg border border-gray-200 bg-white p-6">
      <h3 class="mb-3 text-base font-medium text-gray-900">已上传文本</h3>

      <div v-if="bioLoading" class="py-4 text-center text-sm text-gray-400">加载中...</div>
      <div v-else-if="biographies.length === 0" class="py-4 text-center text-sm text-gray-400">暂无上传文本</div>
      <table v-else class="w-full text-sm">
        <thead class="text-left text-xs font-medium text-gray-500 uppercase">
          <tr>
            <th class="pb-2 pr-4">文件名</th>
            <th class="pb-2 pr-4">大小</th>
            <th class="pb-2 pr-4">上传时间</th>
            <th class="pb-2">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="bio in biographies" :key="bio.id">
            <td class="py-2 pr-4 text-gray-700">{{ bio.source_file || '未知' }}</td>
            <td class="py-2 pr-4 text-gray-500">{{ formatFileSize(bio.text_length) }}</td>
            <td class="py-2 pr-4 text-gray-500">{{ formatDate(bio.created_at) }}</td>
            <td class="py-2">
              <button
                class="text-sm text-red-500 hover:text-red-700"
                @click="handleDeleteBio(bio.id)"
              >
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- AI 事件抽取 -->
    <section v-if="selectedPersonId" class="rounded-lg border border-gray-200 bg-white p-6">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-base font-medium text-gray-900">AI 事件抽取</h3>
        <button
          class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="extracting || biographies.length === 0"
          @click="handleExtract"
        >
          {{ extracting ? '抽取中...' : '开始抽取' }}
        </button>
      </div>

      <p v-if="biographies.length === 0" class="text-sm text-gray-400">请先上传传记文本</p>
      <p v-if="extractError" class="text-sm text-red-500">{{ extractError }}</p>

      <!-- 抽取结果 -->
      <div v-if="extractResult">
        <p class="mb-2 text-sm font-medium text-green-700">共抽取 {{ extractResult.length }} 个事件</p>
        <ul class="space-y-2">
          <li
            v-for="ev in extractResult"
            :key="ev.event_id"
            class="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm"
          >
            <div class="font-medium text-gray-900">{{ ev.title }}</div>
            <div class="mt-0.5 text-xs text-gray-500">
              <span class="mr-3">{{ ev.start_date.slice(0, 10) }} ~ {{ ev.end_date.slice(0, 10) }}</span>
              <span class="mr-3">{{ ev.event_type }}</span>
              <span v-if="ev.is_inferred" class="text-amber-600">[推断]</span>
            </div>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>
