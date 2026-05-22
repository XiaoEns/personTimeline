import { memo } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'

type PersonHeaderData = {
  person: string
  color: string
  orientation: string
}

type PersonHeaderNodeType = Node<PersonHeaderData>

export default memo(function PersonHeaderNode({ data }: NodeProps<PersonHeaderNodeType>) {
  const isH = data.orientation !== 'vertical'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 14px',
        borderRadius: 20,
        background: '#fff',
        border: `2px solid ${data.color}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        fontSize: 14,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        cursor: 'default',
        color: data.color,
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: data.color,
          flexShrink: 0,
        }}
      />
      {data.person}

      <Handle
        type="source"
        position={isH ? Position.Right : Position.Bottom}
        id={isH ? 'right' : 'bottom'}
        style={{
          width: 8,
          height: 8,
          background: data.color,
          border: 'none',
          ...(isH ? { right: -4 } : { bottom: -4 }),
        }}
      />
    </div>
  )
})
