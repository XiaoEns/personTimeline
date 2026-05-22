import { memo, useState } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'

type EventNodeData = {
  label: string
  date: string
  end_date: string
  timeType: string
  persons: string[]
  eventId: number
  orientation: string
}

type EventNodeType = Node<EventNodeData>

function formatDate(dateStr: string): string {
  return dateStr.split(' ')[0]
}

export default memo(function PersonNode({ data, selected }: NodeProps<EventNodeType>) {
  const isH = data.orientation !== 'vertical'
  const isDuration = data.timeType === 'DURATION' || data.timeType === 'PERIOD'
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: hovered ? '8px 14px' : '4px 10px',
        borderRadius: isDuration ? 14 : 8,
        background: selected ? '#f8fafc' : '#fff',
        border: selected
          ? '2px solid #6366f1'
          : hovered
            ? '1px solid #6366f1'
            : '1px solid #cbd5e1',
        boxShadow: selected
          ? '0 0 0 3px rgba(99,102,241,0.2)'
          : hovered
            ? '0 0 0 3px rgba(99,102,241,0.2)'
            : '0 2px 6px rgba(0,0,0,0.1)',
        fontSize: 13,
        whiteSpace: 'nowrap',
        cursor: 'default',
        transition: 'border-color 0.15s, box-shadow 0.15s, padding 0.15s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ color: '#1e293b', fontWeight: 600, fontSize: 13 }}>
        {data.label}
      </span>
      {hovered && (
        <>
          <span style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}>
            {formatDate(data.date)}
            {isDuration && data.end_date && ` ~ ${formatDate(data.end_date)}`}
          </span>
          <div
            style={{
              display: 'flex',
              gap: 3,
              marginTop: 4,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {data.persons.map((p) => (
              <span
                key={p}
                style={{
                  fontSize: 10,
                  padding: '1px 6px',
                  borderRadius: 10,
                  background: '#e2e8f0',
                  color: '#475569',
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </>
      )}

      <Handle
        type="target"
        position={isH ? Position.Left : Position.Top}
        id={isH ? 'left' : 'top'}
        style={{
          width: 8, height: 8, background: '#6366f1', border: 'none',
          ...(isH ? { left: -4 } : { top: -4 }),
        }}
      />
      <Handle
        type="source"
        position={isH ? Position.Right : Position.Bottom}
        id={isH ? 'right' : 'bottom'}
        style={{
          width: 8, height: 8, background: '#6366f1', border: 'none',
          ...(isH ? { right: -4 } : { bottom: -4 }),
        }}
      />
      <Handle
        type="target"
        position={isH ? Position.Top : Position.Left}
        id={isH ? 'top' : 'left'}
        style={{
          width: 8, height: 8, background: '#94a3b8', border: 'none',
          ...(isH ? { top: -4 } : { left: -4 }),
        }}
      />
      <Handle
        type="source"
        position={isH ? Position.Bottom : Position.Right}
        id={isH ? 'bottom' : 'right'}
        style={{
          width: 8, height: 8, background: '#94a3b8', border: 'none',
          ...(isH ? { bottom: -4 } : { right: -4 }),
        }}
      />
    </div>
  )
})
