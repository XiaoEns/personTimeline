import { useParams } from 'react-router-dom'
import { usePersonTimeline } from '@/hooks/usePersonTimeline'
import Timeline from '@/components/Timeline'
import EventCard from '@/components/EventCard'
import { useMemo } from 'react'

export default function PersonTimeline() {
  const { id } = useParams<{ id: string }>()
  const {
    person, events, loading,
    selectedEvent, showEventCard,
    closeEventCard,
  } = usePersonTimeline(id)

  // compute centre date: first event's start_date, or 2000
  const centerDate = useMemo(() => {
    if (events && events.length > 0) {
      const sorted = [...events].sort(
        (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
      )
      return new Date(sorted[0].start_date)
    }
    return new Date(2000, 0, 1)
  }, [events])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
        加载中...
      </div>
    )
  }

  if (!person) return null

  return (
    <div className="flex-1 flex flex-col w-full">
      {/* Compact person info bar */}
      <div className="flex items-center gap-3 border-b bg-white px-6 py-2 shrink-0">
        <h1 className="text-lg font-bold text-gray-900">{person.name}</h1>
        <span className="text-sm text-gray-500">
          {person.birth_display || person.birth_date?.slice(0, 10) || '?'}
          {' — '}
          {person.death_display || person.death_date?.slice(0, 10) || '?'}
        </span>
        {person.summary && (
          <span className="text-sm text-gray-400 truncate ml-2">{person.summary}</span>
        )}
      </div>

      <Timeline centerDate={centerDate} />
      <EventCard event={selectedEvent} visible={showEventCard} onClose={closeEventCard} />
    </div>
  )
}
