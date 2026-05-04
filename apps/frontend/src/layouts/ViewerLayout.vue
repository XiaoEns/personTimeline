<template>
  <div class="flex min-h-screen flex-col bg-gray-50">
    <header class="flex h-14 items-center border-b border-gray-200 bg-white px-6">
      <router-link to="/admin" class="text-sm font-medium text-gray-500 hover:text-gray-700">
        &larr; 返回管理
      </router-link>
    </header>
    <main class="flex-1">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
</script>
