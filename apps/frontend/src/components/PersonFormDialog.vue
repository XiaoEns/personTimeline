<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePersonStore } from '@/stores/person'
import type { PersonCreate, PersonUpdate } from '@person-timeline/api-types'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps<{
  visible: boolean
  personId: string | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  saved: []
}>()

const store = usePersonStore()
const isCreate = computed(() => !props.personId)

const form = ref<PersonCreate>({
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
  if (!newAlias.value.trim() || !props.personId) return
  aliasSubmitting.value = true
  try {
    await store.addAlias(props.personId, newAlias.value.trim())
    newAlias.value = ''
    ElMessage.success('别名已添加')
  } finally {
    aliasSubmitting.value = false
  }
}

async function handleRemoveAlias(alias: string) {
  if (!props.personId) return
  try {
    await ElMessageBox.confirm(`确定删除别名「${alias}」？`, '确认', { type: 'warning' })
    await store.removeAlias(props.personId, alias)
    ElMessage.success('别名已删除')
  } catch {
    // cancelled
  }
}

// ========== 保存 ==========
async function handleSave() {
  if (!form.value.name?.trim()) {
    ElMessage.warning('请输入人物姓名')
    return
  }
  try {
    if (isCreate.value) {
      await store.create(form.value as PersonCreate)
      ElMessage.success('人物创建成功')
    } else if (props.personId) {
      const data: PersonUpdate = { ...form.value, status: statusValue.value }
      await store.update(props.personId, data)
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
  if (!props.personId) return
  try {
    await ElMessageBox.confirm(
      `确定删除人物「${form.value.name}」？此操作不可撤销。`,
      '确认删除',
      { type: 'warning', confirmButtonText: '删除', confirmButtonClass: 'el-button--danger' }
    )
    await store.remove(props.personId)
    ElMessage.success('人物已删除')
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

  if (!isCreate.value && props.personId) {
    const person = await store.fetchById(props.personId)
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
  } else {
    form.value = {
      name: '',
      birth_date: null,
      death_date: null,
      birth_display: null,
      death_display: null,
      summary: null,
    }
    statusValue.value = 'draft'
  }
})
</script>

<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="emit('update:visible', $event)"
    :title="isCreate ? '新建人物' : '编辑人物'"
    width="640px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <template v-if="!store.detailLoading">
      <!-- 基本信息 -->
      <el-form label-position="top" size="default">
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="姓名">
            <el-input v-model="form.name" placeholder="人物姓名" clearable />
          </el-form-item>
          <el-form-item label="状态" v-if="!isCreate">
            <el-select v-model="statusValue" class="!w-full">
              <el-option label="草稿" value="draft" />
              <el-option label="已发布" value="published" />
            </el-select>
          </el-form-item>
          <el-form-item label="出生日期">
            <el-date-picker
              v-model="form.birth_date"
              type="date"
              placeholder="选择出生日期"
              value-format="YYYY-MM-DD"
              class="!w-full"
              clearable
            />
          </el-form-item>
          <el-form-item label="死亡日期">
            <el-date-picker
              v-model="form.death_date"
              type="date"
              placeholder="选择死亡日期"
              value-format="YYYY-MM-DD"
              class="!w-full"
              clearable
            />
          </el-form-item>
          <el-form-item label="出生时间显示文本">
            <el-input v-model="form.birth_display" placeholder="如：约公元 181 年" clearable />
          </el-form-item>
          <el-form-item label="死亡时间显示文本">
            <el-input v-model="form.death_display" placeholder="如：公元 234 年 10 月" clearable />
          </el-form-item>
        </div>
        <el-form-item label="简介">
          <el-input v-model="form.summary" type="textarea" :rows="3" placeholder="人物简介..." />
        </el-form-item>
      </el-form>

      <!-- 别名管理 -->
      <template v-if="!isCreate">
        <el-divider />
        <h3 class="mb-3 text-base font-medium text-gray-900">别名</h3>
        <div class="mb-3 flex items-center gap-2">
          <el-input
            v-model="newAlias"
            placeholder="输入别名"
            clearable
            @keyup.enter="handleAddAlias"
          />
          <el-button
            type="primary"
            :disabled="!newAlias.trim()"
            :loading="aliasSubmitting"
            @click="handleAddAlias"
          >
            添加
          </el-button>
        </div>
        <div class="flex flex-wrap gap-2">
          <el-tag
            v-for="alias in store.aliases"
            :key="alias"
            closable
            :disable-transitions="true"
            @close="handleRemoveAlias(alias)"
          >
            {{ alias }}
          </el-tag>
          <span v-if="store.aliases.length === 0" class="text-sm text-gray-400">暂无别名</span>
        </div>
      </template>
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
