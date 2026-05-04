import { useEffect, useState } from 'react'
import { Button, message } from 'antd'
import { listPersons, uploadBiography, listBiographyTexts, deleteBiography, extractEvents } from '@/api/persons'
import type { PersonListItem, BiographyTextItem, ExtractEventItem } from '@person-timeline/api-types'

function formatFileSize(len: number): string {
  if (len < 1024) return `${len}B`
  if (len < 1024 * 1024) return `${(len / 1024).toFixed(1)}KB`
  return `${(len / (1024 * 1024)).toFixed(1)}MB`
}

function formatDate(iso: string): string {
  return iso.slice(0, 10)
}

export default function UploadPage() {
  const [persons, setPersons] = useState<PersonListItem[]>([])
  const [selectedPersonId, setSelectedPersonId] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [biographies, setBiographies] = useState<BiographyTextItem[]>([])
  const [bioLoading, setBioLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extractResult, setExtractResult] = useState<ExtractEventItem[] | null>(null)
  const [extractError, setExtractError] = useState('')

  useEffect(() => {
    listPersons({ page_size: 200 }).then(res => setPersons(res.items))
  }, [])

  useEffect(() => {
    if (!selectedPersonId) {
      setBiographies([])
      setExtractResult(null)
      return
    }
    setBiographies([])
    setExtractResult(null)
    setBioLoading(true)
    listBiographyTexts(selectedPersonId)
      .then(res => setBiographies(res.items))
      .finally(() => setBioLoading(false))
  }, [selectedPersonId])

  const handleFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !['txt', 'pdf'].includes(ext)) {
      message.error('仅支持 .txt 和 .pdf 格式')
      return
    }
    if (!selectedPersonId) {
      message.error('请先选择人物')
      return
    }
    setUploading(true)
    try {
      await uploadBiography(file, selectedPersonId)
      message.success('上传成功')
      const res = await listBiographyTexts(selectedPersonId)
      setBiographies(res.items)
    } catch {
      // error handled by interceptor
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const handleDeleteBio = async (id: string) => {
    if (!window.confirm('确定要删除该传记文本吗？')) return
    try {
      await deleteBiography(id)
      message.success('删除成功')
      const res = await listBiographyTexts(selectedPersonId)
      setBiographies(res.items)
    } catch {
      // error handled by interceptor
    }
  }

  const handleExtract = async () => {
    if (!selectedPersonId || biographies.length === 0) return
    setExtracting(true)
    setExtractError('')
    setExtractResult(null)
    try {
      const res = await extractEvents(selectedPersonId)
      setExtractResult(res.events)
    } catch {
      setExtractError('抽取失败，请稍后重试')
    } finally {
      setExtracting(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="text-lg font-semibold">上传与抽取</h2>

      {/* 人物选择 */}
      <section className="rounded-lg border bg-white p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">选择人物</label>
        <select
          value={selectedPersonId}
          onChange={e => setSelectedPersonId(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="" disabled>请选择人物</option>
          {persons.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </section>

      {/* 文件上传 */}
      <section className="rounded-lg border bg-white p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">上传传记文件</h3>
        <div
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer ${
            dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={e => { e.preventDefault(); setDragOver(false) }}
          onDrop={onDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".txt,.pdf"
            className="hidden"
            onChange={onFileChange}
          />
          {uploading ? (
            <div className="text-gray-500">
              <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
              上传中...
            </div>
          ) : (
            <>
              <svg className="mb-2 h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-500">拖拽文件到此处，或点击上传</p>
              <p className="mt-1 text-xs text-gray-400">支持 .txt .pdf 格式</p>
            </>
          )}
        </div>
      </section>

      {/* 传记文本列表 */}
      {selectedPersonId && (
        <section className="rounded-lg border bg-white p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">已上传文本</h3>
          {bioLoading ? (
            <div className="text-sm text-gray-400">加载中...</div>
          ) : biographies.length === 0 ? (
            <div className="text-sm text-gray-400">暂无上传文本</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">文件名</th>
                  <th className="pb-2 font-medium">大小</th>
                  <th className="pb-2 font-medium">上传时间</th>
                  <th className="pb-2 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {biographies.map(bio => (
                  <tr key={bio.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2">{bio.source_file}</td>
                    <td className="py-2 text-gray-500">{formatFileSize(bio.text_length)}</td>
                    <td className="py-2 text-gray-500">{formatDate(bio.created_at)}</td>
                    <td className="py-2">
                      <Button type="link" size="small" danger onClick={() => handleDeleteBio(bio.id)}>
                        删除
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {/* AI 事件抽取 */}
      {selectedPersonId && (
        <section className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">AI 事件抽取</h3>
            <Button
              type="primary"
              loading={extracting}
              disabled={biographies.length === 0}
              onClick={handleExtract}
            >
              {extracting ? '抽取中...' : '开始抽取'}
            </Button>
          </div>
          {biographies.length === 0 && (
            <p className="text-sm text-gray-400">暂无传记文本，请先上传</p>
          )}
          {extractError && (
            <p className="text-sm text-red-500">{extractError}</p>
          )}
          {extractResult && extractResult.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-2">共抽取 {extractResult.length} 个事件</p>
              <ul className="space-y-2">
                {extractResult.map((ev, idx) => (
                  <li key={idx} className="rounded border bg-gray-50 p-3 text-sm">
                    <div className="font-medium">{ev.title}</div>
                    <div className="mt-1 text-gray-500">
                      {ev.start_date} — {ev.end_date}
                      {ev.is_inferred && <span className="ml-2 text-yellow-600">[推断]</span>}
                    </div>
                    <div className="text-gray-400">{ev.event_type}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
