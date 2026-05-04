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
  return apiClient.get<PaginatedPersons>('/persons', { params }).then(r => r.data)
}

/** 创建人物 */
export function createPerson(data: PersonCreate) {
  return apiClient.post<Person>('/persons', data).then(r => r.data)
}

/** 获取人物详情 */
export function getPerson(personId: string) {
  return apiClient.get<PersonDetail>(`/persons/${personId}`).then(r => r.data)
}

/** 更新人物 */
export function updatePerson(personId: string, data: PersonUpdate) {
  return apiClient.put<Person>(`/persons/${personId}`, data).then(r => r.data)
}

/** 删除人物 */
export function deletePerson(personId: string) {
  return apiClient.delete<void>(`/persons/${personId}`).then(r => r.data)
}

/** 获取别名列表 */
export function listAliases(personId: string) {
  return apiClient.get<AliasList>(`/persons/${personId}/aliases`).then(r => r.data)
}

/** 创建别名 */
export function createAlias(personId: string, data: AliasCreate) {
  return apiClient.post<Alias>(`/persons/${personId}/aliases`, data).then(r => r.data)
}

/** 删除别名 */
export function deleteAlias(personId: string, alias: string) {
  return apiClient.delete<void>(`/persons/${personId}/aliases/${encodeURIComponent(alias)}`).then(r => r.data)
}

/** 获取人物事件关联列表 */
export function listPersonEvents(personId: string) {
  return apiClient.get<PersonEventList>(`/persons/${personId}/events`).then(r => r.data)
}

/** 创建人物事件关联 */
export function createPersonEvent(personId: string, data: PersonEventCreate) {
  return apiClient.post<PersonEvent>(`/persons/${personId}/events`, data).then(r => r.data)
}

/** 更新人物事件关联 */
export function updatePersonEvent(personEventId: string, data: PersonEventUpdate) {
  return apiClient.put<PersonEvent>(`/person-events/${personEventId}`, data).then(r => r.data)
}

/** 删除人物事件关联 */
export function deletePersonEvent(personEventId: string) {
  return apiClient.delete<void>(`/person-events/${personEventId}`).then(r => r.data)
}

/** 获取传记文本列表 */
export function listBiographyTexts(personId: string) {
  return apiClient.get<BiographyTextList>(`/persons/${personId}/biography`).then(r => r.data)
}

/** 上传传记文件 */
export function uploadBiography(file: File, personId: string) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('person_id', personId)
  return apiClient.post<BiographyText>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)
}

/** 删除传记文本 */
export function deleteBiography(biographyId: string) {
  return apiClient.delete<void>(`/biography/${biographyId}`).then(r => r.data)
}

/** AI 事件抽取 */
export function extractEvents(personId: string, data?: ExtractRequest) {
  return apiClient.post<ExtractResult>(`/persons/${personId}/extract`, data).then(r => r.data)
}
