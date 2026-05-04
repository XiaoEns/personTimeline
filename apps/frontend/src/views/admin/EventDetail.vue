<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEventStore } from '@/stores/event'
import { listPersons } from '@/api/persons'
import type { EventCreate, EventUpdate, EventType, TimeType, Granularity, PersonListItem } from '@person-timeline/api-types'

const route = useRoute()
const router = useRouter()
const store = useEventStore()

/** 判断是否为新建模式 */
const isCreate = computed(() => route.path.endsWith('/new'))
const eventId = computed(() => route.params.id as string | undefined)

// ========== 枚举常量 ==========
const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: 'BIRTH', label: '出生' },
  { value: 'DEATH', label: '死亡' },
  { value: 'EDUCATION', label: '教育' },
  { value: 'CAREER', label: '仕途' },
  { value: 'CREATION', label: '创作' },
  { value: 'HISTORICAL', label: '历史' },
  { value: 'OTHER', label: '其他' },
]

const TIME_TYPE_OPTIONS: { value: TimeType; label: string }[] = [
  { value: 'POINT', label: '时间点' },
  { value: 'PERIOD', label: '时间段' },
  { value: 'FUZZY', label: '模糊' },
]

const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
  { value: 'YEAR', label: '年' },
  { value: 'MONTH', label: '月' },
  { value: 'DAY', label: '日' },
  { value: 'SEASON', label: '季' },
]

// ========== 表单 ==========
const form = ref<EventCreate>({
  title: '',
  description: null,
  start_date: '',
  end_date: '',
  display_time: null,
  time_type: 'POINT',
  granularity: 'YEAR',
  event_type: 'OTHER',
  location: null,
  source: null,
  person_ids: [],
})

// ========== 人物选择器 ==========
const persons = ref<PersonListItem[]>([])
const personSearch = ref('')
const personsLoading = ref(false)
const selectedPersonIds = ref<string[]>([])

/** 获取人物列表供选择 */
async function fetchPersons() {
  personsLoading.value = true
  try {
    const res = await listPersons({ page_size: 100, search: personSearch.value || undefined })
    persons.value = res.data.items
  } finally {
    personsLoading.value = false
  }
}

/** 切换人物选中 */
function togglePerson(personId: string) {
  const idx = selectedPersonIds.value.indexOf(personId)
  if (idx === -1) {
    selectedPersonIds.value.push(personId)
  } else {
    selectedPersonIds.value.splice(idx, 1)
  }
}

function getPersonName(personId: string): string {
  return persons.value.find((p) => p.id === personId)?.name || personId
}

// ========== 保存 ==========
async function handleSave() {
  if (!form.value.title.trim()) {
    alert('请输入事件标题')
    return
  }
  if (!form.value.start_date || !form.value.end_date) {
    alert('请填写起始和结束日期')
    return
  }

  const payload: EventCreate = {
    ...form.value,
    person_ids: selectedPersonIds.value.length > 0 ? selectedPersonIds.value : undefined,
  }

  if (isCreate.value) {
    const ev = await store.create(payload)
    router.push(`/admin/events/${ev.id}`)
  } else if (eventId.value) {
    const updateData: EventUpdate = {
      title: form.value.title,
      description: form.value.description,
      start_date: form.value.start_date,
      end_date: form.value.end_date,
      display_time: form.value.display_time,
      time_type: form.value.time_type,
      granularity: form.value.granularity,
      event_type: form.value.event_type,
      location: form.value.location,
      source: form.value.source,
    }
    await store.update(eventId.value, updateData)
    alert('保存成功')
  }
}

// ========== 删除 ==========
async function handleDelete() {
  if (!eventId.value) return
  if (!window.confirm(`确定删除事件「${form.value.title}」？此操作不可撤销。`)) return
  await store.remove(eventId.value)
  router.push('/admin/events')
}

