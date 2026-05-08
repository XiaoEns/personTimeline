import { http, HttpResponse } from 'msw'
import {
  MOCK_PERSONS,
  MOCK_PERSON_DETAILS,
  MOCK_EVENTS,
  MOCK_PERSON_EVENTS,
  MOCK_BIOGRAPHIES,
  paginate,
} from './data'

/** 从事件列表构建 EventListItem（含人物引用） */
function buildEventListItem(event: any) {
  const persons: { id: string; name: string; role: string | null }[] = []
  for (const [pid, items] of Object.entries(MOCK_PERSON_EVENTS)) {
    const found = items.find((pe) => pe.event_id === event.id)
    if (found) {
      const p = MOCK_PERSONS.find((x) => x.id === pid)
      persons.push({ id: pid, name: p?.name || '?', role: found.role })
    }
  }
  return {
    id: event.id,
    title: event.title,
    start_date: event.start_date,
    end_date: event.end_date,
    display_time: event.display_time,
    time_type: event.time_type,
    event_type: event.event_type,
    sort_date: event.sort_date,
    is_inferred: event.is_inferred,
    persons,
    created_at: event.created_at,
  }
}

function buildEventDetail(event: any) {
  const persons: { id: string; name: string; role: string | null }[] = []
  for (const [pid, items] of Object.entries(MOCK_PERSON_EVENTS)) {
    const found = items.find((pe) => pe.event_id === event.id)
    if (found) {
      const p = MOCK_PERSONS.find((x) => x.id === pid)
      persons.push({ id: pid, name: p?.name || '?', role: found.role })
    }
  }
  return { ...event, persons }
}

