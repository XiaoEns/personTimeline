<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import * as d3 from 'd3'
import type { PersonEventItem, EventType, TimeType } from '@person-timeline/api-types'

const props = withDefaults(defineProps<{
  events: PersonEventItem[]
  height?: number
  timelineColor?: string
}>(), {
  height: 500,
  timelineColor: '#3b82f6',
})

const emit = defineEmits<{
  select: [eventId: string]
}>()

const svgRef = ref<SVGSVGElement | null>(null)
const svgContainerRef = ref<HTMLDivElement | null>(null)
const tooltipRef = ref<HTMLDivElement | null>(null)

// ========== 常量 ==========
const MARGIN = { top: 40, right: 40, bottom: 80, left: 40 }
const EVENT_LABELS: Record<EventType, string> = {
  BIRTH: '出生',
  DEATH: '死亡',
  EDUCATION: '教育',
  CAREER: '仕途',
  CREATION: '创作',
  HISTORICAL: '历史',
  OTHER: '其他',
}
const TIME_LABELS: Record<TimeType, string> = {
  POINT: '时间点',
  PERIOD: '时间段',
  FUZZY: '模糊',
}

// FUZZY 事件单独提取到右侧卡片
const fuzzyEvents = computed(() => props.events.filter((e) => e.time_type === 'FUZZY'))

// ========== 缩放状态 ==========
let zoomTransform = d3.zoomIdentity

