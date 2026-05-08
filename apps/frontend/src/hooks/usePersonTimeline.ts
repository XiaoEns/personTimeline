import { useState, useEffect, useCallback, useRef } from 'react'
import { getPerson, listPersonEvents } from '@/api/persons'
import type { PersonDetail, PersonEventItem } from '@person-timeline/api-types'

export function usePersonTimeline(personId: string | undefined) {
  const [person, setPerson] = useState<PersonDetail | null>(null)
  const [events, setEvents] = useState<PersonEventItem[]>([])
  const [loading, setLoading] = useState(true)

  /** 跳过 StrictMode 重复挂载导致的二次请求 */
  const loadedIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!personId) return
    if (loadedIdRef.current === personId) return
    setLoading(true)
    Promise.all([
      getPerson(personId),
      listPersonEvents(personId),
    ])
      .then(([personData, eventsData]) => {
        setPerson(personData)
        setEvents(eventsData.items.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)))
      })
      .finally(() => setLoading(false))
    return () => { loadedIdRef.current = personId }
  }, [personId])

  const [selectedEvent, setSelectedEvent] = useState<PersonEventItem | null>(null)
  const [showEventCard, setShowEventCard] = useState(false)

  const handleEventSelect = useCallback((eventId: string) => {
    const ev = events.find(e => e.event_id === eventId)
    if (ev) {
      setSelectedEvent(ev)
      setShowEventCard(true)
    }
  }, [events])

  const closeEventCard = useCallback(() => {
    setShowEventCard(false)
  }, [])

  return {
    person, events, loading,
    selectedEvent, showEventCard,
    handleEventSelect, closeEventCard,
  }
}
