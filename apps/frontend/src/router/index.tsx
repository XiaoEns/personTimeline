import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'

const AdminLayout = lazy(() => import('@/layouts/AdminLayout'))
const ViewerLayout = lazy(() => import('@/layouts/ViewerLayout'))
const PersonList = lazy(() => import('@/pages/admin/PersonList'))
const EventList = lazy(() => import('@/pages/admin/EventList'))
const UploadedFilesPage = lazy(() => import('@/pages/admin/UploadedFilesPage'))
const ChunkListPage = lazy(() => import('@/pages/admin/ChunkListPage'))
const PersonTimeline = lazy(() => import('@/pages/viewer/PersonTimeline'))
const PersonGitTree = lazy(() => import('@/pages/viewer/PersonGitTree'))

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
          { path: 'upload', element: <UploadedFilesPage /> },
          { path: 'upload/:fileId/chunks', element: <ChunkListPage /> },
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
          { path: 'persons/:id/git-tree', element: <PersonGitTree /> },
        ],
      },
    ],
  },
])