// ========== 渲染 ==========
function render() {
  const svg = d3.select(svgRef.value!)
  const container = svgContainerRef.value
  if (!container || props.events.length === 0) return

  svg.selectAll('*').remove()
  const width = container.clientWidth

  const visibleEvents = props.events.filter((e) => e.time_type !== 'FUZZY')
  if (visibleEvents.length === 0) return

  const innerH = 120
  const svgH = innerH + MARGIN.top + MARGIN.bottom
  svg.attr('height', Math.max(svgH, props.height))

  const innerW = width - MARGIN.left - MARGIN.right
  if (innerW <= 0) return

  const midY = innerH / 2

  // 时间范围
  const dates = visibleEvents.flatMap((e) => [new Date(e.start_date), new Date(e.end_date)])
  const minDate = d3.min(dates)!
  const maxDate = d3.max(dates)!
  const pad = (maxDate.getTime() - minDate.getTime()) * 0.05 || 86400000 * 365

  // 基础时间比例尺
  const baseScale = d3.scaleTime()
    .domain([new Date(minDate.getTime() - pad), new Date(maxDate.getTime() + pad)])
    .range([0, innerW])

  // 应用缩放变换
  const xScale = zoomTransform.rescaleX(baseScale)

  const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

  // ---- 时间轴线 ----
  g.append('line')
    .attr('x1', 0)
    .attr('x2', innerW)
    .attr('y1', midY)
    .attr('y2', midY)
    .attr('stroke', props.timelineColor)
    .attr('stroke-width', 2)

  // ---- PERIOD 子时间轴区域（默认隐藏） ----
  const subAxisY = innerH + 25
  const subTimelineG = g.append('g')
    .attr('class', 'sub-timeline')
    .style('display', 'none')

  subTimelineG.append('line')
    .attr('x1', 0)
    .attr('x2', innerW)
    .attr('y1', subAxisY)
    .attr('y2', subAxisY)
    .attr('stroke', '#e5e7eb')
    .attr('stroke-width', 1)

  subTimelineG.append('rect')
    .attr('y', subAxisY - 6)
    .attr('height', 12)
    .attr('fill', props.timelineColor)
    .attr('rx', 3)
    .attr('opacity', 0.8)

  subTimelineG.append('text')
    .attr('class', 'sub-label-start')
    .attr('y', subAxisY - 10)
    .attr('font-size', '11')
    .attr('fill', props.timelineColor)

  subTimelineG.append('text')
    .attr('class', 'sub-label-end')
    .attr('y', subAxisY - 10)
    .attr('font-size', '11')
    .attr('fill', props.timelineColor)
    .attr('text-anchor', 'end')

  // ---- X 轴（年份，去掉前置零） ----
  const xAxisGroup = g.append('g')
    .attr('transform', `translate(0,${innerH})`)
    .attr('class', 'timeline-x-axis')
    .call(d3.axisBottom(xScale)
      .tickFormat((d: Date | d3.NumberValue, _i: number) => `${(d as Date).getFullYear()}`)
      .tickSizeOuter(0)
      .tickSizeInner(6)
    )

  // 美化 X 轴样式
  xAxisGroup.selectAll('.domain')
    .attr('stroke', '#d1d5db')
    .attr('stroke-width', 1)
  xAxisGroup.selectAll('.tick line')
    .attr('stroke', '#d1d5db')
    .attr('stroke-width', 1)
  xAxisGroup.selectAll('.tick text')
    .attr('fill', '#6b7280')
    .attr('font-size', '11')
    .attr('font-weight', '500')
    .attr('dy', '0.3em')

  // 垂直网格虚线（从刻线延伸到时间轴上方）
  xAxisGroup.selectAll('.tick line')
    .attr('y2', -innerH)
    .attr('stroke', '#f3f4f6')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '3,3')
  xAxisGroup.selectAll('.tick:first-child line, .tick:last-child line')
    .attr('stroke-dasharray', '0')

  // ---- 绘制事件 ----
  const eventGroup = g.append('g')
  const clipPathId = `timeline-clip-${Date.now()}`
  g.append('defs').append('clipPath')
    .attr('id', clipPathId)
    .append('rect')
    .attr('x', -5)
    .attr('width', innerW + 10)
    .attr('y', 0)
    .attr('height', innerH)

  visibleEvents.forEach((ev) => {
    const y = midY
    const x1 = xScale(new Date(ev.start_date))
    const x2 = xScale(new Date(ev.end_date))

    if (ev.event_type === 'BIRTH') {
      const group = eventGroup.append('g')
        .attr('cursor', 'pointer')
        .attr('data-event-id', ev.event_id)
        .attr('transform', `translate(${x1},${y})`)
        .attr('clip-path', `url(#${clipPathId})`)
      group.append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('font-size', '22')
        .attr('fill', '#eab308')
        .text('★')
      group
        .on('mouseenter', (e: MouseEvent) => showTooltip(e, ev))
        .on('mousemove', (e: MouseEvent) => moveTooltip(e))
        .on('mouseleave', hideTooltip)
        .on('click', () => emit('select', ev.event_id))
    } else if (ev.event_type === 'DEATH') {
      const group = eventGroup.append('g')
        .attr('cursor', 'pointer')
        .attr('data-event-id', ev.event_id)
        .attr('transform', `translate(${x1},${y})`)
        .attr('clip-path', `url(#${clipPathId})`)
      group.append('path')
        .attr('d', 'M0,-12 L12,0 L0,12 L-12,0 Z')
        .attr('fill', props.timelineColor)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
      group
        .on('mouseenter', (e: MouseEvent) => showTooltip(e, ev))
        .on('mousemove', (e: MouseEvent) => moveTooltip(e))
        .on('mouseleave', hideTooltip)
        .on('click', () => emit('select', ev.event_id))
    } else if (ev.time_type === 'PERIOD') {
      // 时间段：16×16 方形
      eventGroup.append('rect')
        .attr('x', x1 - 8)
        .attr('y', y - 8)
        .attr('width', 16)
        .attr('height', 16)
        .attr('fill', props.timelineColor)
        .attr('rx', 2)
        .attr('cursor', 'pointer')
        .attr('data-event-id', ev.event_id)
        .attr('clip-path', `url(#${clipPathId})`)
        .on('mouseenter', (e: MouseEvent) => {
          showSubTimeline(ev, x1, x2)
          showTooltip(e, ev)
        })
        .on('mousemove', (e: MouseEvent) => moveTooltip(e))
        .on('mouseleave', () => {
          hideSubTimeline()
          hideTooltip()
        })
        .on('click', () => emit('select', ev.event_id))
    } else {
      // 时间点：实心圆
      eventGroup.append('circle')
        .attr('cx', x1)
        .attr('cy', y)
        .attr('r', 7)
        .attr('fill', props.timelineColor)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .attr('cursor', 'pointer')
        .attr('data-event-id', ev.event_id)
        .attr('clip-path', `url(#${clipPathId})`)
        .on('mouseenter', (e: MouseEvent) => showTooltip(e, ev))
        .on('mousemove', (e: MouseEvent) => moveTooltip(e))
        .on('mouseleave', hideTooltip)
        .on('click', () => emit('select', ev.event_id))
    }
  })

  // ---- 缩放 + 拖拽 ----
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([1, 20])
    .extent([[0, 0], [innerW, innerH]])
    .translateExtent([[0, 0], [innerW, innerH]])
    .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      if (!event.sourceEvent) return
      zoomTransform = event.transform
      render()
    })

  svg.call(zoom)

  // 恢复缩放状态（不触发 zoom 事件）
  if (zoomTransform !== d3.zoomIdentity) {
    svg.call(zoom.transform, zoomTransform)
  }
}

