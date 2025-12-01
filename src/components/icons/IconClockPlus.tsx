import type { CSSProperties } from 'react'

export function IconClockPlus({ size = 16, style }: { size?: number, style?: CSSProperties }) {
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
      <path d="M20.984 12.535a9 9 0 1 0 -8.431 8.448" />
      <path d="M12 7v5l3 3" />
      <path d="M16 19h6" />
      <path d="M19 16v6" />
    </svg>
  )
}
