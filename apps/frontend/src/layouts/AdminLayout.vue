<template>
  <div class="flex h-screen">
    <!-- 侧边栏 -->
    <aside class="w-56 shrink-0 border-r border-gray-200 bg-white">
      <div class="flex h-14 items-center border-b border-gray-200 px-4">
        <h1 class="text-base font-semibold text-gray-900">personTimeline</h1>
      </div>
      <nav class="p-2 space-y-1">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors"
          active-class="bg-primary-50 text-primary-700"
          inactive-class="text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        >
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
    </aside>

    <!-- 主内容 -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <header class="flex h-14 items-center border-b border-gray-200 bg-white px-6">
        <h2 class="text-sm font-medium text-gray-500">管理后台</h2>
      </header>
      <main class="flex-1 overflow-auto p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const navItems = [
  { label: '人物管理', path: '/admin/persons' },
  { label: '事件管理', path: '/admin/events' },
  { label: '上传与抽取', path: '/admin/upload' },
]
</script>