// ========== 初始化 ==========
onMounted(async () => {
  await fetchPersons()
  if (!isCreate.value && eventId.value) {
    const ev = await store.fetchById(eventId.value)
    if (ev) {
      form.value = {
        title: ev.title,
        description: ev.description,
        start_date: ev.start_date,
        end_date: ev.end_date,
        display_time: ev.display_time,
        time_type: ev.time_type,
        granularity: ev.granularity,
        event_type: ev.event_type,
        location: ev.location,
        source: ev.source,
        person_ids: ev.persons.map((p) => p.id),
      }
      selectedPersonIds.value = ev.persons.map((p) => p.id)
    }
  }
})
</script>

<template>
  <div>
    <!-- 头部 -->
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button
          class="text-gray-400 hover:text-gray-600 transition-colors"
          @click="router.push('/admin/events')"
        >
          &larr; 返回列表
        </button>
        <h2 class="text-xl font-semibold text-gray-900">
          {{ isCreate ? '新建事件' : '编辑事件' }}
        </h2>
      </div>
      <div class="flex items-center gap-3">
        <button
          v-if="!isCreate"
          class="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          @click="handleDelete"
        >
          删除
        </button>
        <button
          class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          @click="router.push('/admin/events')"
        >
          取消
        </button>
        <button
          class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="store.saving"
          @click="handleSave"
        >
          {{ store.saving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="store.detailLoading" class="animate-pulse space-y-4 rounded-lg border border-gray-200 bg-white p-6">
      <div v-for="i in 6" :key="i" class="h-10 w-full rounded bg-gray-200"></div>
    </div>

    <!-- 表单 -->
    <div v-else class="space-y-6">
      <!-- 基本信息 -->
      <section class="rounded-lg border border-gray-200 bg-white p-6">
        <h3 class="mb-4 text-base font-medium text-gray-900">基本信息</h3>
        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">事件标题 *</label>
            <input
              v-model="form.title"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="事件标题"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">描述</label>
            <textarea
              v-model="form.description"
              rows="3"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none"
              placeholder="事件描述..."
            ></textarea>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">事件类型 *</label>
              <select
                v-model="form.event_type"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              >
                <option v-for="opt in EVENT_TYPE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">时间类型 *</label>
              <select
                v-model="form.time_type"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              >
                <option v-for="opt in TIME_TYPE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">时间粒度 *</label>
              <select
                v-model="form.granularity"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              >
                <option v-for="opt in GRANULARITY_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">开始日期 *</label>
              <input
                v-model="form.start_date"
                type="date"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">结束日期 *</label>
              <input
                v-model="form.end_date"
                type="date"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">显示文本</label>
            <input
              v-model="form.display_time"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="如：建安十三年冬"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">来源</label>
            <input
              v-model="form.source"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="信息来源"
            />
          </div>
        </div>
      </section>

      <!-- 人物选择 -->
      <section class="rounded-lg border border-gray-200 bg-white p-6">
        <h3 class="mb-4 text-base font-medium text-gray-900">关联人物</h3>
        <div class="mb-3">
          <input
            v-model="personSearch"
            type="text"
            placeholder="搜索人物..."
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            @input="fetchPersons"
          />
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="p in persons"
            :key="p.id"
            class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm border transition-colors"
            :class="selectedPersonIds.includes(p.id)
              ? 'border-primary-500 bg-primary-50 text-primary-700'
              : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'"
            @click="togglePerson(p.id)"
          >
            {{ p.name }}
          </button>
          <span v-if="persons.length === 0" class="text-sm text-gray-400">暂无人物数据</span>
        </div>
        <div v-if="selectedPersonIds.length > 0" class="mt-3 flex flex-wrap gap-2">
          <span class="text-xs text-gray-400">已选：</span>
          <span
            v-for="pid in selectedPersonIds"
            :key="pid"
            class="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700"
          >
            {{ getPersonName(pid) }}
            <button class="text-primary-400 hover:text-primary-600" @click="togglePerson(pid)">&times;</button>
          </span>
        </div>
      </section>
    </div>
  </div>
</template>
