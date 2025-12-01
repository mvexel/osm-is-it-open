import type { CSSProperties } from 'react'

export function IconClockX({ size = 16, style }: { size?: number, style?: CSSProperties }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M20.926 13.15a9 9 0 1 0 -7.813 7.845" />
      <path d="M12 7v5l3 3" />
      <path d="M22 22l-5 -5" />
      <path d="M17 22l5 -5" />
    </svg>
  )
}
