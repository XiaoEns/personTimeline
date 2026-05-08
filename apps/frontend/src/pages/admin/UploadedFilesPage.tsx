import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Table, Tag, Pagination, Upload, Popconfirm, message } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType, TableProps } from 'antd/es/table'
import { useUploadStore } from '@/stores/upload'
import PersonSearchSelect from '@/components/PersonSearchSelect'
import type { UploadedFileItem, FileStatus } from '@person-timeline/api-types'

/** 文件状态 → Tag 颜色 + 中文文本 */
const FILE_STATUS_CONFIG: Record<FileStatus, { label: string; color: string }> = {
  uploaded:   { label: '已上传', color: 'blue' },
  chunking:   { label: '切片中', color: 'orange' },
  chunked:    { label: '已切片', color: 'green' },
  extracting: { label: '抽取中', color: 'purple' },
  completed:  { label: '已完成', color: 'success' },
  error:      { label: '失败',   color: 'red' },
}

/** 文件类型 → Tag 颜色 + 标签 */
const FILE_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  txt: { label: 'TXT', color: 'blue' },
  pdf: { label: 'PDF', color: 'green' },
}

/** 状态列筛选选项，从 FILE_STATUS_CONFIG 派生 */
const STATUS_FILTERS = (
  Object.entries(FILE_STATUS_CONFIG) as [FileStatus, { label: string; color: string }][]
).map(([value, { label }]) => ({ text: label, value }))

