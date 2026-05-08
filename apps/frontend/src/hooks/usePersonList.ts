import { useState, useEffect, useCallback, useRef } from 'react'
import { usePersonStore } from '@/stores/person'

export function usePersonList() {
  const store = usePersonStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const lastKeyRef = useRef<string | null>(null)

  const fetchList = useCallback(() => {
    store.fetchList({
      page: currentPage,
      page_size: store.pageSize,
      search: search || undefined,
      status: (statusFilter || undefined) as 'draft' | 'published' | undefined,
    })
  }, [currentPage, search, statusFilter])

  // 数据获取：筛选变更时 300ms 防抖，翻页时立即请求；cleanup 记录 key 防止 StrictMode 重复
  useEffect(() => {
    const key = `${currentPage}|${search}|${statusFilter}`
    if (lastKeyRef.current === key) return

    const prevFilter = lastKeyRef.current?.split('|').slice(1).join('|')
    const currFilter = key.split('|').slice(1).join('|')
    const pageOnly = lastKeyRef.current !== null && prevFilter === currFilter

    clearTimeout(debounceRef.current)
    if (pageOnly) {
      fetchList()
    } else {
      debounceRef.current = setTimeout(fetchList, 300)
    }

    return () => { lastKeyRef.current = key }
  }, [currentPage, search, statusFilter])

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
