import apiClient from './client'
import type {
  Person,
  PersonCreate,
  PersonUpdate,
  PersonDetail,
  PaginatedPersons,
  ListPersonsParams,
  Alias,
  AliasCreate,
  AliasList,
  PersonEventCreate,
  PersonEventUpdate,
  PersonEvent,
  PersonEventList,
  BiographyText,
  BiographyTextList,
  ExtractRequest,
  ExtractResult,
} from '@person-timeline/api-types'

/** 获取人物列表（分页 + 搜索 + 状态筛选） */
export function listPersons(params?: ListPersonsParams) {
  return apiClient.get<PaginatedPersons>('/persons', { params })
}

/** 创建人物 */
export function createPerson(data: PersonCreate) {
  return apiClient.post<Person>('/persons', data)
}

/** 获取人物详情 */
export function getPerson(personId: string) {
  return apiClient.get<PersonDetail>(`/persons/${personId}`)
}

/** 更新人物 */
export function updatePerson(personId: string, data: PersonUpdate) {
  return apiClient.put<Person>(`/persons/${personId}`, data)
}

/** 删除人物 */
export function deletePerson(personId: string) {
  return apiClient.delete<void>(`/persons/${personId}`)
}

// ---------- 别名 ----------

/** 获取人物别名列表 */
export function listAliases(personId: string) {
  return apiClient.get<AliasList>(`/persons/${personId}/aliases`)
}

/** 添加别名 */
export function createAlias(personId: string, data: AliasCreate) {
  return apiClient.post<Alias>(`/persons/${personId}/aliases`, data)
}

/** 删除别名 */
export function deleteAlias(personId: string, alias: string) {
  return apiClient.delete<void>(`/persons/${personId}/aliases/${encodeURIComponent(alias)}`)
}

// ---------- 人物-事件关联 ----------

/** 获取人物关联的事件列表 */
export function listPersonEvents(personId: string) {
  return apiClient.get<PersonEventList>(`/persons/${personId}/events`)
}

/** 关联事件到人物 */
export function createPersonEvent(personId: string, data: PersonEventCreate) {
  return apiClient.post<PersonEvent>(`/persons/${personId}/events`, data)
}

/** 更新关联信息 */
export function updatePersonEvent(personEventId: string, data: PersonEventUpdate) {
  return apiClient.put<PersonEvent>(`/person-events/${personEventId}`, data)
}

/** 解除关联 */
export function deletePersonEvent(personEventId: string) {
  return apiClient.delete<void>(`/person-events/${personEventId}`)
}

// ---------- 传记文本 ----------

/** 获取人物传记文本列表 */
export function listBiographyTexts(personId: string) {
  return apiClient.get<BiographyTextList>(`/persons/${personId}/biography`)
}

/** 上传传记文件（TXT/PDF） */
export function uploadBiography(file: File, personId: string) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('person_id', personId)
  return apiClient.post<BiographyText>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/** 删除传记文本 */
export function deleteBiography(biographyId: string) {
  return apiClient.delete<void>(`/biography/${biographyId}`)
}

// ---------- AI 事件抽取 ----------

/** AI 事件抽取 */
export function extractEvents(personId: string, data?: ExtractRequest) {
  return apiClient.post<ExtractResult>(`/persons/${personId}/extract`, data)
}
