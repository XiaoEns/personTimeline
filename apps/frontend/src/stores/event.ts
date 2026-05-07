import { create } from 'zustand'
import type {
  EventCreate,
  EventUpdate,
  EventDetail,
  EventListItem,
  ListEventsParams,
} from '@person-timeline/api-types'
import * as eventApi from '@/api/events'

interface EventState {
  list: EventListItem[]
  total: number
  page: number
  pageSize: number
  listLoading: boolean
  currentEvent: EventDetail | null
  detailLoading: boolean
  saving: boolean

  fetchList: (params?: ListEventsParams) => Promise<void>
  fetchById: (id: string) => Promise<EventDetail>
  create: (data: EventCreate) => Promise<EventDetail>
  update: (id: string, data: EventUpdate) => Promise<EventDetail>
  remove: (id: string) => Promise<void>
  resetCurrent: () => void
}

export const useEventStore = create<EventState>((set) => ({
  list: [],
  total: 0,
  page: 1,
  pageSize: 20,
  listLoading: false,
  currentEvent: null,
  detailLoading: false,
  saving: false,

  async fetchList(params) {
    set({ listLoading: true })
    try {
      const res = await eventApi.listEvents(params)
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
      const data = await eventApi.getEvent(id)
      set({ currentEvent: data })
      return data
    } finally {
      set({ detailLoading: false })
    }
  },

  async create(data) {
    set({ saving: true })
    try {
      return await eventApi.createEvent(data)
    } finally {
      set({ saving: false })
    }
  },

  async update(id, data) {
    set({ saving: true })
    try {
      return await eventApi.updateEvent(id, data)
    } finally {
      set({ saving: false })
    }
  },

  async remove(id) {
    await eventApi.deleteEvent(id)
  },

  resetCurrent() {
    set({ currentEvent: null })
  },
}))
