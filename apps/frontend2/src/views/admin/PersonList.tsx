import { useEffect, useState, useCallback } from 'react'
import { Button, Input, Select, Table, Tag, Pagination, message, Modal } from 'antd'
import { usePersonStore } from '@/stores/person'
import PersonFormDialog from '@/components/PersonFormDialog'
import { useNavigate } from 'react-router-dom'

export default function PersonList() {
  const store = usePersonStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null)

  const fetchList = useCallback(() => {
    store.fetchList({
      page: currentPage,
      page_size: store.pageSize,
      search: search || undefined,
      status: (statusFilter || undefined) as 'draft' | 'published' | undefined,
    })
  }, [currentPage, search, statusFilter])

  useEffect(() => {
    const timer = setTimeout(fetchList, 300)
    return () => clearTimeout(timer)
  }, [search, statusFilter])

  useEffect(() => {
    fetchList()
  }, [currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter])

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

  const openCreate = () => {
    setEditingPersonId(null)
    setDialogOpen(true)
  }

  const openEdit = (id: string) => {
    setEditingPersonId(id)
    setDialogOpen(true)
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
        <Tag color={status === 'published' ? 'success' : 'warning'} className="!m-0">
          {status === 'published' ? '已发布' : '草稿'}
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
          <Button type="link" size="small" onClick={() => openEdit(row.id)}>
            编辑
          </Button>
          <Button type="link" size="small" onClick={() => navigate(`/view/persons/${row.id}`)}>
            时间轴
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => navigate(`/admin/events?person_id=${row.id}&person_name=${row.name}`)}
          >
            事件
          </Button>
          <Button type="link" size="small" danger onClick={() => handleDelete(row.id, row.name)}>
            删除
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">人物管理</h2>
        <Button type="primary" onClick={openCreate}>
          + 新建人物
        </Button>
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
          <Select.Option value="draft">草稿</Select.Option>
          <Select.Option value="published">已发布</Select.Option>
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
            onChange={p => setCurrentPage(p)}
            showSizeChanger={false}
          />
        </div>
      )}

      <PersonFormDialog
        open={dialogOpen}
        personId={editingPersonId}
        onClose={() => setDialogOpen(false)}
        onSaved={fetchList}
      />
    </div>
  )
}
