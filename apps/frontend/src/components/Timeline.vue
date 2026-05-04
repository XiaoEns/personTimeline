<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as d3 from 'd3'
import type { PersonEventItem, EventType, TimeType } from '@person-timeline/api-types'

const props = withDefaults(defineProps<{
  events: PersonEventItem[]
  height?: number
}>(), {
  height: 500,
})

const emit = defineEmits<{
  select: [eventId: string]
}>()

const svgRef = ref<SVGSVGElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const tooltipRef = ref<HTMLDivElement | null>(null)

// ========== 常量 ==========
const MARGIN = { top: 40, right: 40, bottom: 60, left: 120 }
const LANE_HEIGHT = 60
const EVENT_COLORS: Record<EventType, string> = {
  BIRTH: '#ec4899',
  DEATH: '#6b7280',
  EDUCATION: '#3b82f6',
  CAREER: '#f59e0b',
  CREATION: '#8b5cf6',
  HISTORICAL: '#06b6d4',
  OTHER: '#64748b',
}
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

// ========== 渲染 ==========
function render() {
  const svg = d3.select(svgRef.value!)
  const container = containerRef.value
  if (!container || props.events.length === 0) return

  svg.selectAll('*').remove()
  const width = container.clientWidth

  // 按事件类型分组，确定泳道顺序
  const types = [...new Set(props.events.map((e) => e.event_type))] as EventType[]
  const innerH = types.length * LANE_HEIGHT
  const svgH = innerH + MARGIN.top + MARGIN.bottom
  svg.attr('height', Math.max(svgH, props.height))

  const innerW = width - MARGIN.left - MARGIN.right
  if (innerW <= 0) return

  // 时间范围
  const dates = props.events.flatMap((e) => [new Date(e.start_date), new Date(e.end_date)])
  const minDate = d3.min(dates)!
  const maxDate = d3.max(dates)!
  const pad = (maxDate.getTime() - minDate.getTime()) * 0.05 || 86400000 * 365
  const xScale = d3.scaleTime()
    .domain([new Date(minDate.getTime() - pad), new Date(maxDate.getTime() + pad)])
    .range([0, innerW])

  const yScale = d3.scalePoint<EventType>()
    .domain(types)
    .range([LANE_HEIGHT / 2, innerH - LANE_HEIGHT / 2])

  const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

  // 泳道背景
  types.forEach((t, i) => {
    g.append('rect')
      .attr('x', 0)
      .attr('y', i * LANE_HEIGHT)
      .attr('width', innerW)
      .attr('height', LANE_HEIGHT)
      .attr('fill', i % 2 === 0 ? '#f9fafb' : '#ffffff')
      .attr('stroke', '#f3f4f6')
      .attr('stroke-width', 0.5)
  })

  // 泳道标签
  types.forEach((t) => {
    g.append('text')
      .attr('x', -10)
      .attr('y', yScale(t)!)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('class', 'text-sm fill-gray-600 font-medium')
      .text(EVENT_LABELS[t])
  })

  // X 轴
  const xAxis = d3.axisBottom(xScale)
    .tickFormat(d3.timeFormat('%Y') as any)
  g.append('g')
    .attr('transform', `translate(0,${innerH})`)
    .attr('class', 'text-xs')
    .call(xAxis)

  // 绘制事件
  const eventGroup = g.append('g')

  props.events.forEach((ev) => {
    const y = yScale(ev.event_type)!
    const x1 = xScale(new Date(ev.start_date))
    const x2 = xScale(new Date(ev.end_date))
    const color = EVENT_COLORS[ev.event_type]

    if (ev.time_type === 'POINT') {
      eventGroup.append('circle')
        .attr('cx', x1)
        .attr('cy', y)
        .attr('r', 7)
        .attr('fill', color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .attr('cursor', 'pointer')
        .attr('data-event-id', ev.event_id)
        .on('mouseenter', (e: MouseEvent) => showTooltip(e, ev))
        .on('mousemove', (e: MouseEvent) => moveTooltip(e))
        .on('mouseleave', hideTooltip)
        .on('click', () => emit('select', ev.event_id))
    } else {
      const dash = ev.time_type === 'FUZZY' ? '6,4' : null
      eventGroup.append('line')
        .attr('x1', x1)
        .attr('x2', x2)
        .attr('y1', y)
        .attr('y2', y)
        .attr('stroke', color)
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', dash)
        .attr('stroke-linecap', 'round')
        .attr('cursor', 'pointer')
        .attr('data-event-id', ev.event_id)
        .on('mouseenter', (e: MouseEvent) => showTooltip(e, ev))
        .on('mousemove', (e: MouseEvent) => moveTooltip(e))
        .on('mouseleave', hideTooltip)
        .on('click', () => emit('select', ev.event_id))

      ;[x1, x2].forEach((x) => {
        eventGroup.append('circle')
          .attr('cx', x)
          .attr('cy', y)
          .attr('r', 5)
          .attr('fill', color)
          .attr('stroke', '#fff')
          .attr('stroke-width', 2)
          .attr('cursor', 'pointer')
          .attr('data-event-id', ev.event_id)
          .on('mouseenter', (e: MouseEvent) => showTooltip(e, ev))
          .on('mousemove', (e: MouseEvent) => moveTooltip(e))
          .on('mouseleave', hideTooltip)
          .on('click', () => emit('select', ev.event_id))
      })
    }
  })
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
  const rect = containerRef.value!.getBoundingClientRect()
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
  if (containerRef.value) {
    resizeObserver.value = new ResizeObserver(() => render())
    resizeObserver.value.observe(containerRef.value)
  }
})

onUnmounted(() => {
  resizeObserver.value?.disconnect()
})

watch(() => props.events, render, { deep: false })
</script>

<template>
  <div ref="containerRef" class="relative w-full">
    <svg ref="svgRef" class="w-full" :height="height"></svg>
    <div
      ref="tooltipRef"
      class="hidden absolute pointer-events-none z-10 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg"
    ></div>
    <div v-if="events.length === 0" class="flex items-center justify-center py-20 text-sm text-gray-400">
      暂无事件数据
    </div>
  </div>
</template>
