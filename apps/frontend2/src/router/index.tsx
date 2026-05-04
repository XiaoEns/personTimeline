import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'

const AdminLayout = lazy(() => import('@/layouts/AdminLayout'))
const ViewerLayout = lazy(() => import('@/layouts/ViewerLayout'))
const PersonList = lazy(() => import('@/pages/admin/PersonList'))
const EventList = lazy(() => import('@/pages/admin/EventList'))
const UploadPage = lazy(() => import('@/pages/admin/UploadPage'))
const PersonTimeline = lazy(() => import('@/pages/viewer/PersonTimeline'))

function SuspenseWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-gray-400">加载中...</div>}>
      <Outlet />
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/admin" replace />,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        element: <SuspenseWrapper />,
        children: [
          { index: true, element: <Navigate to="/admin/persons" replace /> },
          { path: 'persons', element: <PersonList /> },
          { path: 'events', element: <EventList /> },
          { path: 'upload', element: <UploadPage /> },
        ],
      },
    ],
  },
  {
    path: '/view',
    element: <ViewerLayout />,
    children: [
      {
        element: <SuspenseWrapper />,
        children: [
          { index: true, element: <Navigate to="/admin" replace /> },
          { path: 'persons/:id', element: <PersonTimeline /> },
        ],
      },
    ],
  },
])
