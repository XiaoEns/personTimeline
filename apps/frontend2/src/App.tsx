import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'

export default function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <RouterProvider router={router} />
    </ConfigProvider>
  )
}
