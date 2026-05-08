import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Table, message, Modal } from 'antd'
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
  const [modalOpen, setModalOpen] = useState(false)
  const [modalText, setModalText] = useState('')
  const [modalLoading, setModalLoading] = useState(false)

  /** 记录已加载的 fileId，跳过 StrictMode 重复挂载导致的二次请求 */
  const loadedFileIdRef = useRef<string | null>(null)

  /** 挂载时并行获取文件信息和切片列表 */
  useEffect(() => {
    if (loadedFileIdRef.current === fileId) return
    async function load() {
      setLoading(true)
      try {
        const [file, chunkList] = await Promise.all([
          getUploadedFile(fileId!),
          getChunks(fileId!),
        ])
        setFileInfo(file)
        setChunks(chunkList.items)
      } catch {
        message.error('加载切片数据失败')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { loadedFileIdRef.current = fileId! }
  }, [fileId])

  /** 点击查看：懒加载切片文本并以弹窗展示 */
  const handleView = useCallback(
    async (record: ChunkItem) => {
      // 已缓存直接展示
      if (chunkTexts[record.id]) {
        setModalText(chunkTexts[record.id])
        setModalOpen(true)
        return
      }
      setModalLoading(true)
      setModalOpen(true)
      try {
        const res = await getChunkText(record.id)
        setChunkTexts(prev => ({ ...prev, [record.id]: res.raw_text }))
        setModalText(res.raw_text)
      } catch {
        message.error('加载切片文本失败')
        setModalOpen(false)
      } finally {
        setModalLoading(false)
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
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: ChunkItem) => (
        <Button type="link" size="small" onClick={() => handleView(record)}>
          查看
        </Button>
      ),
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
      />
      {/* 原始文本弹窗 */}
      <Modal
        title="切片原始数据"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={720}
        loading={modalLoading}
      >
        {!modalLoading && (
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-4 text-sm leading-relaxed">
            {modalText}
          </pre>
        )}
      </Modal>
    </div>
  )
}
