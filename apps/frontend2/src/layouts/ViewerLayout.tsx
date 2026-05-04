import { Link, Outlet } from 'react-router-dom'

export default function ViewerLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="flex h-14 items-center border-b bg-white px-6">
        <Link to="/admin" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
          &larr; 返回管理
        </Link>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
