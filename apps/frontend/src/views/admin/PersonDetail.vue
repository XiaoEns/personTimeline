<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePersonStore } from '@/stores/person'
import type { PersonCreate, PersonUpdate } from '@person-timeline/api-types'

const route = useRoute()
const router = useRouter()
const store = usePersonStore()

/** 判断是否为新建模式 */
const isCreate = computed(() => route.path.endsWith('/new'))
const personId = computed(() => route.params.id as string | undefined)

// ========== 表单 ==========
const form = ref<PersonCreate | PersonUpdate>({
  name: '',
  birth_date: null,
  death_date: null,
  birth_display: null,
  death_display: null,
  summary: null,
})

const statusValue = ref<'draft' | 'published'>('draft')

// ========== 别名 ==========
const newAlias = ref('')
const aliasSubmitting = ref(false)

async function handleAddAlias() {
  if (!newAlias.value.trim() || !personId.value) return
  aliasSubmitting.value = true
  try {
    await store.addAlias(personId.value, newAlias.value.trim())
    newAlias.value = ''
  } finally {
    aliasSubmitting.value = false
  }
}

async function handleRemoveAlias(alias: string) {
  if (!personId.value) return
  if (!window.confirm(`确定删除别名「${alias}」？`)) return
  await store.removeAlias(personId.value, alias)
}

// ========== 保存 ==========
async function handleSave() {
  if (!form.value.name?.trim()) {
    alert('请输入人物姓名')
    return
  }
  if (isCreate.value) {
    const person = await store.create(form.value as PersonCreate)
    router.push(`/admin/persons/${person.id}`)
  } else if (personId.value) {
    const data: PersonUpdate = { ...form.value, status: statusValue.value }
    await store.update(personId.value, data)
    alert('保存成功')
  }
}

// ========== 删除 ==========
async function handleDelete() {
  if (!personId.value) return
  if (!window.confirm(`确定删除人物「${form.value.name}」？此操作不可撤销。`)) return
  await store.remove(personId.value)
  router.push('/admin/persons')
}

// ========== 初始化 ==========
onMounted(async () => {
  if (!isCreate.value && personId.value) {
    const person = await store.fetchById(personId.value)
    if (person) {
      form.value = {
        name: person.name,
        birth_date: person.birth_date,
        death_date: person.death_date,
        birth_display: person.birth_display,
        death_display: person.death_display,
        summary: person.summary,
      }
      statusValue.value = person.status
    }
  }
})
</script>

<template>
  <div>
    <!-- 头部 -->
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button
          class="text-gray-400 hover:text-gray-600 transition-colors"
          @click="router.push('/admin/persons')"
        >
          &larr; 返回列表
        </button>
        <h2 class="text-xl font-semibold text-gray-900">
          {{ isCreate ? '新建人物' : '编辑人物' }}
        </h2>
      </div>
      <div class="flex items-center gap-3">
        <button
          v-if="!isCreate"
          class="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          @click="handleDelete"
        >
          删除
        </button>
        <button
          v-if="!isCreate"
          class="rounded-lg border border-primary-300 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors"
          @click="router.push(`/view/persons/${personId}`)"
        >
          查看时间轴
        </button>
        <button
          class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          @click="router.push('/admin/persons')"
        >
          取消
        </button>
        <button
          class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="store.saving"
          @click="handleSave"
        >
          {{ store.saving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="store.detailLoading" class="animate-pulse space-y-4 rounded-lg border border-gray-200 bg-white p-6">
      <div v-for="i in 5" :key="i" class="h-10 w-full rounded bg-gray-200"></div>
    </div>

    <!-- 表单 -->
    <div v-else class="space-y-6">
      <!-- 基本信息 -->
      <section class="rounded-lg border border-gray-200 bg-white p-6">
        <h3 class="mb-4 text-base font-medium text-gray-900">基本信息</h3>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">姓名 *</label>
            <input
              v-model="form.name"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="人物姓名"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">状态</label>
            <select
              v-if="!isCreate"
              v-model="statusValue"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            >
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
            </select>
            <input
              v-else
              disabled
              type="text"
              value="草稿"
              class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">出生日期</label>
            <input
              v-model="form.birth_date"
              type="date"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">死亡日期</label>
            <input
              v-model="form.death_date"
              type="date"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">出生时间显示文本</label>
            <input
              v-model="form.birth_display"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="如：约公元 181 年"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700">死亡时间显示文本</label>
            <input
              v-model="form.death_display"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              placeholder="如：公元 234 年 10 月"
            />
          </div>
          <div class="col-span-2">
            <label class="mb-1 block text-sm font-medium text-gray-700">简介</label>
            <textarea
              v-model="form.summary"
              rows="3"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none"
              placeholder="人物简介..."
            ></textarea>
          </div>
        </div>
      </section>

      <!-- 别名管理 -->
      <section v-if="!isCreate" class="rounded-lg border border-gray-200 bg-white p-6">
        <h3 class="mb-4 text-base font-medium text-gray-900">别名</h3>
        <div class="mb-3 flex items-center gap-2">
          <input
            v-model="newAlias"
            type="text"
            class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            placeholder="输入别名"
            @keyup.enter="handleAddAlias"
          />
          <button
            class="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors disabled:opacity-50"
            :disabled="aliasSubmitting || !newAlias.trim()"
            @click="handleAddAlias"
          >
            添加
          </button>
        </div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="alias in store.aliases"
            :key="alias"
            class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
          >
            {{ alias }}
            <button
              class="text-gray-400 hover:text-red-500 transition-colors"
              @click="handleRemoveAlias(alias)"
            >
              &times;
            </button>
          </span>
          <span v-if="store.aliases.length === 0" class="text-sm text-gray-400">暂无别名</span>
        </div>
      </section>
    </div>
  </div>
</template>
