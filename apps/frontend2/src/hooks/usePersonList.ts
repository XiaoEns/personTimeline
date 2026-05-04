import { useState, useEffect, useCallback, useRef } from 'react'
import { usePersonStore } from '@/stores/person'

export function usePersonList() {
  const store = usePersonStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const fetchList = useCallback(() => {
    store.fetchList({
      page: currentPage,
      page_size: store.pageSize,
      search: search || undefined,
      status: (statusFilter || undefined) as 'draft' | 'published' | undefined,
    })
  }, [currentPage, search, statusFilter])

  useEffect(() => {
    clearTimeout(searchTimerRef.current)
    setCurrentPage(1)
    searchTimerRef.current = setTimeout(fetchList, 300)
    return () => clearTimeout(searchTimerRef.current)
  }, [search, statusFilter])

  useEffect(() => {
    fetchList()
  }, [currentPage])

  const openCreate = useCallback(() => {
    setEditingPersonId(null)
    setDialogOpen(true)
  }, [])

  const openEdit = useCallback((id: string) => {
    setEditingPersonId(id)
    setDialogOpen(true)
  }, [])

  const closeDialog = useCallback(() => {
    setDialogOpen(false)
  }, [])

  return {
    store,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    dialogOpen,
    editingPersonId,
    openCreate,
    openEdit,
    closeDialog,
    fetchList,
  }
}
