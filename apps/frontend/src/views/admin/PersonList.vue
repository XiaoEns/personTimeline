<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePersonStore } from '@/stores/person'
import type { PersonStatus } from '@person-timeline/api-types'

const router = useRouter()
const store = usePersonStore()

// ========== 搜索与筛选 ==========
const search = ref('')
const statusFilter = ref<PersonStatus | ''>('')
let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch([search, statusFilter], () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    store.fetchList({ search: search.value || undefined, status: statusFilter.value || undefined })
  }, 300)
})

// ========== 分页 ==========
const currentPage = ref(1)

watch(currentPage, (p) => {
  store.fetchList({ page: p, search: search.value || undefined, status: statusFilter.value || undefined })
})

function onPageChange(p: number) {
  currentPage.value = p
}

// ========== 删除 ==========
async function handleDelete(id: string, name: string) {
  if (!window.confirm(`确定删除人物「${name}」？此操作不可撤销。`)) return
  await store.remove(id)
  await store.fetchList({ page: currentPage.value, search: search.value || undefined, status: statusFilter.value || undefined })
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
      <button
        class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
        @click="router.push('/admin/persons/new')"
      >
        + 新建人物
      </button>
    </div>

    <!-- 搜索与筛选 -->
    <div class="mb-4 flex items-center gap-4">
      <input
        v-model="search"
        type="text"
        placeholder="搜索人物姓名..."
        class="w-72 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
      />
      <select
        v-model="statusFilter"
        class="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
      >
        <option value="">全部状态</option>
        <option value="draft">草稿</option>
        <option value="published">已发布</option>
      </select>
    </div>

    <!-- 表格 -->
    <div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
          <tr>
            <th class="px-4 py-3">姓名</th>
            <th class="px-4 py-3">生卒</th>
            <th class="px-4 py-3">状态</th>
            <th class="px-4 py-3">事件数</th>
            <th class="px-4 py-3">创建时间</th>
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
            <td colspan="6" class="px-4 py-12 text-center text-gray-400">暂无人物数据</td>
          </tr>
          <tr
            v-for="person in store.list"
            :key="person.id"
            class="hover:bg-gray-50 transition-colors"
          >
            <td class="px-4 py-3 font-medium text-gray-900">{{ person.name }}</td>
            <td class="px-4 py-3 text-gray-500">
              {{ person.birth_date?.slice(0, 10) || '未知' }}
              ~
              {{ person.death_date?.slice(0, 10) || '未知' }}
            </td>
            <td class="px-4 py-3">
              <span
                class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                :class="person.status === 'published'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-yellow-50 text-yellow-700'"
              >
                {{ person.status === 'published' ? '已发布' : '草稿' }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-500">{{ person.event_count }}</td>
            <td class="px-4 py-3 text-gray-500">{{ person.created_at.slice(0, 10) }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <button
                  class="text-sm text-primary-600 hover:text-primary-800"
                  @click="router.push(`/admin/persons/${person.id}`)"
                >
                  编辑
                </button>
                <button
                  class="text-sm text-red-500 hover:text-red-700"
                  @click="handleDelete(person.id, person.name)"
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
