import rawEvents from './event.json'

/** 事件数据结构 */
export interface TimelineEvent {
  id: number
  chunk_id: number[]
  title: string
  start_date: string
  end_date: string
  time_type: 'POINT' | 'PERIOD' | 'DURATION'
  persons: string[]
}

// 过滤掉 persons 为空的事件（无法在泳道上展示）
const events = (rawEvents as TimelineEvent[]).filter((e) => e.persons.length > 0)

// 找出有独有事件的人物（单独参与的事件，该事件只有他一人）
const soloPersons = new Set(
  events
    .filter((e) => e.persons.length === 1)
    .map((e) => e.persons[0]),
)

// 仅保留有独有事件的人物作为泳道
const allPersons = [...new Set(events.map((e) => e.persons[0]))].filter((p) =>
  soloPersons.has(p),
)

export { events, allPersons }
