import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPerson, listPersonEvents } from '@/api/persons'
import Timeline from '@/components/Timeline'
import EventCard from '@/components/EventCard'
import type { PersonDetail, PersonEventItem } from '@person-timeline/api-types'

export default function PersonTimeline() {
  const { id } = useParams<{ id: string }>()
  const [person, setPerson] = useState<PersonDetail | null>(null)
  const [events, setEvents] = useState<PersonEventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<PersonEventItem | null>(null)
  const [showEventCard, setShowEventCard] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      getPerson(id),
      listPersonEvents(id),
    ])
      .then(([personData, eventsData]) => {
        setPerson(personData)
        setEvents(eventsData.items.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)))
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleEventSelect = (eventId: string) => {
    const ev = events.find(e => e.event_id === eventId)
    if (ev) {
      setSelectedEvent(ev)
      setShowEventCard(true)
    }
  }

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

      <Timeline
        events={events}
        onSelect={handleEventSelect}
      />

      <EventCard
        event={selectedEvent}
        visible={showEventCard}
        onClose={() => setShowEventCard(false)}
      />
    </div>
  )
}
