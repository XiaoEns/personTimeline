import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  Person,
  PersonCreate,
  PersonUpdate,
  PersonDetail,
  PersonListItem,
  PaginatedPersons,
  ListPersonsParams,
} from '@person-timeline/api-types'
import * as personApi from '@/api/persons'

/**
 * 人物管理 Store
 * 管理人物列表、当前人物详情、别名等状态
 */
export const usePersonStore = defineStore('person', () => {
  // ========== 列表状态 ==========
  const list = ref<PersonListItem[]>([])
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(20)
  const listLoading = ref(false)

  // ========== 详情状态 ==========
  const currentPerson = ref<PersonDetail | null>(null)
  const detailLoading = ref(false)

  // ========== 别名状态 ==========
  const aliases = ref<string[]>([])
  const aliasLoading = ref(false)

  // ========== 操作状态 ==========
  const saving = ref(false)

  /** 获取人物列表（分页 + 搜索 + 状态筛选） */
  async function fetchList(params?: ListPersonsParams) {
    listLoading.value = true
    try {
      const res = await personApi.listPersons(params)
      list.value = res.data.items
      total.value = res.data.total
      page.value = res.data.page
      pageSize.value = res.data.page_size
    } finally {
      listLoading.value = false
    }
  }

  /** 获取人物详情 */
  async function fetchById(id: string) {
    detailLoading.value = true
    try {
      const res = await personApi.getPerson(id)
      currentPerson.value = res.data
      aliases.value = res.data.aliases
      return res.data
    } finally {
      detailLoading.value = false
    }
  }

  /** 创建人物 */
  async function create(data: PersonCreate) {
    saving.value = true
    try {
      const res = await personApi.createPerson(data)
      return res.data
    } finally {
      saving.value = false
    }
  }

  /** 更新人物 */
  async function update(id: string, data: PersonUpdate) {
    saving.value = true
    try {
      const res = await personApi.updatePerson(id, data)
      return res.data
    } finally {
      saving.value = false
    }
  }

  /** 删除人物 */
  async function remove(id: string) {
    await personApi.deletePerson(id)
  }

  // ========== 别名操作 ==========

  /** 获取别名列表 */
  async function fetchAliases(personId: string) {
    aliasLoading.value = true
    try {
      const res = await personApi.listAliases(personId)
      aliases.value = res.data.items
    } finally {
      aliasLoading.value = false
    }
  }

  /** 添加别名 */
  async function addAlias(personId: string, alias: string) {
    await personApi.createAlias(personId, { alias })
    await fetchAliases(personId)
  }

  /** 删除别名 */
  async function removeAlias(personId: string, alias: string) {
    await personApi.deleteAlias(personId, alias)
    await fetchAliases(personId)
  }

  /** 重置详情状态 */
  function resetCurrent() {
    currentPerson.value = null
    aliases.value = []
  }

  return {
    list,
    total,
    page,
    pageSize,
    listLoading,
    currentPerson,
    detailLoading,
    aliases,
    aliasLoading,
    saving,
    fetchList,
    fetchById,
    create,
    update,
    remove,
    fetchAliases,
    addAlias,
    removeAlias,
    resetCurrent,
  }
})
