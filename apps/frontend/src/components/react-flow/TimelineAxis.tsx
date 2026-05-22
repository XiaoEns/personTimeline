import { memo } from 'react'
import type { Node, NodeProps } from '@xyflow/react'

type TimelineAxisData = {
  year: number
  orientation: string
}

type TimelineAxisNodeType = Node<TimelineAxisData>

export default memo(function TimelineAxis({ data }: NodeProps<TimelineAxisNodeType>) {
  const isH = data.orientation !== 'vertical'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isH ? 'column' : 'row',
        alignItems: 'center',
        fontSize: 12,
        color: '#64748b',
        whiteSpace: 'nowrap',
        cursor: 'default',
        userSelect: 'none',
        gap: isH ? 0 : 6,
      }}
    >
      <span
        style={
          isH
            ? { width: 1, height: 10, background: '#94a3b8', marginBottom: 2 }
            : { width: 10, height: 1, background: '#94a3b8', marginRight: 2 }
        }
      />
      <span>{data.year}</span>
    </div>
  )
})
