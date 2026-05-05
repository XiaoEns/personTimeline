import { useParams, Link } from 'react-router-dom'
import { useState, useCallback, useMemo } from 'react'
import { useGitTree } from '@/hooks/useGitTree'
import GitTree from '@/components/GitTree'
import EventCard from '@/components/EventCard'
import type { PersonEventItem } from '@person-timeline/api-types'

export default function PersonGitTree() {
  const { id } = useParams<{ id: string }>()
  const { person, events, otherBranches, loading } = useGitTree(id)

  // 事件选中状态
  const [selectedEvent, setSelectedEvent] = useState<PersonEventItem | null>(null)
  const [showEventCard, setShowEventCard] = useState(false)

  // event_id → PersonEventItem 映射
  const eventMap = useMemo(() => {
    const map = new Map<string, PersonEventItem>()
    events.forEach(e => map.set(e.event_id, e))
    otherBranches.forEach(b => b.events.forEach(e => map.set(e.event_id, e)))
    return map
  }, [events, otherBranches])

  const handleEventSelect = useCallback((eventId: string) => {
    const ev = eventMap.get(eventId)
    if (ev) {
      setSelectedEvent(ev)
      setShowEventCard(true)
    }
  }, [eventMap])

  const closeEventCard = useCallback(() => setShowEventCard(false), [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-400 text-sm">加载人物分支数据...</span>
      </div>
    )
  }

  if (!person) return null

  const totalBranches = otherBranches.length + 1
  const totalCommits = events.length + otherBranches.reduce((sum, b) => sum + b.events.length, 0)

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full">
      {/* 顶部信息栏 */}
      <div className="flex items-center gap-4 border-b bg-white px-6 py-3 shrink-0">

        <div>
          <h1 className="text-lg font-bold text-gray-900">{person.name}</h1>
        </div>

        <div className="flex items-center gap-1 text-sm text-gray-500">
          <span>{person.birth_display || person.birth_date?.slice(0, 10) || '?'}</span>
          <span>—</span>
          <span>{person.death_display || person.death_date?.slice(0, 10) || '?'}</span>
        </div>

        {/* 统计摘要 */}
        <div className="flex items-center gap-3 ml-auto text-xs text-gray-400">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-50">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>{totalBranches} 条人物分支</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-50">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{totalCommits} 个事件</span>
          </div>
        </div>
      </div>

      {/* Git 树主体 */}
      <div className="flex-1 min-h-0 overflow-hidden bg-white">
        <GitTree
          person={person}
          events={events}
          otherBranches={otherBranches}
          onSelectEvent={handleEventSelect}
        />
      </div>

      <EventCard event={selectedEvent} visible={showEventCard} onClose={closeEventCard} />
    </div>
  )
}
