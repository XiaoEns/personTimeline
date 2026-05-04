import { Button, Input, Select, Table, Tag, Pagination, message, Modal } from 'antd'
import { useNavigate } from 'react-router-dom'
import { usePersonList } from '@/hooks/usePersonList'
import PersonFormDialog from '@/components/PersonFormDialog'

const STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'published', label: '已发布' },
]

const STATUS_TAG = { draft: 'warning' as const, published: 'success' as const }

export default function PersonList() {
  const navigate = useNavigate()
  const {
    store, search, setSearch, statusFilter, setStatusFilter,
    currentPage, setCurrentPage,
    dialogOpen, editingPersonId,
    openCreate, openEdit, closeDialog, fetchList,
  } = usePersonList()

  const handleDelete = (id: string, name: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除人物「${name}」吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        await store.remove(id)
        message.success('人物已删除')
        fetchList()
      },
    })
  }

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (name: string) => <span className="font-medium">{name}</span>,
    },
    {
      title: '生卒',
      key: 'lifespan',
      width: 180,
      render: (_: unknown, row: { birth_date?: string | null; death_date?: string | null }) =>
        `${row.birth_date?.slice(0, 10) || '未知'} — ${row.death_date?.slice(0, 10) || '未知'}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={STATUS_TAG[status as keyof typeof STATUS_TAG] || 'default'}>
          {STATUS_OPTIONS.find(o => o.value === status)?.label || status}
        </Tag>
      ),
    },
    {
      title: '事件数',
      dataIndex: 'event_count',
      key: 'event_count',
      width: 80,
    },
    {
      title: '创建时间',
      key: 'created_at',
      width: 110,
      render: (_: unknown, row: { created_at: string }) => row.created_at?.slice(0, 10),
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      fixed: 'right' as const,
      render: (_: unknown, row: { id: string; name: string }) => (
        <div className="flex gap-1">
          <Button type="link" size="small" onClick={() => openEdit(row.id)}>编辑</Button>
          <Button type="link" size="small" onClick={() => navigate(`/view/persons/${row.id}`)}>时间轴</Button>
          <Button type="link" size="small" onClick={() => navigate(`/admin/events?person_id=${row.id}&person_name=${row.name}`)}>事件</Button>
          <Button type="link" size="small" danger onClick={() => handleDelete(row.id, row.name)}>删除</Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">人物管理</h2>
        <Button type="primary" onClick={openCreate}>+ 新建人物</Button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <Input
          placeholder="搜索人物姓名..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          allowClear
          style={{ width: 280 }}
        />
        <Select
          placeholder="全部状态"
          value={statusFilter || undefined}
          onChange={v => setStatusFilter(v || '')}
          allowClear
          style={{ width: 140 }}
          onClear={() => setStatusFilter('')}
        >
          <Select.Option value="">全部状态</Select.Option>
          {STATUS_OPTIONS.map(opt => (
            <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
          ))}
        </Select>
      </div>

      <Table
        dataSource={store.list}
        columns={columns}
        rowKey="id"
        loading={store.listLoading}
        pagination={false}
        size="middle"
        locale={{ emptyText: '暂无人物数据' }}
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

      <PersonFormDialog
        open={dialogOpen}
        personId={editingPersonId}
        onClose={closeDialog}
        onSaved={fetchList}
      />
    </div>
  )
}