export const handlers = [
  // ========== 人物 ==========

  http.get('/api/persons', ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const status = url.searchParams.get('status') || ''
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('page_size') || '20')

    let filtered = MOCK_PERSONS
    if (search) filtered = filtered.filter((p) => p.name.includes(search))
    if (status) filtered = filtered.filter((p) => p.status === status)

    return HttpResponse.json(paginate(filtered, page, pageSize))
  }),

  http.post('/api/persons', async ({ request }) => {
    const body = (await request.json()) as any
    const newPerson = {
      id: crypto.randomUUID(),
      name: body.name,
      birth_date: body.birth_date || null,
      death_date: body.death_date || null,
      birth_display: body.birth_display || null,
      death_display: body.death_display || null,
      avatar_url: null,
      summary: body.summary || null,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    return HttpResponse.json(newPerson, { status: 201 })
  }),

  http.get('/api/persons/:personId', ({ params }) => {
    const detail = MOCK_PERSON_DETAILS[params.personId as string]
    if (!detail) return HttpResponse.json({ detail: '人物不存在' }, { status: 404 })
    return HttpResponse.json(detail)
  }),

  http.put('/api/persons/:personId', async ({ params, request }) => {
    const body = (await request.json()) as any
    const detail = MOCK_PERSON_DETAILS[params.personId as string]
    if (!detail) return HttpResponse.json({ detail: '人物不存在' }, { status: 404 })
    return HttpResponse.json({ ...detail, ...body, updated_at: new Date().toISOString() })
  }),

  http.delete('/api/persons/:personId', () => {
    return HttpResponse.json(null, { status: 204 })
  }),

  // ========== 别名 ==========

  http.get('/api/persons/:personId/aliases', ({ params }) => {
    const detail = MOCK_PERSON_DETAILS[params.personId as string]
    return HttpResponse.json({ items: detail?.aliases || [] })
  }),

  http.post('/api/persons/:personId/aliases', async ({ params, request }) => {
    const body = (await request.json()) as any
    return HttpResponse.json({ alias: body.alias, person_id: params.personId }, { status: 201 })
  }),

  http.delete('/api/persons/:personId/aliases/:alias', () => {
    return HttpResponse.json(null, { status: 204 })
  }),

  // ========== 人物-事件关联 ==========

  http.get('/api/persons/:personId/events', ({ params }) => {
    const items = MOCK_PERSON_EVENTS[params.personId as string] || []
    return HttpResponse.json({ items })
  }),

  http.post('/api/persons/:personId/events', async ({ params, request }) => {
    const body = (await request.json()) as any
    return HttpResponse.json({
      id: crypto.randomUUID(),
      person_id: params.personId,
      event_id: body.event_id,
      role: body.role || null,
      personal_title: body.personal_title || null,
      personal_display_time: body.personal_display_time || null,
      is_primary: body.is_primary || false,
      sort_order: body.sort_order || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { status: 201 })
  }),

  http.put('/api/person-events/:personEventId', async ({ request }) => {
    const body = (await request.json()) as any
    return HttpResponse.json({ ...body, updated_at: new Date().toISOString() })
  }),

  http.delete('/api/person-events/:personEventId', () => {
    return HttpResponse.json(null, { status: 204 })
  }),

  // ========== 事件 ==========

  http.get('/api/events', ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const eventType = url.searchParams.get('event_type') || ''
    const timeType = url.searchParams.get('time_type') || ''
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('page_size') || '20')

    let filtered = MOCK_EVENTS
    if (search) filtered = filtered.filter((e) => e.title.includes(search))
    if (eventType) filtered = filtered.filter((e) => e.event_type === eventType)
    if (timeType) filtered = filtered.filter((e) => e.time_type === timeType)

    const items = filtered.map(buildEventListItem)
    return HttpResponse.json(paginate(items, page, pageSize))
  }),

  http.post('/api/events', async ({ request }) => {
    const body = (await request.json()) as any
    const newEvent = {
      id: crypto.randomUUID(),
      title: body.title,
      description: body.description || null,
      start_date: body.start_date,
      end_date: body.end_date,
      display_time: body.display_time || null,
      time_type: body.time_type,
      sort_date: body.start_date,
      granularity: body.granularity,
      event_type: body.event_type,
      location: body.location || {},
      is_inferred: false,
      source: body.source || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      persons: [] as any[],
    }
    return HttpResponse.json(newEvent, { status: 201 })
  }),

  http.get('/api/events/:eventId', ({ params }) => {
    const event = MOCK_EVENTS.find((e) => e.id === params.eventId)
    if (!event) return HttpResponse.json({ detail: '事件不存在' }, { status: 404 })
    return HttpResponse.json(buildEventDetail(event))
  }),

  http.put('/api/events/:eventId', async ({ params, request }) => {
    const body = (await request.json()) as any
    const event = MOCK_EVENTS.find((e) => e.id === params.eventId)
    if (!event) return HttpResponse.json({ detail: '事件不存在' }, { status: 404 })
    return HttpResponse.json(buildEventDetail({ ...event, ...body, updated_at: new Date().toISOString() }))
  }),

  http.delete('/api/events/:eventId', () => {
    return HttpResponse.json(null, { status: 204 })
  }),

  // ========== 传记文本 ==========

  http.post('/api/upload', async ({ request }) => {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const personId = formData.get('person_id') as string | null
    return HttpResponse.json({
      id: crypto.randomUUID(),
      person_id: personId || null,
      source_file: file?.name || 'unknown.txt',
      page: null,
      text_length: file?.size || 0,
      created_at: new Date().toISOString(),
    }, { status: 201 })
  }),

  http.get('/api/persons/:personId/biography', ({ params }) => {
    const items = MOCK_BIOGRAPHIES[params.personId as string] || []
    return HttpResponse.json({ items })
  }),

  http.delete('/api/biography/:biographyId', () => {
    return HttpResponse.json(null, { status: 204 })
  }),

  // ========== AI 抽取 ==========

  http.post('/api/persons/:personId/extract', async ({ params }) => {
    const items = MOCK_PERSON_EVENTS[params.personId as string] || []
    const events = items.slice(0, 5).map((pe: any) => {
      const ev = MOCK_EVENTS.find((e) => e.id === pe.event_id)
      return {
        title: pe.title,
        description: ev?.description || null,
        start_date: pe.start_date,
        end_date: pe.end_date,
        display_time: ev?.display_time || null,
        time_type: pe.time_type,
        granularity: ev?.granularity || 'YEAR',
        event_type: pe.event_type,
        location: ev?.location || null,
        event_id: pe.event_id,
        is_inferred: true,
      }
    })
    return HttpResponse.json({ total: events.length, events })
  }),
]
