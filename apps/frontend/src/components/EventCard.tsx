import { useEffect, useRef, useState } from 'react'
import type { PersonEventItem } from '@person-timeline/api-types'

interface EventCardProps {
  event: PersonEventItem | null
  visible: boolean
  onClose: () => void
  /** 已在树中的人物 ID 列表（用于判断"已添加"状态） */
  activePersonIds?: string[]
  /** 添加分支回调 */
  onAddBranch?: (personId: string, personName: string) => void
}

export default function EventCard({ event, visible, onClose, activePersonIds = [], onAddBranch }: EventCardProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setConfirmingId(null)
    }
    return () => { document.body.style.overflow = '' }
  }, [visible])

  if (!visible || !event) return null

  const persons = event.persons || []
  const personIds = event.person_ids || []

  /** 点击参与者按钮：未确认→进入确认态，已确认→触发添加 */
  const handlePersonClick = (personId: string) => {
    if (!personId) return
    if (activePersonIds.includes(personId)) return
    if (confirmingId === personId) {
      // 确认添加
      const idx = personIds.indexOf(personId)
      const name = persons[idx] || personId
      onAddBranch?.(personId, name)
      setConfirmingId(null)
    } else {
      setConfirmingId(personId)
    }
  }

  /** 取消确认态 */
  const cancelConfirm = () => setConfirmingId(null)

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/20 transition-opacity duration-150"
      onClick={e => {
        if (e.target === overlayRef.current) {
          cancelConfirm()
          onClose()
        }
      }}
    >
      <div
        className="max-w-md rounded-xl border bg-white p-6 shadow-xl mx-4 animate-in fade-in zoom-in duration-150"
        onClick={cancelConfirm}
      >
        <div className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">事件详情</div>
        <h3 className="text-lg font-semibold text-gray-900">
          {event?.personal_title || event?.title}
        </h3>

        <div className="mt-4 space-y-3 text-sm text-gray-600">
          <div>
            <span className="font-medium text-gray-700">时间：</span>
            {event?.start_date || ''}{event?.end_date ? ` — ${event.end_date}` : ''}
          </div>
          <div>
            <span className="font-medium text-gray-700">类型：</span>
            {event?.event_type || ''}
          </div>
          {event?.role && (
            <div>
              <span className="font-medium text-gray-700">角色：</span>
              {event.role}
            </div>
          )}

          {/* 参与者列表 */}
          {persons.length > 0 && (
            <div>
              <span className="font-medium text-gray-700">相关人物：</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {persons.map((name, idx) => {
                  const pid = personIds[idx] || ''
                  const isActive = pid && activePersonIds.includes(pid)
                  const isConfirming = confirmingId === pid

                  return (
                    <button
                      key={name}
                      disabled={isActive || !pid}
                      onClick={e => {
                        e.stopPropagation()
                        handlePersonClick(pid)
                      }}
                      className={
                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ' +
                        (isActive
                          ? 'bg-gray-100 text-gray-400 cursor-default'
                          : isConfirming
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : pid
                              ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                              : 'bg-gray-50 text-gray-500 cursor-default')
                      }
                    >
                      {isActive ? (
                        <>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {name}
                        </>
                      ) : isConfirming ? (
                        <>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          确认添加
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                          {name}
                        </>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => { cancelConfirm(); onClose() }}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
