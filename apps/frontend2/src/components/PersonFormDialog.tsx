import { useEffect, useState } from 'react'
import { Modal, Form, Input, Select, DatePicker, Button, Tag, Divider, message } from 'antd'
import { usePersonStore } from '@/stores/person'
import type { PersonCreate, PersonUpdate } from '@person-timeline/api-types'
import dayjs from 'dayjs'

interface PersonFormDialogProps {
  open: boolean
  personId: string | null
  onClose: () => void
  onSaved: () => void
}

export default function PersonFormDialog({ open, personId, onClose, onSaved }: PersonFormDialogProps) {
  const store = usePersonStore()
  const [form] = Form.useForm()
  const [aliasInput, setAliasInput] = useState('')
  const isCreate = personId === null

  useEffect(() => {
    if (open && personId) {
      store.fetchById(personId).then(person => {
        form.setFieldsValue({
          name: person.name,
          birth_date: person.birth_date ? dayjs(person.birth_date) : undefined,
          death_date: person.death_date ? dayjs(person.death_date) : undefined,
          birth_display: person.birth_display || '',
          death_display: person.death_display || '',
          summary: person.summary || '',
          status: person.status,
        })
      })
    } else if (open) {
      form.resetFields()
      store.resetCurrent()
    }
  }, [open, personId])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const payload: PersonCreate = {
        name: values.name,
        birth_date: values.birth_date?.format('YYYY-MM-DD') ?? null,
        death_date: values.death_date?.format('YYYY-MM-DD') ?? null,
        birth_display: values.birth_display || null,
        death_display: values.death_display || null,
        summary: values.summary || null,
      }

      if (isCreate) {
        await store.create(payload)
      } else {
        const updateData: PersonUpdate = {
          ...payload,
          status: values.status,
        }
        await store.update(personId, updateData)
      }
      message.success(isCreate ? '人物创建成功' : '人物更新成功')
      onSaved()
      onClose()
    } catch {
      // validation failed or API error
    }
  }

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该人物吗？此操作不可恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        if (personId) {
          await store.remove(personId)
          message.success('人物已删除')
          onSaved()
          onClose()
        }
      },
    })
  }

  const handleAddAlias = async () => {
    if (!aliasInput.trim() || !personId) return
    try {
      await store.addAlias(personId, aliasInput.trim())
      setAliasInput('')
      message.success('别名添加成功')
    } catch {
      // error handled by interceptor
    }
  }

  const handleRemoveAlias = (alias: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除别名 "${alias}" 吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        if (personId) {
          await store.removeAlias(personId, alias)
          message.success('别名已删除')
        }
      },
    })
  }

  return (
    <Modal
      title={isCreate ? '新建人物' : '编辑人物'}
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
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
              <Input placeholder="请输入姓名" />
            </Form.Item>
            {!isCreate && (
              <Form.Item name="status" label="状态">
                <Select>
                  <Select.Option value="draft">草稿</Select.Option>
                  <Select.Option value="published">已发布</Select.Option>
                </Select>
              </Form.Item>
            )}
            <Form.Item name="birth_date" label="出生日期">
              <DatePicker format="YYYY-MM-DD" className="!w-full" placeholder="选择日期" />
            </Form.Item>
            <Form.Item name="death_date" label="死亡日期">
              <DatePicker format="YYYY-MM-DD" className="!w-full" placeholder="选择日期" />
            </Form.Item>
            <Form.Item name="birth_display" label="出生显示文本">
              <Input placeholder="如：建安十二年" />
            </Form.Item>
            <Form.Item name="death_display" label="死亡显示文本">
              <Input placeholder="如：建兴十二年" />
            </Form.Item>
          </div>
          <Form.Item name="summary" label="简介">
            <Input.TextArea rows={3} placeholder="输入人物简介" />
          </Form.Item>
        </Form>
      )}

      {!isCreate && (
        <>
          <Divider />
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">别名管理</div>
            <div className="flex gap-2">
              <Input
                value={aliasInput}
                onChange={e => setAliasInput(e.target.value)}
                placeholder="输入别名"
                className="flex-1"
                onPressEnter={handleAddAlias}
              />
              <Button onClick={handleAddAlias}>添加</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {store.aliases.length > 0 ? (
                store.aliases.map(alias => (
                  <Tag
                    key={alias}
                    closable
                    onClose={() => handleRemoveAlias(alias)}
                  >
                    {alias}
                  </Tag>
                ))
              ) : (
                <span className="text-sm text-gray-400">暂无别名</span>
              )}
            </div>
          </div>
        </>
      )}
    </Modal>
  )
}
