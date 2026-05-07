import { useState, useEffect, useCallback, useRef } from 'react'
import { useEventStore } from '@/stores/event'
import { useSearchParams } from 'react-router-dom'

export function useEventList() {
  const store = useEventStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState('')
  const [timeTypeFilter, setTimeTypeFilter] = useState('')
  const [personIdFilter, setPersonIdFilter] = useState<string | undefined>(undefined)
  const [personNameFilter, setPersonNameFilter] = useState<string | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const pid = searchParams.get('person_id')
    const pname = searchParams.get('person_name')
    if (pid) setPersonIdFilter(pid)
    if (pname) setPersonNameFilter(pname)
  }, [])

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

  useEffect(() => {
    clearTimeout(searchTimerRef.current)
    setCurrentPage(1)
    searchTimerRef.current = setTimeout(fetchData, 300)
    return () => clearTimeout(searchTimerRef.current)
  }, [search, eventTypeFilter, timeTypeFilter])

  useEffect(() => {
    fetchData()
  }, [currentPage, personIdFilter])

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
