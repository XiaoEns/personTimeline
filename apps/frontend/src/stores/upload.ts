import { create } from 'zustand'
import type {
  UploadedFileItem,
  ListUploadedFilesParams,
} from '@person-timeline/api-types'
import * as uploadApi from '@/api/upload'

interface UploadState {
  files: UploadedFileItem[]
  total: number
  page: number
  pageSize: number
  loading: boolean
  uploading: boolean
  extracting: string | null

  _pollTimer: ReturnType<typeof setInterval> | null

  /** 获取上传文件列表（分页 + 筛选） */
  fetchFiles: (params?: ListUploadedFilesParams) => Promise<void>
  /** 上传文件，自动设置 uploading 状态，成功后刷新列表 */
  uploadFile: (file: File, personId: string) => Promise<void>
  /** 删除文件，成功后从列表中移除 */
  deleteFile: (fileId: string) => Promise<void>
  /** 手动触发切片，成功后刷新列表 */
  triggerChunk: (fileId: string) => Promise<void>
  /** 触发 AI 事件抽取，设置 extracting 状态 */
  triggerExtract: (fileId: string) => Promise<void>
  /** 轮询文件状态（3s 间隔），完成/出错时停止并刷新列表 */
  pollStatus: (fileId: string) => void
  /** 清空 extracting 状态并停止轮询 */
  resetExtracting: () => void
}

export const useUploadStore = create<UploadState>((set, get) => ({
  files: [],
  total: 0,
  page: 1,
  pageSize: 20,
  loading: false,
  uploading: false,
  extracting: null,
  _pollTimer: null,

  async fetchFiles(params) {
    set({ loading: true })
    try {
      const res = await uploadApi.listUploadedFiles(params)
      set({
        files: res.items,
        total: res.total,
        page: params?.page || 1,
        pageSize: params?.page_size || 20,
      })
    } finally {
      set({ loading: false })
    }
  },

  async uploadFile(file, personId) {
    set({ uploading: true })
    try {
      await uploadApi.uploadFile(file, personId)
      await get().fetchFiles()
    } finally {
      set({ uploading: false })
    }
  },

  async deleteFile(fileId) {
    await uploadApi.deleteUploadedFile(fileId)
    set(state => ({
      files: state.files.filter(f => f.id !== fileId),
      total: state.total - 1,
    }))
  },

  async triggerChunk(fileId) {
    await uploadApi.triggerChunk(fileId)
    await get().fetchFiles()
  },

  async triggerExtract(fileId) {
    set({ extracting: fileId })
    try {
      await uploadApi.extractFileEvents(fileId)
      get().pollStatus(fileId)
    } catch {
      set({ extracting: null })
    }
  },

  pollStatus(fileId) {
    const { _pollTimer: existing } = get()
    if (existing) clearInterval(existing)

    const timer = setInterval(async () => {
      try {
        const file = await uploadApi.getUploadedFile(fileId)
        if (file.status === 'completed' || file.status === 'error') {
          clearInterval(timer)
          set({ extracting: null, _pollTimer: null })
          await get().fetchFiles()
        }
      } catch {
        clearInterval(timer)
        set({ extracting: null, _pollTimer: null })
      }
    }, 3000)

    set({ _pollTimer: timer })
  },

  resetExtracting() {
    const { _pollTimer } = get()
    if (_pollTimer) {
      clearInterval(_pollTimer)
    }
    set({ extracting: null, _pollTimer: null })
  },
}))
