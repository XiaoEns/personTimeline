import { create } from 'zustand'
import type {
  Person,
  PersonCreate,
  PersonUpdate,
  PersonDetail,
  PersonListItem,
  ListPersonsParams,
} from '@person-timeline/api-types'
import * as personApi from '@/api/persons'

interface PersonState {
  list: PersonListItem[]
  total: number
  page: number
  pageSize: number
  listLoading: boolean
  currentPerson: PersonDetail | null
  detailLoading: boolean
  aliases: string[]
  aliasLoading: boolean
  saving: boolean

  fetchList: (params?: ListPersonsParams) => Promise<void>
  fetchById: (id: string) => Promise<PersonDetail>
  create: (data: PersonCreate) => Promise<Person>
  update: (id: string, data: PersonUpdate) => Promise<Person>
  remove: (id: string) => Promise<void>
  fetchAliases: (personId: string) => Promise<void>
  addAlias: (personId: string, alias: string) => Promise<void>
  removeAlias: (personId: string, alias: string) => Promise<void>
  resetCurrent: () => void
}

export const usePersonStore = create<PersonState>((set, get) => ({
  list: [],
  total: 0,
  page: 1,
  pageSize: 20,
  listLoading: false,
  currentPerson: null,
  detailLoading: false,
  aliases: [],
  aliasLoading: false,
  saving: false,

  async fetchList(params) {
    set({ listLoading: true })
    try {
      const res = await personApi.listPersons(params)
      set({
        list: res.items,
        total: res.total,
        page: params?.page || 1,
        pageSize: params?.page_size || 20,
      })
    } finally {
      set({ listLoading: false })
    }
  },

  async fetchById(id) {
    set({ detailLoading: true })
    try {
      const data = await personApi.getPerson(id)
      set({ currentPerson: data, aliases: data.aliases })
      return data
    } finally {
      set({ detailLoading: false })
    }
  },

  async create(data) {
    set({ saving: true })
    try {
      return await personApi.createPerson(data)
    } finally {
      set({ saving: false })
    }
  },

  async update(id, data) {
    set({ saving: true })
    try {
      return await personApi.updatePerson(id, data)
    } finally {
      set({ saving: false })
    }
  },

  async remove(id) {
    await personApi.deletePerson(id)
  },

  async fetchAliases(personId) {
    set({ aliasLoading: true })
    try {
      const res = await personApi.listAliases(personId)
      set({ aliases: res.items })
    } finally {
      set({ aliasLoading: false })
    }
  },

  async addAlias(personId, alias) {
    await personApi.createAlias(personId, { alias })
    await get().fetchAliases(personId)
  },

  async removeAlias(personId, alias) {
    await personApi.deleteAlias(personId, alias)
    await get().fetchAliases(personId)
  },

  resetCurrent() {
    set({ currentPerson: null, aliases: [] })
  },
}))
