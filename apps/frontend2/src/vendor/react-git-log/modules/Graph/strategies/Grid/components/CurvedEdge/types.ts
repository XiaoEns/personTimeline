import type { CSSProperties } from 'react'

export interface CurvedEdgeProps {
  id: string
  colour: string
  path: string
  dashed?: boolean
  /** 附加到 SVG 元素上的定位样式 */
  style?: CSSProperties
}