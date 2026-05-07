import apiClient from './client'
import type {
  UploadedFileItem,
  PaginatedUploadedFiles,
  ListUploadedFilesParams,
  UploadedFileDetail,
  ChunkListResponse,
  ChunkTextResponse,
  FileExtractResponse,
} from '@person-timeline/api-types'

/** 上传文件（.txt/.pdf），创建 uploaded_files 记录并启动后台切片 */
export function uploadFile(file: File, personId: string) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('person_id', personId)
  return apiClient.post<UploadedFileItem>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)
}

/** 获取上传文件列表（分页 + 按人物/状态筛选） */
export function listUploadedFiles(params?: ListUploadedFilesParams) {
  return apiClient.get<PaginatedUploadedFiles>('/uploaded-files', { params }).then(r => r.data)
}

/** 获取单个上传文件详情（含切片数量） */
export function getUploadedFile(fileId: string) {
  return apiClient.get<UploadedFileDetail>(`/uploaded-files/${fileId}`).then(r => r.data)
}

/** 删除上传文件（同时删除磁盘文件及关联切片） */
export function deleteUploadedFile(fileId: string) {
  return apiClient.delete<void>(`/uploaded-files/${fileId}`).then(r => r.data)
}

/** 手动触发文件切片（支持失败重试） */
export function triggerChunk(fileId: string) {
  return apiClient.post<UploadedFileItem>(`/uploaded-files/${fileId}/chunk`).then(r => r.data)
}

/** 获取文件的所有切片列表（按 chunk_index 排序） */
export function getChunks(fileId: string) {
  return apiClient.get<ChunkListResponse>(`/uploaded-files/${fileId}/chunks`).then(r => r.data)
}

/** 获取单个切片的完整文本内容 */
export function getChunkText(biographyId: string) {
  return apiClient.get<ChunkTextResponse>(`/biography-texts/${biographyId}`).then(r => r.data)
}

/** 对文件触发 AI 事件抽取（异步后台执行，前端轮询 uploaded_files.status 获取结果） */
export function extractFileEvents(fileId: string, data?: { model?: string }) {
  return apiClient.post<FileExtractResponse>(`/uploaded-files/${fileId}/extract`, data).then(r => r.data)
}