/** 格式化文件大小：字节 → B / KB / MB */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function UploadedFilesPage() {
  const navigate = useNavigate()
  const store = useUploadStore()

  // 本地筛选与分页状态
  const [selectedPersonId, setSelectedPersonId] = useState<string | undefined>(undefined)
  const [statusFilter, setStatusFilter] = useState<FileStatus | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [dragOver, setDragOver] = useState(false)

  /** 记录上次请求的依赖 key，跳过 StrictMode 双挂载导致的重复请求 */
  const lastFetchKeyRef = useRef<string | null>(null)

  /** 筛选 / 分页变化时获取数据 */
  useEffect(() => {
    const key = `${currentPage}|${selectedPersonId ?? ''}|${statusFilter ?? ''}`
    if (lastFetchKeyRef.current === key) return
    store.fetchFiles({
      page: currentPage,
      page_size: store.pageSize,
      person_id: selectedPersonId,
      status: statusFilter,
    })
    return () => { lastFetchKeyRef.current = key }
  }, [currentPage, selectedPersonId, statusFilter])

  // ── 事件处理 ──

  /** 人物筛选变更 → 重置页码 */
  const handlePersonChange = useCallback((personId: string | undefined) => {
    setSelectedPersonId(personId)
    setCurrentPage(1)
  }, [])

  /** 分页变更 */
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  /** Table 筛选变更（status 列头） */
  const handleTableChange: TableProps<UploadedFileItem>['onChange'] = useCallback(
    (_pagination, filters) => {
      const newStatus = (filters.status?.[0] as FileStatus) || undefined
      setStatusFilter(newStatus)
      setCurrentPage(1)
    },
    [],
  )

  /** 刷新文件列表 */
  const handleRefresh = useCallback(() => {
    store.fetchFiles({ page: currentPage, page_size: store.pageSize, person_id: selectedPersonId, status: statusFilter })
  }, [store, currentPage, selectedPersonId, statusFilter])

  /** 删除文件 */
  const handleDelete = useCallback(async (record: UploadedFileItem) => {
    await store.deleteFile(record.id)
    message.success('文件已删除')
  }, [store])

  /** 触发事件抽取 */
  const handleExtract = useCallback(async (fileId: string) => {
    try {
      await store.triggerExtract(fileId)
    } catch {
      // store 中已处理 error（清除 extracting）
    }
  }, [store])

  /** 触发文件切片（用于 uploaded / error 状态） */
  const handleTriggerChunk = useCallback(async (fileId: string) => {
    try {
      await store.triggerChunk(fileId)
    } catch {
      // store 中已处理 error
    }
  }, [store])

  /** 跳转切片列表页 */
  const handleViewChunks = useCallback((fileId: string) => {
    navigate(`/admin/upload/${fileId}/chunks`)
  }, [navigate])

  // ── 拖拽处理 ──

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (!file) return
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (!ext || !['txt', 'pdf'].includes(ext)) {
        message.error('仅支持 .txt 和 .pdf 格式')
        return
      }
      store.uploadFile(file, selectedPersonId)
    },
    [selectedPersonId, store],
  )

  // ── 表格列定义 ──

  const columns: ColumnsType<UploadedFileItem> = [
    {
      title: '文件名',
      dataIndex: 'original_name',
      key: 'original_name',
      width: 200,
      ellipsis: true,
      render: (name: string) => (
        <span className="font-medium" title={name}>{name}</span>
      ),
    },
    {
      title: '文件大小',
      dataIndex: 'file_size',
      key: 'file_size',
      width: 110,
      render: (size: number) => formatFileSize(size),
    },
    {
      title: '文件类型',
      dataIndex: 'file_type',
      key: 'file_type',
      width: 100,
      render: (type: string) => {
        const cfg = FILE_TYPE_CONFIG[type] || { label: type.toUpperCase(), color: 'default' }
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: '关联人物',
      dataIndex: 'person_name',
      key: 'person_name',
      width: 120,
      render: (name: string | undefined) => name || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      filters: STATUS_FILTERS,
      filteredValue: statusFilter ? [statusFilter] : null,
      filterMultiple: false,
      render: (status: FileStatus) => {
        const cfg = FILE_STATUS_CONFIG[status] || { label: status, color: 'default' }
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (date: string) => date?.slice(0, 19).replace('T', ' '),
    },
    {
      title: '操作',
      key: 'actions',
      width: 260,
      fixed: 'right',
      render: (_: unknown, record: UploadedFileItem) => {
        // 抽取按钮：仅 chunked / extracting / completed 状态下显示
        const showExtract =
          record.status === 'chunked' ||
          record.status === 'extracting' ||
          record.status === 'completed'
        // 抽取按钮仅 chunked 状态下可点击
        const extractDisabled = record.status !== 'chunked'

        // 切片按钮：uploaded / error 触发切片操作，其余状态跳转切片页
        const isSliceTrigger =
          record.status === 'uploaded' || record.status === 'error'

        return (
          <div className="flex gap-1">
            {showExtract && (
              <Button
                type="link"
                size="small"
                disabled={extractDisabled}
                onClick={() => handleExtract(record.id)}
              >
                事件抽取
              </Button>
            )}
            <Button
              type="link"
              size="small"
              onClick={() =>
                isSliceTrigger
                  ? handleTriggerChunk(record.id)
                  : handleViewChunks(record.id)
              }
            >
              切片
            </Button>
            <Popconfirm
              title="确认删除"
              description={`确定要删除文件「${record.original_name}」吗？此操作不可恢复。`}
              onConfirm={() => handleDelete(record)}
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button type="link" size="small" danger>
                删除
              </Button>
            </Popconfirm>
          </div>
        )
      },
    },
  ]

  // ── JSX ──

  return (
    <div
      className="space-y-4"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">上传与抽取</h2>
      </div>

      {/* 工具栏：人物搜索 + 刷新 + 上传按钮 */}
      <div className="flex items-center justify-between gap-4">
        <div style={{ width: 420 }}>
          <PersonSearchSelect
            value={selectedPersonId}
            onChange={handlePersonChange}
            placeholder="选择人物"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>刷新</Button>
          <Upload
          accept=".txt,.pdf"
          showUploadList={false}
          disabled={store.uploading}
          customRequest={async ({ file, onSuccess, onError }) => {
            const ext = (file as File).name.split('.').pop()?.toLowerCase()
            if (!ext || !['txt', 'pdf'].includes(ext)) {
              message.error('仅支持 .txt 和 .pdf 格式')
              onError?.(new Error('不支持的文件格式'))
              return
            }
            try {
              await store.uploadFile(file as File, selectedPersonId)
              onSuccess?.('ok')
              message.success('上传成功')
            } catch (err) {
              onError?.(err as Error)
            }
          }}
        >
          <Button loading={store.uploading}>上传文件</Button>
        </Upload>
        </div>
      </div>

      {/* 上传中提示 */}
      {store.uploading && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600" />
          正在上传文件...
        </div>
      )}

      {/* 文件列表表格 */}
      <Table
        dataSource={store.files}
        columns={columns}
        rowKey="id"
        loading={store.loading}
        pagination={false}
        size="middle"
        locale={{ emptyText: '暂无上传文件' }}
        onChange={handleTableChange}
        scroll={{ x: 1100 }}
      />

      {/* 分页 */}
      {store.total > store.pageSize && (
        <div className="mt-4 flex justify-end">
          <Pagination
            current={currentPage}
            pageSize={store.pageSize}
            total={store.total}
            showTotal={(total) => `共 ${total} 条`}
            onChange={handlePageChange}
            showSizeChanger={false}
          />
        </div>
      )}

      {/* 拖拽上传遮罩 */}
      {dragOver && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <div className="rounded-xl border-2 border-dashed border-blue-500 bg-blue-50/90 px-12 py-8 shadow-lg">
            <p className="text-lg font-medium text-blue-600">释放文件以上传</p>
            <p className="mt-1 text-sm text-blue-400">支持 .txt .pdf 格式</p>
          </div>
        </div>
      )}
    </div>
  )
}