// ========== PERIOD 子时间轴 ==========
function showSubTimeline(ev: PersonEventItem, x1: number, x2: number) {
  const g = d3.select(svgRef.value!).select('.sub-timeline')
  if (g.empty()) return

  g.style('display', null)

  g.select('rect')
    .attr('x', x1)
    .attr('width', Math.max(x2 - x1, 8))

  const fmt = d3.timeFormat('%Y')
  g.select<SVGTextElement>('.sub-label-start')
    .text('')
    .append('tspan')
    .attr('x', x1)
    .text(`${fmt(new Date(ev.start_date))}`)
    .append('tspan')
    .attr('x', x1)
    .attr('dy', '1.2em')
    .attr('font-size', '10')
    .attr('fill', '#9ca3af')
    .text(ev.start_date.slice(5, 10))

  g.select<SVGTextElement>('.sub-label-end')
    .text('')
    .append('tspan')
    .attr('x', x2)
    .text(`${fmt(new Date(ev.end_date))}`)
    .append('tspan')
    .attr('x', x2)
    .attr('dy', '1.2em')
    .attr('font-size', '10')
    .attr('fill', '#9ca3af')
    .text(ev.end_date.slice(5, 10))
}

function hideSubTimeline() {
  d3.select(svgRef.value!).select('.sub-timeline').style('display', 'none')
}

// ========== 工具提示 ==========
let tooltipVisible = false

function showTooltip(e: MouseEvent, ev: PersonEventItem) {
  const el = tooltipRef.value
  if (!el) return
  tooltipVisible = true
  el.classList.remove('hidden')
  el.innerHTML = `
    <div class="font-medium text-gray-900 text-sm">${ev.personal_title || ev.title}</div>
    <div class="text-xs text-gray-500 mt-0.5">
      ${ev.start_date.slice(0, 10)} ~ ${ev.end_date.slice(0, 10)}
      <span class="ml-2">${EVENT_LABELS[ev.event_type]}</span>
    </div>
    <div class="text-xs text-gray-400 mt-0.5">${TIME_LABELS[ev.time_type]}</div>
  `
  moveTooltip(e)
}

function moveTooltip(e: MouseEvent) {
  if (!tooltipVisible || !tooltipRef.value) return
  const rect = svgContainerRef.value!.getBoundingClientRect()
  let left = e.clientX - rect.left + 12
  let top = e.clientY - rect.top - 8
  const tw = tooltipRef.value.offsetWidth
  const th = tooltipRef.value.offsetHeight
  if (left + tw > rect.width - 10) left = e.clientX - rect.left - tw - 12
  if (top + th > rect.height - 10) top = rect.height - th - 10
  if (top < 10) top = 10
  tooltipRef.value.style.left = `${left}px`
  tooltipRef.value.style.top = `${top}px`
}

function hideTooltip() {
  tooltipVisible = false
  const el = tooltipRef.value
  if (el) el.classList.add('hidden')
}

// ========== 生命周期 ==========
const resizeObserver = ref<ResizeObserver | null>(null)

onMounted(() => {
  render()
  if (svgContainerRef.value) {
    resizeObserver.value = new ResizeObserver(() => render())
    resizeObserver.value.observe(svgContainerRef.value)
  }
})

onUnmounted(() => {
  resizeObserver.value?.disconnect()
})

watch(() => props.events, () => {
  zoomTransform = d3.zoomIdentity
  render()
}, { deep: false })
</script>

<template>
  <div class="relative w-full flex gap-6">
    <!-- 左侧：SVG 时间轴 -->
    <div ref="svgContainerRef" class="flex-1 min-w-0">
      <svg ref="svgRef" class="w-full" :height="height"></svg>
      <div
        ref="tooltipRef"
        class="hidden absolute pointer-events-none z-10 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg"
      ></div>
      <div v-if="events.length === 0" class="flex items-center justify-center py-20 text-sm text-gray-400">
        暂无事件数据
      </div>
    </div>

    <!-- 右侧：模糊事件卡片 -->
    <div v-if="fuzzyEvents.length > 0" class="w-64 shrink-0">
      <h3 class="mb-3 text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">
        模糊事件
        <span class="ml-1 font-normal text-gray-400">({{ fuzzyEvents.length }})</span>
      </h3>
      <div class="space-y-3">
        <div
          v-for="ev in fuzzyEvents"
          :key="ev.event_id"
          class="cursor-pointer rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:border-primary-300 hover:bg-primary-50"
          @click="emit('select', ev.event_id)"
        >
          <div class="text-sm font-medium text-gray-900">{{ ev.personal_title || ev.title }}</div>
          <div class="mt-1 text-xs text-gray-500">
            {{ ev.start_date.slice(0, 10) }} ~ {{ ev.end_date.slice(0, 10) }}
          </div>
          <div class="mt-1">
            <el-tag size="small" :color="props.timelineColor" class="!text-white !border-0">
              {{ EVENT_LABELS[ev.event_type] }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
