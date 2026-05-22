import { useState, useMemo, type CSSProperties } from 'react'
import { ReactFlow, Background, Controls, type NodeTypes } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import PersonHeaderNode from './PersonHeaderNode'
import PersonNode from './PersonNode'
import TimelineAxis from './TimelineAxis'
import { buildTimelineGraph } from '@/utils/timelineLayout'

const nodeTypes: NodeTypes = {
  personHeader: PersonHeaderNode,
  eventNode: PersonNode,
  axisLabel: TimelineAxis,
}

interface TimelineCanvasProps {
  /** 画布容器样式，默认占满父容器 */
  style?: CSSProperties
}

export default function TimelineCanvas({ style }: TimelineCanvasProps) {
  const [orientation, setOrientation] = useState('horizontal')

  const { nodes, edges } = useMemo(
    () => buildTimelineGraph(orientation),
    [orientation],
  )

  const isH = orientation === 'horizontal'

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', ...style }}>
      {/* 方向切换按钮 */}
      <button
        onClick={() => setOrientation(isH ? 'vertical' : 'horizontal')}
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 14px',
          borderRadius: 8,
          border: '1px solid #cbd5e1',
          background: '#fff',
          fontSize: 13,
          color: '#334155',
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <span style={{ fontWeight: isH ? 600 : 400 }}>水平</span>
        <span style={{ color: '#94a3b8' }}>/</span>
        <span style={{ fontWeight: isH ? 400 : 600 }}>垂直</span>
      </button>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        key={orientation}
      >
        <Background color="#e2e8f0" gap={20} />
        <Controls />
      </ReactFlow>
    </div>
  )
}
