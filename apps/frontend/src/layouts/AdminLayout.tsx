import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { label: '人物管理', path: '/admin/persons' },
  { label: '事件管理', path: '/admin/events' },
  { label: '上传与抽取', path: '/admin/upload' },
]

export default function AdminLayout() {
  return (
    <div className="flex h-screen">
      <aside className="w-56 shrink-0 border-r bg-white">
        <div className="flex h-14 items-center border-b px-4">
          <h1 className="text-lg font-bold">personTimeline</h1>
        </div>
        <nav className="p-2">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center border-b bg-white px-6">
          <span className="text-sm text-gray-500">管理后台</span>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
