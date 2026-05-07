import { useRef, useEffect, useCallback, useState } from 'react'
import * as d3 from 'd3'

const MS_YEAR = 365.25 * 24 * 60 * 60 * 1000

interface TimelineProps {
  centerDate?: Date
}

export default function Timeline({ centerDate }: TimelineProps = {}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const zoomTransform = useRef(d3.zoomIdentity)
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const centerDateRef = useRef(new Date(2000, 0, 1))
  // sync prop to ref during render phase (before effects run)
  centerDateRef.current = centerDate ?? new Date(2000, 0, 1)
  const showGridRef = useRef(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showGrid, setShowGrid] = useState(true)

  const render = useCallback(() => {
    const svgEl = svgRef.current
    const containerEl = containerRef.current
    if (!svgEl || !containerEl) return

    const width = containerEl.clientWidth
    const height = containerEl.clientHeight
    if (width === 0 || height === 0) return

    // ---- compute visible date range directly from zoom transform ----
    const { x: tx, k } = zoomTransform.current

    // canvas coordinates for viewport edges
    const canvasL = (0 - tx) / k
    const canvasR = (width - tx) / k

    // pixels-per-year at current zoom: at k=1, 200 years fill viewport
    const pxPerYear = (width / 200) * k
    const msPerPx = MS_YEAR / pxPerYear

    const centerMs = centerDateRef.current.getTime()
    const d0 = new Date(centerMs + canvasL * msPerPx)
    const d1 = new Date(centerMs + canvasR * msPerPx)

    // guard against date overflow
    if (isNaN(d0.getTime()) || isNaN(d1.getTime())) return

    const xScale = d3.scaleTime().domain([d0, d1]).range([canvasL, canvasR])

    // ---- determine tick interval based on visible span ----
    const spanDays = (d1.getTime() - d0.getTime()) / MS_YEAR * 365.25

    let tickDates: Date[]
    let tickFormat: (d: Date) => string

    if (spanDays > 365 * 10) {
      const everyN = Math.max(1, Math.ceil(spanDays / 365 / 15))
      tickDates = d3.timeYear.every(everyN)!.range(d0, d1)
      tickFormat = (d) => String(d.getFullYear())
    } else if (spanDays > 365 * 2) {
      tickDates = d3.timeMonth.every(3)!.range(d0, d1)
      tickFormat = (d) => String(d.getMonth() + 1)
    } else if (spanDays > 180) {
      tickDates = d3.timeMonth.every(1)!.range(d0, d1)
      tickFormat = (d) => String(d.getMonth() + 1)
    } else if (spanDays > 30) {
      tickDates = d3.timeWeek.every(1)!.range(d0, d1)
      tickFormat = (d) => String(d.getDate())
    } else if (spanDays > 3) {
      tickDates = d3.timeDay.every(1)!.range(d0, d1)
      tickFormat = (d) => String(d.getDate())
    } else {
      tickDates = d3.timeHour.every(6)!.range(d0, d1)
      tickFormat = (d) => String(d.getHours())
    }

    // ---- draw ----
    const svg = d3.select(svgEl)
    svg.selectAll('*').remove()

    const g = svg.append('g')
      .attr('transform', `translate(${zoomTransform.current.x}, ${zoomTransform.current.y})`)

    // grid (faint vertical lines)
    if (showGridRef.current) {
      const gridTicks = tickDates
      const gridG = g.append('g')
      const gridExtent = 1e8
      gridTicks.forEach(d => {
        const x = xScale(d)
        gridG.append('line')
          .attr('x1', x).attr('x2', x)
          .attr('y1', -gridExtent).attr('y2', gridExtent)
          .attr('stroke', '#f3f4f6').attr('stroke-width', 1)
      })
    }

    // main timeline axis — essentially infinite
    g.append('line')
      .attr('x1', -1e8).attr('y1', 0)
      .attr('x2', 1e8).attr('y2', 0)
      .attr('stroke', '#9ca3af').attr('stroke-width', 2)

    // tick marks + labels
    const ticks = tickDates
    const tickG = g.append('g')
    ticks.forEach((d: Date) => {
      const x = xScale(d)
      tickG.append('line')
        .attr('x1', x).attr('x2', x)
        .attr('y1', 0).attr('y2', 6)
        .attr('stroke', '#9ca3af').attr('stroke-width', 1.5)
      tickG.append('text')
        .attr('x', x).attr('y', 20)
        .attr('text-anchor', 'middle')
        .attr('font-size', 11)
        .attr('fill', '#6b7280')
        .attr('font-weight', '500')
        .text(tickFormat(d))
    })

  }, [])

  // ---- D3 zoom ----
  useEffect(() => {
    const svgEl = svgRef.current
    const containerEl = containerRef.current
    if (!svgEl || !containerEl) return

    const svg = d3.select(svgEl)

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 100])
      .filter(event => event instanceof MouseEvent && event.button === 0)
      .on('zoom', (event: any) => {
        zoomTransform.current = event.transform
        render()
      })

    zoomBehaviorRef.current = zoom
    svg.call(zoom)
    svg.on('dblclick.zoom', null)  // disable double-click zoom

    // centre timeline at viewport centre
    const initX = containerEl.clientWidth / 2
    const initY = containerEl.clientHeight / 2
    const initTransform = d3.zoomIdentity.translate(initX, initY)
    zoomTransform.current = initTransform
    svg.call(zoom.transform, initTransform)

    return () => { svg.on('.zoom', null) }
  }, [render])

  // ---- ResizeObserver ----
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => render())
    ro.observe(el)
    return () => ro.disconnect()
  }, [render])

  // ---- handlers ----
  const getTargetTransform = (tx: number, ty: number) => {
    const k = zoomTransform.current.k
    // see D3 zoom docs: to set absolute x/y at current scale:
    // identity.translate(tx/k, ty/k).scale(k)
    return d3.zoomIdentity.translate(tx / k, ty / k).scale(k)
  }

  const applyTransform = (tx: number, ty: number) => {
    const svgEl = svgRef.current
    if (!svgEl || !zoomBehaviorRef.current) return
    d3.select(svgEl).transition().duration(300)
      .call(zoomBehaviorRef.current.transform, getTargetTransform(tx, ty))
  }

  const resetY = () => {
    if (!containerRef.current) return
    const targetY = containerRef.current.clientHeight / 2
    applyTransform(zoomTransform.current.x, targetY)
  }

  const resetX = () => {
    if (!containerRef.current) return
    const targetX = containerRef.current.clientWidth / 2
    applyTransform(targetX, zoomTransform.current.y)
  }

  const resetXY = () => {
    if (!containerRef.current) return
    const targetX = containerRef.current.clientWidth / 2
    const targetY = containerRef.current.clientHeight / 2
    applyTransform(targetX, targetY)
  }

  const toggleFullscreen = () => setIsFullscreen(prev => !prev)

  useEffect(() => {
    if (!isFullscreen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFullscreen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isFullscreen])

  const toggleGrid = () => {
    const next = !showGridRef.current
    showGridRef.current = next
    setShowGrid(next)
    render()
  }

  const btn = 'rounded-lg border bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-gray-50 transition-colors cursor-pointer select-none'

  return (
    <div
      ref={containerRef}
      className={isFullscreen
        ? 'fixed inset-0 z-50 bg-gray-50 flex flex-col overflow-hidden'
        : 'flex-1 w-full relative flex flex-col overflow-hidden'
      }
    >
      <svg ref={svgRef} className="flex-1 w-full block" />
      <div className="absolute top-4 right-4 flex gap-2">
        <button onClick={resetY} className={btn}>Y轴复位</button>
        <button onClick={resetX} className={btn}>X轴复位</button>
        <button onClick={resetXY} className={btn}>全部复位</button>
        <button onClick={toggleGrid} className={btn}>
          {showGrid ? '隐藏网格' : '显示网格'}
        </button>
        <button onClick={toggleFullscreen} className={btn}>
          {isFullscreen ? '退出全屏' : '全屏'}
        </button>
      </div>
    </div>
  )
}
