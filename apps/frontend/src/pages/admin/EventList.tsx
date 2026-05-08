import { Button, Input, Select, Table, Tag, Pagination, message, Modal } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useEventList } from '@/hooks/useEventList'
import EventFormDialog from '@/components/EventFormDialog'

const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  BIRTH: { label: '出生', color: 'success' },
  DEATH: { label: '死亡', color: 'danger' },
  EDUCATION: { label: '教育', color: 'processing' },
  CAREER: { label: '仕途', color: 'warning' },
  CREATION: { label: '创作', color: 'purple' },
  HISTORICAL: { label: '历史', color: 'geekblue' },
  OTHER: { label: '其他', color: 'default' },
}

const TIME_TYPE_LABEL: Record<string, string> = {
  POINT: '时间点',
  PERIOD: '时间段',
  FUZZY: '模糊',
}

export default function EventList() {
  const {
    store, search, setSearch,
    eventTypeFilter, setEventTypeFilter,
    timeTypeFilter, setTimeTypeFilter,
    personNameFilter,
    currentPage, setCurrentPage,
    dialogOpen, editingEventId,
    openCreate, openEdit, closeDialog,
    clearPersonFilter, fetchData,
  } = useEventList()

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
      render: (type: string) => {
        const cfg = EVENT_TYPE_CONFIG[type] || { label: type, color: 'default' }
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      },
    },
    {
      title: '时间',
      dataIndex: 'time_type',
      key: 'time_type',
      width: 100,
      render: (type: string) => <Tag>{TIME_TYPE_LABEL[type] || type}</Tag>,
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
          <Button type="link" size="small" onClick={() => openEdit(row.id)}>编辑</Button>
          <Button type="link" size="small" danger onClick={() => handleDelete(row.id, row.title)}>删除</Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">事件管理</h2>
        <div className="flex items-center gap-2">
          <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
          <Button type="primary" onClick={openCreate}>+ 新建事件</Button>
        </div>
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
          {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => (
            <Select.Option key={key} value={key}>{cfg.label}</Select.Option>
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
          {Object.entries(TIME_TYPE_LABEL).map(([key, label]) => (
            <Select.Option key={key} value={key}>{label}</Select.Option>
          ))}
        </Select>
        {personNameFilter && (
          <Tag closable color="blue" onClose={clearPersonFilter}>
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
            onChange={setCurrentPage}
            showSizeChanger={false}
          />
        </div>
      )}

      <EventFormDialog
        open={dialogOpen}
        eventId={editingEventId}
        onClose={closeDialog}
        onSaved={fetchData}
      />
    </div>
  )
}
