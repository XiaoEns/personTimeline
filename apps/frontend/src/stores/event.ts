import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  Event,
  EventCreate,
  EventUpdate,
  EventDetail,
  EventListItem,
  ListEventsParams,
} from '@person-timeline/api-types'
import * as eventApi from '@/api/events'

/**
 * 事件管理 Store
 * 管理事件列表、当前事件详情等状态
 */
export const useEventStore = defineStore('event', () => {
  // ========== 列表状态 ==========
  const list = ref<EventListItem[]>([])
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(20)
  const listLoading = ref(false)

  // ========== 详情状态 ==========
  const currentEvent = ref<EventDetail | null>(null)
  const detailLoading = ref(false)

  // ========== 操作状态 ==========
  const saving = ref(false)

  /** 获取事件列表（分页 + 筛选） */
  async function fetchList(params?: ListEventsParams) {
    listLoading.value = true
    try {
      const res = await eventApi.listEvents(params)
      list.value = res.data.items
      total.value = res.data.total
      page.value = res.data.page
      pageSize.value = res.data.page_size
    } finally {
      listLoading.value = false
    }
  }

  /** 获取事件详情 */
  async function fetchById(id: string) {
    detailLoading.value = true
    try {
      const res = await eventApi.getEvent(id)
      currentEvent.value = res.data
      return res.data
    } finally {
      detailLoading.value = false
    }
  }

  /** 创建事件 */
  async function create(data: EventCreate) {
    saving.value = true
    try {
      const res = await eventApi.createEvent(data)
      return res.data
    } finally {
      saving.value = false
    }
  }

  /** 更新事件 */
  async function update(id: string, data: EventUpdate) {
    saving.value = true
    try {
      const res = await eventApi.updateEvent(id, data)
      return res.data
    } finally {
      saving.value = false
    }
  }

  /** 删除事件 */
  async function remove(id: string) {
    await eventApi.deleteEvent(id)
  }

  /** 重置详情状态 */
  function resetCurrent() {
    currentEvent.value = null
  }

  return {
    list,
    total,
    page,
    pageSize,
    listLoading,
    currentEvent,
    detailLoading,
    saving,
    fetchList,
    fetchById,
    create,
    update,
    remove,
    resetCurrent,
  }
})
