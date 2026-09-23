// One table style for the whole app — the class-B astrologer grids all differ
// today. Consistent header, zebra rows, tabular numerals, right-aligned numbers,
// horizontal scroll on overflow so nothing clips the page.
import type { ReactNode } from 'react'
import { space, type as t, devanagari } from './tokens'

export interface Column<Row> {
  key: string
  header: ReactNode
  align?: 'left' | 'right' | 'center'
  render?: (row: Row, i: number) => ReactNode
  width?: number | string
}

interface Props<Row> {
  columns: Column<Row>[]
  rows: Row[]
  minWidth?: number
  rowKey?: (row: Row, i: number) => string | number
}

export default function DataTable<Row extends Record<string, any>>({
  columns, rows, minWidth = 0, rowKey,
}: Props<Row>) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', minWidth, borderCollapse: 'collapse', ...t.small }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)' }}>
            {columns.map(c => (
              <th key={c.key} style={{
                ...t.label, color: 'var(--text3)', textAlign: c.align ?? 'left',
                padding: `${space.xs + 2}px ${space.sm}px`, whiteSpace: 'nowrap',
                width: c.width, fontFamily: devanagari,
              }}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={rowKey ? rowKey(row, i) : i} style={{
              borderBottom: '1px solid var(--border)',
              background: i % 2 ? 'var(--surface2)' : 'transparent',
            }}>
              {columns.map(c => (
                <td key={c.key} style={{
                  padding: `${space.xs + 2}px ${space.sm}px`, textAlign: c.align ?? 'left',
                  fontVariantNumeric: c.align === 'right' ? 'tabular-nums' : undefined,
                  color: 'var(--text2)', fontFamily: devanagari,
                }}>{c.render ? c.render(row, i) : row[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
