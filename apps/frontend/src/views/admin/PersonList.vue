<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePersonStore } from '@/stores/person'
import { ElMessage, ElMessageBox } from 'element-plus'
import PersonFormDialog from '@/components/PersonFormDialog.vue'

const router = useRouter()
const store = usePersonStore()

// ========== 搜索与筛选 ==========
const search = ref('')
const statusFilter = ref('')
let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch([search, statusFilter], () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    store.fetchList({ search: search.value || undefined, status: (statusFilter.value || undefined) as import('@person-timeline/api-types').PersonStatus | undefined })
  }, 300)
})

// ========== 分页 ==========
const currentPage = ref(1)

watch(currentPage, (p) => {
  store.fetchList({ page: p, search: search.value || undefined, status: (statusFilter.value || undefined) as import('@person-timeline/api-types').PersonStatus | undefined })
})

function onPageChange(p: number) {
  currentPage.value = p
}

// ========== 弹出框 ==========
const dialogVisible = ref(false)
const editingPersonId = ref<string | null>(null)

function openCreate() {
  editingPersonId.value = null
  dialogVisible.value = true
}

function openEdit(id: string) {
  editingPersonId.value = id
  dialogVisible.value = true
}

function onDialogSaved() {
  store.fetchList({ page: currentPage.value, search: search.value || undefined, status: (statusFilter.value || undefined) as import('@person-timeline/api-types').PersonStatus | undefined })
}

// ========== 删除 ==========
async function handleDelete(id: string, name: string) {
  try {
    await ElMessageBox.confirm(
      `确定删除人物「${name}」？此操作不可撤销。`,
      '确认删除',
      { type: 'warning', confirmButtonText: '删除' }
    )
    await store.remove(id)
    ElMessage.success('人物已删除')
    await store.fetchList({ page: currentPage.value, search: search.value || undefined, status: (statusFilter.value || undefined) as import('@person-timeline/api-types').PersonStatus | undefined })
  } catch {
    // cancelled
  }
}

// ========== 初始化 ==========
onMounted(() => {
  store.fetchList()
})
</script>

<template>
  <div>
    <!-- 头部 -->
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-xl font-semibold text-gray-900">人物管理</h2>
      <el-button type="primary" @click="openCreate">+ 新建人物</el-button>
    </div>

    <!-- 搜索与筛选 -->
    <div class="mb-4 flex items-center gap-4">
      <el-input
        v-model="search"
        placeholder="搜索人物姓名..."
        clearable
        style="width: 280px"
      />
      <el-select v-model="statusFilter" placeholder="全部状态" clearable style="width: 140px">
        <el-option label="全部状态" value="" />
        <el-option label="草稿" value="draft" />
        <el-option label="已发布" value="published" />
      </el-select>
    </div>

    <!-- 表格 -->
    <el-table
      :data="store.list"
      v-loading="store.listLoading"
      stripe
      style="width: 100%"
      empty-text="暂无人物数据"
    >
      <el-table-column prop="name" label="姓名" min-width="120">
        <template #default="{ row }">
          <span class="font-medium text-gray-900">{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column label="生卒" min-width="180">
        <template #default="{ row }">
          <span class="text-gray-500">
            {{ row.birth_date?.slice(0, 10) || '未知' }}
            ~
            {{ row.death_date?.slice(0, 10) || '未知' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag
            :type="row.status === 'published' ? 'success' : 'warning'"
            size="small"
          >
            {{ row.status === 'published' ? '已发布' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="event_count" label="事件数" width="80" />
      <el-table-column label="创建时间" width="110">
        <template #default="{ row }">
          <span class="text-gray-500">{{ row.created_at.slice(0, 10) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row.id)">编辑</el-button>
          <el-button link type="primary" size="small" @click="router.push(`/view/persons/${row.id}`)">时间轴</el-button>
          <el-button link type="primary" size="small" @click="router.push({ path: '/admin/events', query: { person_id: row.id, person_name: row.name } })">事件</el-button>
          <el-button link type="danger" size="small" @click="handleDelete(row.id, row.name)">删除</el-button>
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
    <PersonFormDialog
      v-model:visible="dialogVisible"
      :person-id="editingPersonId"
      @saved="onDialogSaved"
    />
  </div>
</template>
