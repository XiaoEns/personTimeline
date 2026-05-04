import { useEffect, useState, useCallback } from 'react'
import { Button, Input, Select, Table, Tag, Pagination, message, Modal } from 'antd'
import { useEventStore } from '@/stores/event'
import EventFormDialog from '@/components/EventFormDialog'
import { useSearchParams } from 'react-router-dom'

const EVENT_TYPE_LABELS: Record<string, string> = {
  BIRTH: '出生',
  DEATH: '死亡',
  EDUCATION: '教育',
  CAREER: '仕途',
  CREATION: '创作',
  HISTORICAL: '历史',
  OTHER: '其他',
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  BIRTH: 'success',
  DEATH: 'danger',
  EDUCATION: 'processing',
  CAREER: 'warning',
  CREATION: 'purple',
  HISTORICAL: 'geekblue',
  OTHER: 'default',
}

const TIME_TYPE_LABELS: Record<string, string> = {
  POINT: '时间点',
  PERIOD: '时间段',
  FUZZY: '模糊',
}

export default function EventList() {
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
    const timer = setTimeout(() => {
      setCurrentPage(1)
      fetchData()
    }, 300)
    return () => clearTimeout(timer)
  }, [search, eventTypeFilter, timeTypeFilter])

  useEffect(() => {
    fetchData()
  }, [currentPage, personIdFilter])

  const clearPersonFilter = () => {
    setPersonIdFilter(undefined)
    setPersonNameFilter(undefined)
    setCurrentPage(1)
    setSearchParams({})
  }

  const handleDelete = (id: string, title: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除事件「${title}」吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        await store.remove(id)
        message.success('事件已删除')
        fetchData()
      },
    })
  }

  const columns = [
    {
      title: '事件标题',
      dataIndex: 'title',
      key: 'title',
      width: 160,
      render: (title: string) => <span className="font-medium">{title}</span>,
    },
    {
      title: '类型',
      dataIndex: 'event_type',
      key: 'event_type',
      width: 90,
      render: (type: string) => (
        <Tag color={EVENT_TYPE_COLORS[type] || 'default'}>{EVENT_TYPE_LABELS[type] || type}</Tag>
      ),
    },
    {
      title: '时间',
      dataIndex: 'time_type',
      key: 'time_type',
      width: 100,
      render: (type: string) => (
        <Tag>{TIME_TYPE_LABELS[type] || type}</Tag>
      ),
    },
    {
      title: '关联人物',
      key: 'persons',
      width: 140,
      render: (_: unknown, row: { persons?: { id: string; name: string }[] }) =>
        row.persons && row.persons.length > 0
          ? row.persons.map(p => p.name).join('、')
          : '-',
    },
    {
      title: '排序日期',
      key: 'sort_date',
      width: 110,
      render: (_: unknown, row: { sort_date?: string | null }) => row.sort_date?.slice(0, 10),
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      fixed: 'right' as const,
      render: (_: unknown, row: { id: string; title: string }) => (
        <div className="flex gap-1">
          <Button type="link" size="small" onClick={() => { setEditingEventId(row.id); setDialogOpen(true) }}>
            编辑
          </Button>
          <Button type="link" size="small" danger onClick={() => handleDelete(row.id, row.title)}>
            删除
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">事件管理</h2>
        <Button type="primary" onClick={() => { setEditingEventId(null); setDialogOpen(true) }}>
          + 新建事件
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <Input
          placeholder="搜索事件标题..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          allowClear
          style={{ width: 280 }}
        />
        <Select
          placeholder="全部类型"
          value={eventTypeFilter || undefined}
          onChange={v => setEventTypeFilter(v || '')}
          allowClear
          style={{ width: 140 }}
          onClear={() => setEventTypeFilter('')}
        >
          <Select.Option value="">全部类型</Select.Option>
          {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
            <Select.Option key={key} value={key}>{label}</Select.Option>
          ))}
        </Select>
        <Select
          placeholder="全部时间类型"
          value={timeTypeFilter || undefined}
          onChange={v => setTimeTypeFilter(v || '')}
          allowClear
          style={{ width: 150 }}
          onClear={() => setTimeTypeFilter('')}
        >
          <Select.Option value="">全部时间类型</Select.Option>
          {Object.entries(TIME_TYPE_LABELS).map(([key, label]) => (
            <Select.Option key={key} value={key}>{label}</Select.Option>
          ))}
        </Select>
        {personNameFilter && (
          <Tag
            closable
            color="blue"
            onClose={clearPersonFilter}
          >
            筛选：{personNameFilter}
          </Tag>
        )}
      </div>

      <Table
        dataSource={store.list}
        columns={columns}
        rowKey="id"
        loading={store.listLoading}
        pagination={false}
        size="middle"
        locale={{ emptyText: '暂无事件数据' }}
      />

      {store.total > store.pageSize && (
        <div className="mt-4 flex justify-end">
          <Pagination
            current={currentPage}
            pageSize={store.pageSize}
            total={store.total}
            showTotal={total => `共 ${total} 条`}
            onChange={p => setCurrentPage(p)}
            showSizeChanger={false}
          />
        </div>
      )}

      <EventFormDialog
        open={dialogOpen}
        eventId={editingEventId}
        onClose={() => setDialogOpen(false)}
        onSaved={fetchData}
      />
    </div>
  )
}
