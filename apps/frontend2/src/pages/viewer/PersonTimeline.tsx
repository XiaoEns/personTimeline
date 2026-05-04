import { useParams } from 'react-router-dom'
import { usePersonTimeline } from '@/hooks/usePersonTimeline'
import Timeline from '@/components/Timeline'
import EventCard from '@/components/EventCard'

export default function PersonTimeline() {
  const { id } = useParams<{ id: string }>()
  const {
    person, events, loading,
    selectedEvent, showEventCard,
    handleEventSelect, closeEventCard,
  } = usePersonTimeline(id)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
        加载中...
      </div>
    )
  }

  if (!person) return null

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{person.name}</h1>
        <p className="mt-1 text-gray-500">
          {person.birth_display || person.birth_date?.slice(0, 10) || '?'}
          {' — '}
          {person.death_display || person.death_date?.slice(0, 10) || '?'}
        </p>
        {person.summary && (
          <p className="mt-2 text-sm text-gray-600">{person.summary}</p>
        )}
      </div>

      <Timeline events={events} onSelect={handleEventSelect} />
      <EventCard event={selectedEvent} visible={showEventCard} onClose={closeEventCard} />
    </div>
  )
}
