import { useRef, useEffect, useMemo, useCallback } from 'react'
import * as d3 from 'd3'
import { Tag } from 'antd'
import type { PersonEventItem } from '@person-timeline/api-types'

const MARGIN = { top: 40, right: 40, bottom: 80, left: 40 }
const INNER_H = 120

const EVENT_LABELS: Record<string, string> = {
  BIRTH: '出生',
  DEATH: '死亡',
  EDUCATION: '教育',
  CAREER: '仕途',
  CREATION: '创作',
  HISTORICAL: '历史',
  OTHER: '其他',
}

const TIME_LABELS: Record<string, string> = {
  POINT: '时间点',
  PERIOD: '时间段',
  FUZZY: '模糊',
}

interface TimelineProps {
  events: PersonEventItem[]
  height?: number
  timelineColor?: string
  onSelect?: (eventId: string) => void
}

export default function Timeline({ events, height = 500, timelineColor = '#3b82f6', onSelect }: TimelineProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const zoomTransform = useRef(d3.zoomIdentity)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  const fuzzyEvents = useMemo(
    () => events.filter(e => e.time_type === 'FUZZY'),
    [events],
  )

  const render = useCallback(() => {
    const svgEl = svgRef.current
    const containerEl = containerRef.current
    if (!svgEl || !containerEl) return

    const svg = d3.select(svgEl)
    svg.selectAll('*').remove()

    const width = containerEl.clientWidth || 800
    const innerW = width - MARGIN.left - MARGIN.right

    const visibleEvents = events.filter(e => e.time_type !== 'FUZZY')
    if (visibleEvents.length === 0) return

    const dates = visibleEvents.flatMap(e => {
      const d: Date[] = []
      if (e.start_date) d.push(new Date(e.start_date))
      if (e.end_date) d.push(new Date(e.end_date))
      return d
    })
    const minDate = d3.min(dates)!
    const maxDate = d3.max(dates)!
    const pad = (maxDate.getTime() - minDate.getTime()) * 0.05 || 86400000
    const xScale = d3.scaleTime()
      .domain([new Date(minDate.getTime() - pad), new Date(maxDate.getTime() + pad)])
      .range([0, innerW])
    const midY = INNER_H / 2

    const g = svg.append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

    // zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 20])
      .translateExtent([[0, 0], [innerW, INNER_H]])
      .on('zoom', (event) => {
        zoomTransform.current = event.transform
        render()
      })

    svg.call(zoom)
    svg.call(zoom.transform, zoomTransform.current)

    const rescaledX = zoomTransform.current.rescaleX(xScale)

    // main axis
    g.append('line')
      .attr('x1', 0).attr('y1', midY)
      .attr('x2', innerW).attr('y2', midY)
      .attr('stroke', '#d1d5db').attr('stroke-width', 2)

    // sub-timeline for PERIOD hover
    const subGroup = g.append('g').attr('class', 'sub-timeline').style('display', 'none')
    subGroup.append('rect').attr('class', 'sub-rect')
    subGroup.append('text').attr('class', 'sub-start-label').attr('y', 90).attr('font-size', 11).attr('fill', '#6b7280')
    subGroup.append('text').attr('class', 'sub-end-label').attr('y', 105).attr('font-size', 11).attr('fill', '#6b7280')
    subGroup.append('line').attr('class', 'sub-line')

    // x-axis
    const axisG = g.append('g')
      .attr('transform', `translate(0,${INNER_H})`)

    const yearTicks = rescaledX.ticks(d3.timeYear.every(1)!)
    axisG.selectAll('line')
      .data(yearTicks).join('line')
      .attr('x1', d => rescaledX(d)).attr('x2', d => rescaledX(d))
      .attr('y1', 0).attr('y2', 5)
      .attr('stroke', '#9ca3af')

    axisG.selectAll('text')
      .data(yearTicks).join('text')
      .attr('x', d => rescaledX(d))
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', 11)
      .attr('fill', d => {
        const y = rescaledX(d)
        return (y <= 0 || y >= innerW) ? 'transparent' : '#6b7280'
      })
      .attr('font-weight', d => {
        const y = rescaledX(d)
        return (y <= 0 || y >= innerW) ? 'normal' : 'bold'
      })
      .text(d => d3.timeFormat('%Y')(d))

    // grid lines
    axisG.selectAll('.grid-line')
      .data(yearTicks).join('line')
      .attr('class', 'grid-line')
      .attr('x1', d => rescaledX(d)).attr('x2', d => rescaledX(d))
      .attr('y1', -midY).attr('y2', 0)
      .attr('stroke', '#e5e7eb')
      .attr('stroke-dasharray', d => {
        const y = rescaledX(d)
        return (y <= 0 || y >= innerW) ? '0' : '4,4'
      })

    // event markers
    visibleEvents.forEach(ev => {
      const x = ev.start_date ? rescaledX(new Date(ev.start_date)) : 0
      let marker: d3.Selection<SVGElement, unknown, null, undefined>

      if (ev.event_type === 'BIRTH') {
        marker = g.append('text')
          .attr('x', x).attr('y', midY + 8)
          .attr('text-anchor', 'middle')
          .attr('font-size', 22).attr('fill', '#eab308')
          .text('★') as any
      } else if (ev.event_type === 'DEATH') {
        const s = 6
        marker = g.append('path')
          .attr('d', d3.symbol().type(d3.symbolDiamond).size(s * s * 3)())
          .attr('transform', `translate(${x},${midY})`)
          .attr('fill', '#ef4444') as any
      } else if (ev.time_type === 'PERIOD') {
        marker = g.append('rect')
          .attr('x', x - 8).attr('y', midY - 8)
          .attr('width', 16).attr('height', 16)
          .attr('rx', 3).attr('ry', 3)
          .attr('fill', timelineColor) as any
      } else {
        marker = g.append('circle')
          .attr('cx', x).attr('cy', midY)
          .attr('r', 7).attr('fill', timelineColor) as any
      }

      marker
        .style('cursor', 'pointer')
        .on('mouseenter', (event: MouseEvent) => {
          const tooltip = d3.select(tooltipRef.current)
          tooltip.style('display', 'block')
            .html(`
              <div class="font-medium">${ev.personal_title || ev.title}</div>
              <div class="text-xs text-gray-500 mt-1">${ev.start_date || ''}${ev.end_date ? ` — ${ev.end_date}` : ''}</div>
              <div class="text-xs text-gray-400 mt-1">${EVENT_LABELS[ev.event_type] || ev.event_type} · ${TIME_LABELS[ev.time_type] || ev.time_type}</div>
            `)

          const containerRect = containerEl.getBoundingClientRect()
          let tx = event.clientX - containerRect.left + 12
          let ty = event.clientY - containerRect.top - 10
          if (tx + 200 > width) tx = event.clientX - containerRect.left - 200 - 12
          if (ty < 0) ty = 10
          tooltip.style('left', `${tx}px`).style('top', `${ty}px`)

          // PERIOD sub-timeline
          if (ev.time_type === 'PERIOD') {
            const subX = ev.end_date ? rescaledX(new Date(ev.end_date)) : x
            subGroup.style('display', 'block')
            subGroup.select('.sub-line')
              .attr('x1', x).attr('y1', midY + 16)
              .attr('x2', subX).attr('y2', midY + 22)
              .attr('stroke', '#9ca3af').attr('stroke-width', 2)
            subGroup.select('.sub-rect')
              .attr('x', Math.min(x, subX) - 40)
              .attr('y', midY + 24)
              .attr('width', Math.abs(subX - x) + 80)
              .attr('height', 40)
              .attr('rx', 6)
              .attr('fill', '#f3f4f6').attr('stroke', '#d1d5db')
            subGroup.select('.sub-start-label')
              .attr('x', x).attr('text-anchor', 'middle')
              .text(ev.start_date ? d3.timeFormat('%Y/%m/%d')(new Date(ev.start_date)) : '')
            subGroup.select('.sub-end-label')
              .attr('x', subX).attr('text-anchor', 'middle')
              .text(ev.end_date ? d3.timeFormat('%Y/%m/%d')(new Date(ev.end_date)) : '')
          }
        })
        .on('mousemove', (event: MouseEvent) => {
          const tooltip = d3.select(tooltipRef.current)
          const containerRect = containerEl.getBoundingClientRect()
          let tx = event.clientX - containerRect.left + 12
          let ty = event.clientY - containerRect.top - 10
          if (tx + 200 > width) tx = event.clientX - containerRect.left - 200 - 12
          if (ty < 0) ty = 10
          tooltip.style('left', `${tx}px`).style('top', `${ty}px`)
        })
        .on('mouseleave', () => {
          d3.select(tooltipRef.current).style('display', 'none')
          subGroup.style('display', 'none')
        })
        .on('click', () => {
          onSelect?.(ev.event_id)
        })
    })
  }, [events, timelineColor, onSelect])

  useEffect(() => {
    render()
  }, [render])

  useEffect(() => {
    zoomTransform.current = d3.zoomIdentity
    render()
  }, [events])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => render())
    ro.observe(el)
    resizeObserverRef.current = ro
    return () => ro.disconnect()
  }, [])

  return (
    <div className="flex gap-6">
      <div ref={containerRef} className="flex-1 min-w-0 relative">
        <svg ref={svgRef} width="100%" height={height} />
        <div
          ref={tooltipRef}
          className="hidden absolute z-10 rounded-lg border bg-white px-3 py-2 shadow-lg pointer-events-none text-sm"
        />
        {events.filter(e => e.time_type !== 'FUZZY').length === 0 && (
          <div className="text-center text-gray-400 py-8">暂无事件数据</div>
        )}
      </div>

      {fuzzyEvents.length > 0 && (
        <div className="w-64 shrink-0">
          <div className="text-sm font-medium text-gray-500 mb-2">模糊事件 ({fuzzyEvents.length})</div>
          <div className="space-y-2">
            {fuzzyEvents.map(ev => (
              <div
                key={ev.event_id}
                className="rounded-lg border bg-white p-3 cursor-pointer hover:shadow-sm transition-shadow"
                onClick={() => onSelect?.(ev.event_id)}
              >
                <div className="text-sm font-medium">{ev.personal_title || ev.title}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {ev.start_date}{ev.end_date ? ` — ${ev.end_date}` : ''}
                </div>
                <Tag className="!mt-1" style={{ color: timelineColor, borderColor: timelineColor }}>
                  {EVENT_LABELS[ev.event_type] || ev.event_type}
                </Tag>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
