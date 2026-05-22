import { useParams } from 'react-router-dom'
import TimelineCanvas from '@/components/react-flow/TimelineCanvas'

/**
 * 人物事件画布页面
 * 使用 ReactFlow 泳道式时间轴展示人物事件
 * TODO: 后续对接真实 API 数据替换 demo 测试数据
 */
export default function PersonCanvas() {
  const { id: _personId } = useParams<{ id: string }>()
  void _personId // TODO: 后续对接真实 API 数据时使用

  return (
    <div className="relative flex-1 min-h-0">
      <TimelineCanvas style={{ position: 'absolute', inset: 0 }} />
    </div>
  )
}
