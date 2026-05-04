<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEventStore } from '@/stores/event'
import type { EventType, TimeType } from '@person-timeline/api-types'

const router = useRouter()
const store = useEventStore()

// ========== 筛选 ==========
const search = ref('')
const eventTypeFilter = ref<EventType | ''>('')
const timeTypeFilter = ref<TimeType | ''>('')
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  BIRTH: '出生',
  DEATH: '死亡',
  EDUCATION: '教育',
  CAREER: '仕途',
  CREATION: '创作',
  HISTORICAL: '历史',
  OTHER: '其他',
}

const EVENT_TYPE_COLORS: Record<EventType, string> = {
  BIRTH: 'bg-pink-50 text-pink-700',
  DEATH: 'bg-gray-100 text-gray-700',
  EDUCATION: 'bg-blue-50 text-blue-700',
  CAREER: 'bg-amber-50 text-amber-700',
  CREATION: 'bg-purple-50 text-purple-700',
  HISTORICAL: 'bg-cyan-50 text-cyan-700',
  OTHER: 'bg-slate-50 text-slate-700',
}

const TIME_TYPE_LABELS: Record<TimeType, string> = {
  POINT: '时间点',
  PERIOD: '时间段',
  FUZZY: '模糊',
}

watch([search, eventTypeFilter, timeTypeFilter], () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    currentPage.value = 1
    fetchData()
  }, 300)
})

// ========== 分页 ==========
const currentPage = ref(1)

function fetchData() {
  store.fetchList({
    page: currentPage.value,
    search: search.value || undefined,
    event_type: eventTypeFilter.value || undefined,
    time_type: timeTypeFilter.value || undefined,
  })
}

function onPageChange(p: number) {
  currentPage.value = p
  fetchData()
}

// ========== 删除 ==========
async function handleDelete(id: string, title: string) {
  if (!window.confirm(`确定删除事件「${title}」？此操作不可撤销。`)) return
  await store.remove(id)
  fetchData()
}

// ========== 初始化 ==========
onMounted(() => {
  fetchData()
})
</script>

<template>
  <div>
    <!-- 头部 -->
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-xl font-semibold text-gray-900">事件管理</h2>
      <button
        class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
        @click="router.push('/admin/events/new')"
      >
        + 新建事件
      </button>
    </div>

    <!-- 筛选 -->
    <div class="mb-4 flex items-center gap-4">
      <input
        v-model="search"
        type="text"
        placeholder="搜索事件标题..."
        class="w-72 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
      />
      <select
        v-model="eventTypeFilter"
        class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
      >
        <option value="">全部类型</option>
        <option v-for="(label, key) in EVENT_TYPE_LABELS" :key="key" :value="key">{{ label }}</option>
      </select>
      <select
        v-model="timeTypeFilter"
        class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
      >
        <option value="">全部时间类型</option>
        <option v-for="(label, key) in TIME_TYPE_LABELS" :key="key" :value="key">{{ label }}</option>
      </select>
    </div>

    <!-- 表格 -->
    <div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
          <tr>
            <th class="px-4 py-3">事件标题</th>
            <th class="px-4 py-3">类型</th>
            <th class="px-4 py-3">时间</th>
            <th class="px-4 py-3">关联人物</th>
            <th class="px-4 py-3">排序日期</th>
            <th class="px-4 py-3">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="store.listLoading" class="animate-pulse">
            <td v-for="i in 6" :key="i" class="px-4 py-3">
              <div class="h-4 w-20 rounded bg-gray-200"></div>
            </td>
          </tr>
          <tr v-else-if="store.list.length === 0">
            <td colspan="6" class="px-4 py-12 text-center text-gray-400">暂无事件数据</td>
          </tr>
          <tr
            v-for="event in store.list"
            :key="event.id"
            class="hover:bg-gray-50 transition-colors"
          >
            <td class="px-4 py-3 font-medium text-gray-900">{{ event.title }}</td>
            <td class="px-4 py-3">
              <span
                class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                :class="EVENT_TYPE_COLORS[event.event_type]"
              >
                {{ EVENT_TYPE_LABELS[event.event_type] }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-500">
              <span class="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium">
                {{ TIME_TYPE_LABELS[event.time_type] }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-500">
              <span v-for="p in event.persons" :key="p.id" class="mr-1 inline-block">
                {{ p.name }}
              </span>
              <span v-if="event.persons.length === 0" class="text-gray-300">-</span>
            </td>
            <td class="px-4 py-3 text-gray-500">{{ event.sort_date?.slice(0, 10) }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <button
                  class="text-sm text-primary-600 hover:text-primary-800"
                  @click="router.push(`/admin/events/${event.id}`)"
                >
                  编辑
                </button>
                <button
                  class="text-sm text-red-500 hover:text-red-700"
                  @click="handleDelete(event.id, event.title)"
                >
                  删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div v-if="store.total > store.pageSize" class="mt-4 flex items-center justify-between text-sm text-gray-500">
      <span>共 {{ store.total }} 条</span>
      <div class="flex items-center gap-2">
        <button
          class="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="currentPage <= 1"
          @click="onPageChange(currentPage - 1)"
        >
          上一页
        </button>
        <span class="px-2">{{ currentPage }} / {{ Math.ceil(store.total / store.pageSize) }}</span>
        <button
          class="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="currentPage >= Math.ceil(store.total / store.pageSize)"
          @click="onPageChange(currentPage + 1)"
        >
          下一页
        </button>
      </div>
    </div>
  </div>
</template>
