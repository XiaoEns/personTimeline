import apiClient from './client'
import type {
  Event,
  EventCreate,
  EventUpdate,
  EventDetail,
  PaginatedEvents,
  ListEventsParams,
} from '@person-timeline/api-types'

/** 获取事件列表（分页 + 筛选） */
export function listEvents(params?: ListEventsParams) {
  return apiClient.get<PaginatedEvents>('/events', { params })
}

/** 创建事件 */
export function createEvent(data: EventCreate) {
  return apiClient.post<EventDetail>('/events', data)
}

/** 获取事件详情 */
export function getEvent(eventId: string) {
  return apiClient.get<EventDetail>(`/events/${eventId}`)
}

/** 更新事件 */
export function updateEvent(eventId: string, data: EventUpdate) {
  return apiClient.put<EventDetail>(`/events/${eventId}`, data)
}

/** 删除事件 */
export function deleteEvent(eventId: string) {
  return apiClient.delete<void>(`/events/${eventId}`)
}
