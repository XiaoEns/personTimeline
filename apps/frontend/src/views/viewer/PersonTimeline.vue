<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getPerson } from '@/api/persons'
import { listPersonEvents } from '@/api/persons'
import Timeline from '@/components/Timeline.vue'
import EventCard from '@/components/EventCard.vue'
import type { PersonDetail, PersonEventItem } from '@person-timeline/api-types'

const route = useRoute()
const personId = computed(() => route.params.id as string)

const person = ref<PersonDetail | null>(null)
const events = ref<PersonEventItem[]>([])
const loading = ref(true)
const selectedEvent = ref<PersonEventItem | null>(null)
const showEventCard = ref(false)

onMounted(async () => {
  if (!personId.value) return
  try {
    const [personRes, eventsRes] = await Promise.all([
      getPerson(personId.value),
      listPersonEvents(personId.value),
    ])
    person.value = personRes.data
    events.value = eventsRes.data.items.sort((a, b) => a.sort_order - b.sort_order)
  } finally {
    loading.value = false
  }
})

function onEventSelect(eventId: string) {
  selectedEvent.value = events.value.find((e) => e.event_id === eventId) || null
  showEventCard.value = true
}

function closeEventCard() {
  showEventCard.value = false
}
</script>

<template>
  <div v-if="loading" class="flex items-center justify-center py-32 text-sm text-gray-400">
    加载中...
  </div>
  <div v-else-if="person" class="mx-auto max-w-5xl px-4 py-8">
    <!-- 人物头部 -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">{{ person.name }}</h1>
      <p class="mt-1 text-sm text-gray-500">
        <template v-if="person.birth_display || person.death_display">
          {{ person.birth_display || '?' }} ~ {{ person.death_display || '?' }}
        </template>
        <template v-else>
          {{ person.birth_date?.slice(0, 10) || '?' }} ~ {{ person.death_date?.slice(0, 10) || '?' }}
        </template>
      </p>
      <p v-if="person.summary" class="mt-2 max-w-2xl text-sm text-gray-600 leading-relaxed">
        {{ person.summary }}
      </p>
    </div>

    <!-- 时间轴 -->
    <Timeline :events="events" @select="onEventSelect" />

    <!-- 事件详情浮层 -->
    <EventCard :event="selectedEvent" :visible="showEventCard" @close="closeEventCard" />
  </div>
</template>
