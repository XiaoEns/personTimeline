import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/admin',
  },

  // ========== 管理端 ==========
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/admin/persons',
      },
      {
        path: 'persons',
        name: 'PersonList',
        component: () => import('../views/admin/PersonList.vue'),
      },
      {
        path: 'persons/new',
        name: 'PersonCreate',
        component: () => import('../views/admin/PersonDetail.vue'),
      },
      {
        path: 'persons/:id',
        name: 'PersonDetail',
        component: () => import('../views/admin/PersonDetail.vue'),
      },
      {
        path: 'events',
        name: 'EventList',
        component: () => import('../views/admin/EventList.vue'),
      },
      {
        path: 'events/new',
        name: 'EventCreate',
        component: () => import('../views/admin/EventDetail.vue'),
      },
      {
        path: 'events/:id',
        name: 'EventDetail',
        component: () => import('../views/admin/EventDetail.vue'),
      },
      {
        path: 'upload',
        name: 'UploadPage',
        component: () => import('../views/admin/UploadPage.vue'),
      },
    ],
  },

  // ========== 展示端 ==========
  {
    path: '/view',
    component: () => import('../layouts/ViewerLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/admin',
      },
      {
        path: 'persons/:id',
        name: 'PersonTimeline',
        component: () => import('../views/viewer/PersonTimeline.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
