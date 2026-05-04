<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useEventStore } from '@/stores/event'
import { listPersons } from '@/api/persons'
import type { EventCreate, EventUpdate, EventType, TimeType, Granularity, PersonListItem } from '@person-timeline/api-types'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps<{
  visible: boolean
  eventId: string | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  saved: []
}>()

const store = useEventStore()
const isCreate = computed(() => !props.eventId)

// ========== 枚举 ==========
const EVENT_TYPE_OPTIONS = [
  { value: 'BIRTH' as EventType, label: '出生' },
  { value: 'DEATH' as EventType, label: '死亡' },
  { value: 'EDUCATION' as EventType, label: '教育' },
  { value: 'CAREER' as EventType, label: '仕途' },
  { value: 'CREATION' as EventType, label: '创作' },
  { value: 'HISTORICAL' as EventType, label: '历史' },
  { value: 'OTHER' as EventType, label: '其他' },
]

const TIME_TYPE_OPTIONS = [
  { value: 'POINT' as TimeType, label: '时间点' },
  { value: 'PERIOD' as TimeType, label: '时间段' },
  { value: 'FUZZY' as TimeType, label: '模糊' },
]

const GRANULARITY_OPTIONS = [
  { value: 'YEAR' as Granularity, label: '年' },
  { value: 'MONTH' as Granularity, label: '月' },
  { value: 'DAY' as Granularity, label: '日' },
  { value: 'SEASON' as Granularity, label: '季' },
]

// ========== 表单 ==========
const form = ref<EventCreate>({
  title: '',
  description: null,
  start_date: '',
  end_date: '',
  display_time: null,
  time_type: 'POINT',
  granularity: 'YEAR',
  event_type: 'OTHER',
  location: null,
  source: null,
  person_ids: [],
})

// ========== 人物选择 ==========
const persons = ref<PersonListItem[]>([])
const personsLoading = ref(false)
const selectedPersonIds = ref<string[]>([])

async function fetchPersons(search?: string) {
  personsLoading.value = true
  try {
    const res = await listPersons({ page_size: 100, search })
    persons.value = res.data.items
  } finally {
    personsLoading.value = false
  }
}

// ========== 保存 ==========
async function handleSave() {
  if (!form.value.title.trim()) {
    ElMessage.warning('请输入事件标题')
    return
  }
  if (!form.value.start_date || !form.value.end_date) {
    ElMessage.warning('请填写起始和结束日期')
    return
  }

  const payload: EventCreate = {
    ...form.value,
    person_ids: selectedPersonIds.value.length > 0 ? selectedPersonIds.value : undefined,
  }

  try {
    if (isCreate.value) {
      await store.create(payload)
      ElMessage.success('事件创建成功')
    } else if (props.eventId) {
      const updateData: EventUpdate = {
        title: form.value.title,
        description: form.value.description,
        start_date: form.value.start_date,
        end_date: form.value.end_date,
        display_time: form.value.display_time,
        time_type: form.value.time_type,
        granularity: form.value.granularity,
        event_type: form.value.event_type,
        location: form.value.location,
        source: form.value.source,
      }
      await store.update(props.eventId, updateData)
      ElMessage.success('保存成功')
    }
    emit('saved')
    emit('update:visible', false)
  } catch {
    ElMessage.error('保存失败')
  }
}

// ========== 删除 ==========
async function handleDelete() {
  if (!props.eventId) return
  try {
    await ElMessageBox.confirm(
      `确定删除事件「${form.value.title}」？此操作不可撤销。`,
      '确认删除',
      { type: 'warning', confirmButtonText: '删除', confirmButtonClass: 'el-button--danger' }
    )
    await store.remove(props.eventId)
    ElMessage.success('事件已删除')
    emit('saved')
    emit('update:visible', false)
  } catch {
    // cancelled
  }
}

// ========== 监听弹框打开 ==========
watch(() => props.visible, async (val) => {
  if (!val) return

  store.resetCurrent()
  await fetchPersons()

  if (!isCreate.value && props.eventId) {
    const ev = await store.fetchById(props.eventId)
    if (ev) {
      form.value = {
        title: ev.title,
        description: ev.description,
        start_date: ev.start_date,
        end_date: ev.end_date,
        display_time: ev.display_time,
        time_type: ev.time_type,
        granularity: ev.granularity,
        event_type: ev.event_type,
        location: ev.location,
        source: ev.source,
        person_ids: ev.persons.map((p) => p.id),
      }
      selectedPersonIds.value = ev.persons.map((p) => p.id)
    }
  } else {
    form.value = {
      title: '',
      description: null,
      start_date: '',
      end_date: '',
      display_time: null,
      time_type: 'POINT',
      granularity: 'YEAR',
      event_type: 'OTHER',
      location: null,
      source: null,
      person_ids: [],
    }
    selectedPersonIds.value = []
  }
})
</script>

<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="emit('update:visible', $event)"
    :title="isCreate ? '新建事件' : '编辑事件'"
    width="640px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <template v-if="!store.detailLoading">
      <el-form label-position="top" size="default">
        <el-form-item label="事件标题">
          <el-input v-model="form.title" placeholder="事件标题" clearable />
        </el-form-item>

        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="事件描述..." />
        </el-form-item>

        <div class="grid grid-cols-3 gap-4">
          <el-form-item label="事件类型">
            <el-select v-model="form.event_type" class="!w-full">
              <el-option v-for="opt in EVENT_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="时间类型">
            <el-select v-model="form.time_type" class="!w-full">
              <el-option v-for="opt in TIME_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="时间粒度">
            <el-select v-model="form.granularity" class="!w-full">
              <el-option v-for="opt in GRANULARITY_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="开始日期">
            <el-date-picker
              v-model="form.start_date"
              type="date"
              placeholder="选择开始日期"
              value-format="YYYY-MM-DD"
              class="!w-full"
              clearable
            />
          </el-form-item>
          <el-form-item label="结束日期">
            <el-date-picker
              v-model="form.end_date"
              type="date"
              placeholder="选择结束日期"
              value-format="YYYY-MM-DD"
              class="!w-full"
              clearable
            />
          </el-form-item>
        </div>

        <el-form-item label="显示文本">
          <el-input v-model="form.display_time" placeholder="如：建安十三年冬" clearable />
        </el-form-item>

        <el-form-item label="来源">
          <el-input v-model="form.source" placeholder="信息来源" clearable />
        </el-form-item>

        <el-form-item label="关联人物">
          <el-select
            v-model="selectedPersonIds"
            multiple
            filterable
            remote
            reserve-keyword
            placeholder="搜索并选择人物"
            :remote-method="fetchPersons"
            :loading="personsLoading"
            class="!w-full"
          >
            <el-option
              v-for="p in persons"
              :key="p.id"
              :label="p.name"
              :value="p.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </template>

    <template v-else>
      <div class="flex items-center justify-center py-12">
        <el-icon class="is-loading" :size="24"><Loading /></el-icon>
        <span class="ml-2 text-gray-500">加载中...</span>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-between">
        <div>
          <el-button
            v-if="!isCreate"
            type="danger"
            plain
            @click="handleDelete"
          >
            删除
          </el-button>
        </div>
        <div class="flex items-center gap-2">
          <el-button @click="emit('update:visible', false)">取消</el-button>
          <el-button type="primary" :loading="store.saving" @click="handleSave">
            {{ store.saving ? '保存中...' : '保存' }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>
