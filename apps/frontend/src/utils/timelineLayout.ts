import { events, allPersons, type TimelineEvent } from '@/data/timelineData'
import type { Node, Edge } from '@xyflow/react'

const LANE = 150
const LANE_OFFSET = 60
const TIME_OFFSET = 180
const PER_YEAR = 100
const HEADER_POS = 50

const PERSON_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#14b8a6',
  '#a855f7', '#e11d48', '#0ea5e9', '#eab308',
]

/** 将日期字符串转为小数年份，兼容 "YYYY-MM-DD" 和 "YYYY-MM-DD HH:mm:ss" */
function dateToDecimalYear(dateStr: string): number {
  const datePart = dateStr.split(' ')[0]
  const [y, m, d] = datePart.split('-').map(Number)
  return y + (m - 1) / 12 + (d - 1) / 365
}

const minYear = Math.min(...events.map((e) => dateToDecimalYear(e.start_date)))
const maxYear = Math.max(...events.map((e) => dateToDecimalYear(e.start_date)))

/** 给定日期的 X 方向偏移量（像素） */
function timeOffset(dateStr: string): number {
  return (dateToDecimalYear(dateStr) - minYear) * PER_YEAR
}

/** 人物在 allPersons 中的索引 */
function personIndex(person: string): number {
  return allPersons.indexOf(person)
}

/** 获取事件对应的泳道人物（索引最小的参与人物） */
function getTopPerson(evt: TimelineEvent): string | null {
  const candidates = evt.persons.filter((p) => allPersons.includes(p))
  if (candidates.length === 0) return null
  return candidates.reduce((best, p) =>
    personIndex(p) < personIndex(best) ? p : best,
  )
}

/**
 * 构建 ReactFlow 时间轴图
 * @param orientation "horizontal" | "vertical"，默认 horizontal
 * @returns { nodes, edges }
 */
export function buildTimelineGraph(orientation = 'horizontal'): {
  nodes: Node[]
  edges: Edge[]
} {
  const isH = orientation === 'horizontal'

  const nodes: Node[] = []
  const edges: Edge[] = []

  // === 人物头部节点 ===
  for (const person of allPersons) {
    const idx = personIndex(person)
    nodes.push({
      id: `h-${person}`,
      type: 'personHeader',
      position: isH
        ? { x: HEADER_POS, y: LANE_OFFSET + idx * LANE }
        : { x: LANE_OFFSET + idx * LANE, y: HEADER_POS },
      data: {
        person,
        color: PERSON_COLORS[idx % PERSON_COLORS.length],
        orientation,
      },
    })
  }

  // === 事件节点 ===
  for (const evt of events) {
    const topPerson = getTopPerson(evt)
    if (!topPerson) continue
    const tOff = timeOffset(evt.start_date)
    const pIdx = personIndex(topPerson)

    const nodeId = `e-${evt.id}`
    nodes.push({
      id: nodeId,
      type: 'eventNode',
      position: isH
        ? { x: TIME_OFFSET + tOff, y: LANE_OFFSET + pIdx * LANE }
        : { x: LANE_OFFSET + pIdx * LANE, y: TIME_OFFSET + tOff },
      data: {
        label: evt.title,
        date: evt.start_date,
        end_date: evt.end_date,
        timeType: evt.time_type,
        persons: evt.persons,
        eventId: evt.id,
        orientation,
      },
    })
  }

  // === 边（按人物串链） ===
  for (const person of allPersons) {
    const personEvents = events
      .filter((e) => e.persons.includes(person))
      .sort(
        (a, b) => dateToDecimalYear(a.start_date) - dateToDecimalYear(b.start_date),
      )
    if (personEvents.length === 0) continue

    const color = PERSON_COLORS[personIndex(person) % PERSON_COLORS.length]

    edges.push({
      id: `edge-${person}-h`,
      source: `h-${person}`,
      target: `e-${personEvents[0].id}`,
      type: 'default',
      animated: true,
      style: { stroke: color, strokeWidth: 2 },
    })

    for (let i = 0; i < personEvents.length - 1; i++) {
      edges.push({
        id: `edge-${person}-${personEvents[i].id}-${personEvents[i + 1].id}`,
        source: `e-${personEvents[i].id}`,
        target: `e-${personEvents[i + 1].id}`,
        type: 'default',
        animated: true,
        style: { stroke: color, strokeWidth: 2 },
      })
    }
  }

  // === 时间轴刻度（每 5 年） ===
  const lastPersonIdx = personIndex(allPersons[allPersons.length - 1])
  const axisPos = LANE_OFFSET + lastPersonIdx * LANE + 100
  const startYear = Math.ceil(minYear)
  const endYear = Math.ceil(maxYear) + 1

  for (let year = startYear; year <= endYear; year += 5) {
    const tOff = TIME_OFFSET + (year - minYear) * PER_YEAR
    nodes.push({
      id: `a-${year}`,
      type: 'axisLabel',
      position: isH ? { x: tOff, y: axisPos } : { x: axisPos, y: tOff },
      data: { year, orientation },
    })
  }

  return { nodes, edges }
}

export {
  PERSON_COLORS, allPersons, minYear, maxYear,
  dateToDecimalYear, timeOffset, personIndex, getTopPerson,
  LANE, LANE_OFFSET, TIME_OFFSET, PER_YEAR, HEADER_POS,
}
