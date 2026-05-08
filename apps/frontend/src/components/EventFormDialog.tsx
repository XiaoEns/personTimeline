import { useEffect, useState } from 'react'
import { Modal, Form, Input, Select, DatePicker, Button, Tag, message } from 'antd'
import { useEventStore } from '@/stores/event'
import { listPersons } from '@/api/persons'
import type { EventCreate, EventUpdate, EventType, TimeType, Granularity, PersonListItem } from '@person-timeline/api-types'
import dayjs from 'dayjs'

const EVENT_TYPE_OPTIONS: { label: string; value: EventType }[] = [
  { label: '出生', value: 'BIRTH' },
  { label: '死亡', value: 'DEATH' },
  { label: '教育', value: 'EDUCATION' },
  { label: '仕途', value: 'CAREER' },
  { label: '创作', value: 'CREATION' },
  { label: '历史', value: 'HISTORICAL' },
  { label: '其他', value: 'OTHER' },
]

const TIME_TYPE_OPTIONS: { label: string; value: TimeType }[] = [
  { label: '时间点', value: 'POINT' },
  { label: '时间段', value: 'PERIOD' },
  { label: '模糊', value: 'FUZZY' },
]

const GRANULARITY_OPTIONS: { label: string; value: Granularity }[] = [
  { label: '年', value: 'YEAR' },
  { label: '月', value: 'MONTH' },
  { label: '日', value: 'DAY' },
  { label: '季', value: 'SEASON' },
]

interface EventFormDialogProps {
  open: boolean
  eventId: string | null
  onClose: () => void
  onSaved: () => void
}

export default function EventFormDialog({ open, eventId, onClose, onSaved }: EventFormDialogProps) {
  const store = useEventStore()
  const [form] = Form.useForm()
  const [persons, setPersons] = useState<PersonListItem[]>([])
  const [personsLoading, setPersonsLoading] = useState(false)
  const isCreate = eventId === null

  const fetchPersons = async (search?: string) => {
    setPersonsLoading(true)
    try {
      const res = await listPersons({ page_size: 200, search })
      setPersons(res.items)
    } finally {
      setPersonsLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      if (eventId) {
        // 编辑模式：加载事件详情
        store.fetchById(eventId).then(ev => {
          form.setFieldsValue({
            title: ev.title,
            description: ev.description || '',
            event_type: ev.event_type,
            time_type: ev.time_type,
            granularity: ev.granularity,
            start_date: ev.start_date ? dayjs(ev.start_date) : undefined,
            end_date: ev.end_date ? dayjs(ev.end_date) : undefined,
            display_time: ev.display_time || '',
            location: ev.location || '',
            source: ev.source || '',
            person_ids: ev.persons?.map(p => p.id) || [],
          })
        })
      } else {
        // 创建模式：加载人物列表供选择
        fetchPersons()
        form.resetFields()
        form.setFieldsValue({
          time_type: 'POINT',
          granularity: 'YEAR',
          event_type: 'OTHER',
          person_ids: [],
        })
        store.resetCurrent()
      }
    }
  }, [open, eventId])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()

      if (isCreate) {
        const payload: EventCreate = {
          title: values.title,
          description: values.description || null,
          event_type: values.event_type,
          time_type: values.time_type,
          granularity: values.granularity,
          start_date: values.start_date?.format('YYYY-MM-DD') ?? null,
          end_date: values.end_date?.format('YYYY-MM-DD') ?? null,
          display_time: values.display_time || null,
          location: values.location || null,
          source: values.source || null,
          person_ids: values.person_ids?.length > 0 ? values.person_ids : undefined,
        }
        await store.create(payload)
      } else {
        const updateData: EventUpdate = {
          title: values.title,
          description: values.description || null,
          event_type: values.event_type,
          time_type: values.time_type,
          granularity: values.granularity,
          start_date: values.start_date?.format('YYYY-MM-DD') ?? null,
          end_date: values.end_date?.format('YYYY-MM-DD') ?? null,
          display_time: values.display_time || null,
          location: values.location || null,
          source: values.source || null,
        }
        await store.update(eventId, updateData)
      }
      message.success(isCreate ? '事件创建成功' : '事件更新成功')
      onSaved()
      onClose()
    } catch {
      // validation failed or API error
    }
  }

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该事件吗？此操作不可恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        if (eventId) {
          await store.remove(eventId)
          message.success('事件已删除')
          onSaved()
          onClose()
        }
      },
    })
  }

  return (
    <Modal
      title={isCreate ? '新建事件' : '编辑事件'}
      open={open}
      onCancel={onClose}
      width={640}
      destroyOnClose
      footer={
        <div className="flex items-center justify-between">
          <div>
            {!isCreate && (
              <Button danger onClick={handleDelete}>
                删除
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={onClose}>取消</Button>
            <Button type="primary" loading={store.saving} onClick={handleSave}>
              {store.saving ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      }
    >
      {store.detailLoading ? (
        <div className="flex items-center justify-center py-12 text-gray-400">加载中...</div>
      ) : (
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="事件标题" rules={[{ required: true, message: '请输入事件标题' }]}>
            <Input placeholder="请输入事件标题" />
          </Form.Item>
          <Form.Item name="description" label="事件描述">
            <Input.TextArea rows={3} placeholder="输入事件描述" />
          </Form.Item>
          <div className="grid grid-cols-3 gap-4">
            <Form.Item name="event_type" label="事件类型" rules={[{ required: true }]}>
              <Select>
                {EVENT_TYPE_OPTIONS.map(opt => (
                  <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="time_type" label="时间类型" rules={[{ required: true }]}>
              <Select>
                {TIME_TYPE_OPTIONS.map(opt => (
                  <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="granularity" label="时间粒度" rules={[{ required: true }]}>
              <Select>
                {GRANULARITY_OPTIONS.map(opt => (
                  <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="start_date" label="开始日期" rules={[{ required: true, message: '请选择开始日期' }]}>
              <DatePicker format="YYYY-MM-DD" className="!w-full" placeholder="选择日期" />
            </Form.Item>
            <Form.Item name="end_date" label="结束日期" rules={[{ required: true, message: '请选择结束日期' }]}>
              <DatePicker format="YYYY-MM-DD" className="!w-full" placeholder="选择日期" />
            </Form.Item>
          </div>
          <Form.Item name="display_time" label="显示文本">
            <Input placeholder="如：建安十二年秋" />
          </Form.Item>
          <Form.Item name="location" label="地点">
            <Input placeholder="如：许都" />
          </Form.Item>
          <Form.Item name="source" label="来源">
            <Input placeholder="如：《三国志》" />
          </Form.Item>
          {isCreate ? (
            <Form.Item name="person_ids" label="关联人物">
              <Select
                mode="multiple"
                showSearch
                filterOption={false}
                onSearch={fetchPersons}
                loading={personsLoading}
                placeholder="搜索并选择关联人物"
                notFoundContent="无匹配人物"
              >
                {persons.map(p => (
                  <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          ) : (
            <Form.Item label="关联人物">
              {store.currentEvent?.persons?.length
                ? store.currentEvent.persons.map(p => (
                    <Tag key={p.id} color="blue" className="mr-1 mb-1">
                      {p.name}{p.role ? `（${p.role}）` : ''}
                    </Tag>
                  ))
                : <span className="text-gray-400">无</span>
              }
            </Form.Item>
          )}
        </Form>
      )}
    </Modal>
  )
}
