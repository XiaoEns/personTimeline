import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { getUploadedFile, getChunks, getChunkText } from '@/api/upload'
import type { UploadedFileDetail, ChunkItem } from '@person-timeline/api-types'

export default function ChunkListPage() {
  const { fileId } = useParams<{ fileId: string }>()
  const navigate = useNavigate()

  const [fileInfo, setFileInfo] = useState<UploadedFileDetail | null>(null)
  const [chunks, setChunks] = useState<ChunkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [chunkTexts, setChunkTexts] = useState<Record<string, string>>({})
  const [loadingTexts, setLoadingTexts] = useState<Record<string, boolean>>({})
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())

  /** 挂载时并行获取文件信息和切片列表 */
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [file, chunkList] = await Promise.all([
          getUploadedFile(fileId!),
          getChunks(fileId!),
        ])
        if (!cancelled) {
          setFileInfo(file)
          setChunks(chunkList.items)
        }
      } catch {
        if (!cancelled) message.error('加载切片数据失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [fileId])

  /** 行展开/折叠：展开时懒加载切片文本 */
  const handleExpand = useCallback(
    async (expanded: boolean, record: ChunkItem) => {
      if (!expanded) {
        setExpandedKeys(prev => {
          const next = new Set(prev)
          next.delete(record.id)
          return next
        })
        return
      }
      setExpandedKeys(prev => new Set(prev).add(record.id))
      // 已缓存则跳过请求
      if (chunkTexts[record.id]) return
      setLoadingTexts(prev => ({ ...prev, [record.id]: true }))
      try {
        const res = await getChunkText(record.id)
        setChunkTexts(prev => ({ ...prev, [record.id]: res.raw_text }))
      } catch {
        message.error('加载切片文本失败')
      } finally {
        setLoadingTexts(prev => ({ ...prev, [record.id]: false }))
      }
    },
    [chunkTexts],
  )

  const columns: ColumnsType<ChunkItem> = [
    {
      title: '序号',
      key: 'chunk_index',
      width: 80,
      render: (_: unknown, __: ChunkItem, index: number) => index + 1,
    },
    {
      title: '文本长度',
      dataIndex: 'text_length',
      key: 'text_length',
      width: 100,
      render: (len: number) => `${len} 字符`,
    },
    {
      title: '页码',
      dataIndex: 'page',
      key: 'page',
      width: 80,
      render: (page: number | null) => (page != null ? `第 ${page} 页` : '-'),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (date: string) => date?.slice(0, 19).replace('T', ' '),
    },
  ]

  return (
    <div>
      {/* 头部：文件信息 + 返回按钮 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">
            切片列表
            {fileInfo && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                — {fileInfo.original_name}（共 {fileInfo.chunk_count} 个切片）
              </span>
            )}
          </h2>
        </div>
        <Button onClick={() => navigate('/admin/upload')}>返回列表</Button>
      </div>

      {/* 切片表格 */}
      <Table
        dataSource={chunks}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="middle"
        locale={{ emptyText: '暂无切片数据' }}
        expandable={{
          expandedRowKeys: [...expandedKeys],
          onExpand: handleExpand,
          expandedRowRender: (record: ChunkItem) => {
            if (loadingTexts[record.id]) {
              return (
                <div className="py-4 text-center text-gray-400">加载中...</div>
              )
            }
            const text = chunkTexts[record.id]
            if (!text) return null
            return (
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-4 text-sm leading-relaxed">
                {text}
              </pre>
            )
          },
        }}
      />
    </div>
  )
}
