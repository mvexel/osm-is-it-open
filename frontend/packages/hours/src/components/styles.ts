import type { CSSProperties } from 'react'
import type { OpeningStatus } from '../index'

export const statusStyles: Record<OpeningStatus, { bg: string; text: string }> = {
  open: { bg: '#dcfce7', text: '#166534' },
  closed: { bg: '#fee2e2', text: '#991b1b' },
  unknown: { bg: '#e5e7eb', text: '#374151' },
}

export const badgeStyle = (styles: { bg: string; text: string }): CSSProperties => ({
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2px',
  padding: '8px 12px',
  borderRadius: '6px',
  background: styles.bg,
  color: styles.text,
  minWidth: '140px',
  textAlign: 'center',
})

export const editorStyle: CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '8px',
  background: '#ffffff',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  width: '100%',
}

export const changedStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: '#fef9c3',
  border: '1px solid #fde68a',
  color: '#92400e',
  borderRadius: 8,
  padding: '6px 8px',
  fontSize: 12,
}

export const invalidStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  background: '#fee2e2',
  border: '1px solid #fecaca',
  color: '#991b1b',
  borderRadius: 8,
  padding: '6px 8px',
  fontSize: 12,
}

export const additionalRulesStyle: CSSProperties = {
  padding: '4px 6px 8px',
}

export const additionalRulesLabelStyle: CSSProperties = {
  display: 'grid',
  gap: 4,
}

export const additionalRulesTextStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #cbd5e1',
  fontSize: 14,
  fontFamily: 'monospace',
}

export const outputContainerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 2px',
}

export const outputToggleStyle: CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: '#0f172a',
  fontSize: 11,
  cursor: 'pointer',
  padding: '2px 4px',
}

export const outputCodeContainerStyle: CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 10,
  padding: '8px 10px',
  background: '#f8fafc',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  minHeight: 44,
}

export const outputCodeStyle: CSSProperties = {
  fontFamily: 'monospace',
  fontSize: 11,
  color: '#0f172a',
  wordBreak: 'break-word',
}
