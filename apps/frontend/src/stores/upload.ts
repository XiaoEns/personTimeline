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

  /** 获取上传文件列表（分页 + 筛选） */
  fetchFiles: (params?: ListUploadedFilesParams) => Promise<void>
  /** 上传文件，自动设置 uploading 状态，成功后刷新列表 */
  uploadFile: (file: File, personId?: string) => Promise<void>
  /** 删除文件，成功后从列表中移除 */
  deleteFile: (fileId: string) => Promise<void>
  /** 手动触发切片，成功后刷新列表 */
  triggerChunk: (fileId: string) => Promise<void>
  /** 触发 AI 事件抽取 */
  triggerExtract: (fileId: string) => Promise<void>
}

export const useUploadStore = create<UploadState>((set, get) => ({
  files: [],
  total: 0,
  page: 1,
  pageSize: 20,
  loading: false,
  uploading: false,
  extracting: null,

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
    try {
      await uploadApi.extractFileEvents(fileId)
    } finally {
      await get().fetchFiles()
    }
  },
}))
