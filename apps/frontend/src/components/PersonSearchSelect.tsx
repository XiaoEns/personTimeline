import { useState, useRef, useCallback, useEffect } from 'react'
import { Select } from 'antd'
import { listPersons } from '@/api/persons'
import type { ListPersonsParams } from '@person-timeline/api-types'

interface PersonSearchSelectProps {
  /** 当前选中的人物 ID */
  value?: string
  /** 选中变更回调 */
  onChange?: (personId: string | undefined) => void
  /** 占位文本 */
  placeholder?: string
}

interface Option {
  label: string
  value: string
}

/** 人物搜索选择器 — 服务端搜索、300ms 防抖、单选、可清空 */
export default function PersonSearchSelect({
  value,
  onChange,
  placeholder = '选择人物',
}: PersonSearchSelectProps) {
  const [options, setOptions] = useState<Option[]>([])
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /** 服务端搜索，300ms 防抖 */
  const handleSearch = useCallback((keyword: string) => {
    // 清除旧定时器
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    // 空关键字 → 清空选项
    if (!keyword.trim()) {
      setOptions([])
      setLoading(false)
      return
    }

    setLoading(true)

    timerRef.current = setTimeout(async () => {
      try {
        const params: ListPersonsParams = { search: keyword.trim(), page_size: 20 }
        const res = await listPersons(params)
        setOptions(res.items.map(p => ({ label: p.name, value: p.id })))
      } catch {
        // 搜索失败静默处理，不清空已有选项
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [])

  /** 选中变更 */
  const handleChange = useCallback(
    (selectedId: string | undefined) => {
      onChange?.(selectedId)
    },
    [onChange],
  )

  /** 清空选择 */
  const handleClear = useCallback(() => {
    onChange?.(undefined)
  }, [onChange])

  /** 组件卸载时清除定时器 */
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return (
    <Select
      showSearch
      value={value}
      onChange={handleChange}
      onClear={handleClear}
      onSearch={handleSearch}
      filterOption={false}
      allowClear
      loading={loading}
      placeholder={placeholder}
      options={options}
      notFoundContent={loading ? '搜索中...' : '输入关键字搜索人物'}
    />
  )
}
