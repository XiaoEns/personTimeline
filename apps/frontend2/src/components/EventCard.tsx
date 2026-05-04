import { useEffect, useRef } from 'react'
import type { PersonEventItem } from '@person-timeline/api-types'

interface EventCardProps {
  event: PersonEventItem | null
  visible: boolean
  onClose: () => void
}

export default function EventCard({ event, visible, onClose }: EventCardProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [visible])

  if (!visible || !event) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/20 transition-opacity duration-150"
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="max-w-md rounded-xl border bg-white p-6 shadow-xl mx-4 animate-in fade-in zoom-in duration-150">
        <div className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">事件详情</div>
        <h3 className="text-lg font-semibold text-gray-900">
          {event?.personal_title || event?.title}
        </h3>
        <div className="mt-4 space-y-2 text-sm text-gray-600">
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
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
