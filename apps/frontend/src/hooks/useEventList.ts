import { useState, useEffect, useCallback, useRef } from 'react'
import { useEventStore } from '@/stores/event'
import { useSearchParams } from 'react-router-dom'

export function useEventList() {
  const store = useEventStore()
  const [searchParams, setSearchParams] = useSearchParams()
  // 从 URL 参数直接初始化，避免额外 useEffect 触发重复请求
  const initialPersonId = searchParams.get('person_id') || undefined
  const initialPersonName = searchParams.get('person_name') || undefined

  const [search, setSearch] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState('')
  const [timeTypeFilter, setTimeTypeFilter] = useState('')
  const [personIdFilter, setPersonIdFilter] = useState<string | undefined>(initialPersonId)
  const [personNameFilter, setPersonNameFilter] = useState<string | undefined>(initialPersonName)
  const [currentPage, setCurrentPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const lastKeyRef = useRef<string | null>(null)

  const fetchData = useCallback(() => {
    store.fetchList({
      page: currentPage,
      page_size: store.pageSize,
      search: search || undefined,
      event_type: (eventTypeFilter || undefined) as any,
      time_type: (timeTypeFilter || undefined) as any,
      person_id: personIdFilter,
    })
  }, [currentPage, search, eventTypeFilter, timeTypeFilter, personIdFilter])

  // 数据获取：筛选变更时 300ms 防抖，翻页时立即请求；cleanup 记录 key 防止 StrictMode 重复
  useEffect(() => {
    const key = `${currentPage}|${search}|${eventTypeFilter}|${timeTypeFilter}|${personIdFilter ?? ''}`
    if (lastKeyRef.current === key) return

    const prevFilter = lastKeyRef.current?.split('|').slice(1).join('|')
    const currFilter = key.split('|').slice(1).join('|')
    const pageOnly = lastKeyRef.current !== null && prevFilter === currFilter

    clearTimeout(debounceRef.current)
    if (pageOnly) {
      fetchData()
    } else {
      debounceRef.current = setTimeout(fetchData, 300)
    }

    return () => { lastKeyRef.current = key }
  }, [currentPage, search, eventTypeFilter, timeTypeFilter, personIdFilter])

  const clearPersonFilter = useCallback(() => {
    setPersonIdFilter(undefined)
    setPersonNameFilter(undefined)
    setCurrentPage(1)
    setSearchParams({})
  }, [])

  const openCreate = useCallback(() => {
    setEditingEventId(null)
    setDialogOpen(true)
  }, [])

  const openEdit = useCallback((id: string) => {
    setEditingEventId(id)
    setDialogOpen(true)
  }, [])

  const closeDialog = useCallback(() => {
    setDialogOpen(false)
  }, [])

  return {
    store,
    search, setSearch,
    eventTypeFilter, setEventTypeFilter,
    timeTypeFilter, setTimeTypeFilter,
    personIdFilter, personNameFilter,
    currentPage, setCurrentPage,
    dialogOpen, editingEventId,
    openCreate, openEdit, closeDialog,
    clearPersonFilter,
    fetchData,
  }
}
