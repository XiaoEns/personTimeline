<script setup lang="ts">
import type { PersonEventItem } from '@person-timeline/api-types'

defineProps<{
  event: PersonEventItem | null
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <Transition name="fade">
    <div
      v-if="visible && event"
      class="fixed inset-0 z-20 flex items-center justify-center bg-black/20"
      @click.self="emit('close')"
    >
      <div class="mx-4 w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <div class="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
          事件详情
        </div>
        <h3 class="mb-2 text-lg font-semibold text-gray-900">
          {{ event.personal_title || event.title }}
        </h3>
        <div class="space-y-2 text-sm text-gray-600">
          <div class="flex items-center gap-2">
            <span class="w-16 shrink-0 text-gray-400">时间</span>
            <span>{{ event.start_date.slice(0, 10) }} ~ {{ event.end_date.slice(0, 10) }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-16 shrink-0 text-gray-400">类型</span>
            <span>{{ event.event_type }}</span>
          </div>
          <div v-if="event.role" class="flex items-center gap-2">
            <span class="w-16 shrink-0 text-gray-400">角色</span>
            <span>{{ event.role }}</span>
          </div>
        </div>
        <div class="mt-4 flex justify-end">
          <button
            class="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            @click="emit('close')"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
