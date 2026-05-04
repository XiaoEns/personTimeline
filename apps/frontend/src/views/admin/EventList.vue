<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEventStore } from '@/stores/event'
import { ElMessage, ElMessageBox } from 'element-plus'
import EventFormDialog from '@/components/EventFormDialog.vue'

const route = useRoute()
const router = useRouter()
const store = useEventStore()

// ========== 筛选 ==========
const search = ref('')
const eventTypeFilter = ref('')
const timeTypeFilter = ref('')
const personIdFilter = ref<string | undefined>(undefined)
const personNameFilter = ref<string | undefined>(undefined)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const EVENT_TYPE_LABELS: Record<string, string> = {
  BIRTH: '出生',
  DEATH: '死亡',
  EDUCATION: '教育',
  CAREER: '仕途',
  CREATION: '创作',
  HISTORICAL: '历史',
  OTHER: '其他',
}

const EVENT_TYPE_TYPES: Record<string, 'success' | 'danger' | 'primary' | 'warning' | 'info'> = {
  BIRTH: 'success',
  DEATH: 'danger',
  EDUCATION: 'primary',
  CAREER: 'warning',
  CREATION: 'primary',
  HISTORICAL: 'info',
  OTHER: 'info',
}

const TIME_TYPE_LABELS: Record<string, string> = {
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
    event_type: (eventTypeFilter.value || undefined) as import('@person-timeline/api-types').EventType | undefined,
    time_type: (timeTypeFilter.value || undefined) as import('@person-timeline/api-types').TimeType | undefined,
    person_id: personIdFilter.value,
  })
}

function onPageChange(p: number) {
  currentPage.value = p
  fetchData()
}

// ========== 人物筛选 ==========
function clearPersonFilter() {
  personIdFilter.value = undefined
  personNameFilter.value = undefined
  currentPage.value = 1
  fetchData()
  router.replace({ query: {} })
}

// ========== 弹出框 ==========
const dialogVisible = ref(false)
const editingEventId = ref<string | null>(null)

function openCreate() {
  editingEventId.value = null
  dialogVisible.value = true
}

function openEdit(id: string) {
  editingEventId.value = id
  dialogVisible.value = true
}

function onDialogSaved() {
  fetchData()
}

// ========== 删除 ==========
async function handleDelete(id: string, title: string) {
  try {
    await ElMessageBox.confirm(
      `确定删除事件「${title}」？此操作不可撤销。`,
      '确认删除',
      { type: 'warning', confirmButtonText: '删除' }
    )
    await store.remove(id)
    ElMessage.success('事件已删除')
    fetchData()
  } catch {
    // cancelled
  }
}

// ========== 初始化 ==========
onMounted(() => {
  const pid = route.query.person_id as string | undefined
  const pname = route.query.person_name as string | undefined
  if (pid) {
    personIdFilter.value = pid
    personNameFilter.value = pname
  }
  fetchData()
})
</script>

<template>
  <div>
    <!-- 头部 -->
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-xl font-semibold text-gray-900">事件管理</h2>
      <el-button type="primary" @click="openCreate">+ 新建事件</el-button>
    </div>

    <!-- 筛选 -->
    <div class="mb-4 flex items-center gap-4">
      <el-input
        v-model="search"
        placeholder="搜索事件标题..."
        clearable
        style="width: 280px"
      />
      <el-select v-model="eventTypeFilter" placeholder="全部类型" clearable style="width: 140px">
        <el-option label="全部类型" value="" />
        <el-option v-for="(label, key) in EVENT_TYPE_LABELS" :key="key" :label="label" :value="key" />
      </el-select>
      <el-select v-model="timeTypeFilter" placeholder="全部时间类型" clearable style="width: 150px">
        <el-option label="全部时间类型" value="" />
        <el-option v-for="(label, key) in TIME_TYPE_LABELS" :key="key" :label="label" :value="key" />
      </el-select>
      <el-tag
        v-if="personNameFilter"
        closable
        type="primary"
        @close="clearPersonFilter"
      >
        筛选：{{ personNameFilter }}
      </el-tag>
    </div>

    <!-- 表格 -->
    <el-table
      :data="store.list"
      v-loading="store.listLoading"
      stripe
      style="width: 100%"
      empty-text="暂无事件数据"
    >
      <el-table-column prop="title" label="事件标题" min-width="160">
        <template #default="{ row }">
          <span class="font-medium text-gray-900">{{ row.title }}</span>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="90">
        <template #default="{ row }">
          <el-tag :type="EVENT_TYPE_TYPES[row.event_type]" size="small">
            {{ EVENT_TYPE_LABELS[row.event_type] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="时间" width="100">
        <template #default="{ row }">
          <el-tag size="small" effect="plain">
            {{ TIME_TYPE_LABELS[row.time_type] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="关联人物" min-width="140">
        <template #default="{ row }">
          <span v-for="p in row.persons" :key="p.id" class="mr-1 inline-block text-gray-500">{{ p.name }}</span>
          <span v-if="row.persons.length === 0" class="text-gray-300">-</span>
        </template>
      </el-table-column>
      <el-table-column label="排序日期" width="110">
        <template #default="{ row }">
          <span class="text-gray-500">{{ row.sort_date?.slice(0, 10) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row.id)">编辑</el-button>
          <el-button link type="danger" size="small" @click="handleDelete(row.id, row.title)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div v-if="store.total > store.pageSize" class="mt-4 flex justify-end">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="store.pageSize"
        :total="store.total"
        layout="total, prev, pager, next"
        background
        @current-change="onPageChange"
      />
    </div>

    <!-- 新建/编辑弹出框 -->
    <EventFormDialog
      v-model:visible="dialogVisible"
      :event-id="editingEventId"
      @saved="onDialogSaved"
    />
  </div>
</template>
