/**
 * Print/PDF export for Jyotish chart reports.
 * Uses browser print with print-specific CSS.
 */

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#B45309', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E'
}

function planetRow(name: string, pd: any, house: number): string {
  const c = PLANET_COLORS[name] || '#333'
  const statusBadge = pd.status && pd.status !== 'neutral'
    ? `<span style="font-size:9px;padding:1px 5px;border-radius:8px;background:${pd.status === 'exalted' ? '#dcfce7' : '#fee2e2'};color:${pd.status === 'exalted' ? '#166534' : '#991b1b'}">${pd.status}</span>`
    : ''
  return `
    <tr>
      <td style="padding:5px 8px;font-weight:700;color:${c}">${name}${pd.retrograde ? ' <small>℞</small>' : ''}</td>
      <td style="padding:5px 8px">${pd.sign} ${pd.degree?.toFixed ? pd.degree.toFixed(2) : pd.degree}°</td>
      <td style="padding:5px 8px;font-weight:600">H${house}</td>
      <td style="padding:5px 8px;font-size:11px;color:#666">${pd.nakshatra || ''}</td>
      <td style="padding:5px 8px">${statusBadge}</td>
    </tr>`
}

function dashaRow(d: any, active: boolean): string {
  return `
    <tr style="${active ? 'background:#f5f3ff;font-weight:700' : ''}">
      <td style="padding:4px 8px;color:${PLANET_COLORS[d.lord] || '#333'}">${d.lord}</td>
      <td style="padding:4px 8px">${d.start?.slice(0, 7) || ''}</td>
      <td style="padding:4px 8px">${d.end?.slice(0, 7) || ''}</td>
      <td style="padding:4px 8px">${d.years?.toFixed(1) || ''}y</td>
      <td style="padding:4px 8px">${active ? '<span style="color:#5746af;font-weight:700">▶ Active</span>' : ''}</td>
    </tr>`
}

function yogaRow(y: any): string {
  return `
    <tr>
      <td style="padding:4px 8px;font-weight:600;color:#1e40af">${y.name || ''}</td>
      <td style="padding:4px 8px;font-size:11px;color:#555">${y.description?.slice(0, 80) || ''}${(y.description?.length || 0) > 80 ? '...' : ''}</td>
      <td style="padding:4px 8px;font-size:11px">${y.planets?.join(', ') || ''}</td>
    </tr>`
}

function nakshatraRow(name: string, pd: any): string {
  if (!pd?.nakshatra) return ''
  const c = PLANET_COLORS[name] || '#333'
  return `<tr>
    <td style="padding:4px 8px;font-weight:700;color:${c}">${name}</td>
    <td style="padding:4px 8px">${pd.nakshatra || '—'}</td>
    <td style="padding:4px 8px">${pd.nakshatra_pada || '—'}</td>
    <td style="padding:4px 8px;font-size:11px;color:#555">${pd.nakshatra_lord || '—'}</td>
  </tr>`
}

function shadbalaRow(name: string, sb: any): string {
  if (!sb) return ''
  const c = PLANET_COLORS[name] || '#333'
  const total = sb.total_shadbala || sb.total || 0
  const pct = Math.min(100, (total / 600) * 100)
  const barColor = pct > 60 ? '#16A34A' : pct > 40 ? '#F59E0B' : '#DC2626'
  return `<tr>
    <td style="padding:4px 8px;font-weight:700;color:${c}">${name}</td>
    <td style="padding:4px 8px">${total.toFixed ? total.toFixed(1) : total}</td>
    <td style="padding:4px 8px">
      <div style="width:80px;height:8px;background:#e5e5e5;border-radius:4px;overflow:hidden">
        <div style="width:${pct}%;height:100%;background:${barColor};border-radius:4px"></div>
      </div>
    </td>
    <td style="padding:4px 8px;font-size:11px;color:#555">${sb.sthana_bala?.toFixed ? sb.sthana_bala.toFixed(1) : '—'} · ${sb.dig_bala?.toFixed ? sb.dig_bala.toFixed(1) : '—'} · ${sb.kala_bala?.toFixed ? sb.kala_bala.toFixed(1) : '—'}</td>
  </tr>`
}

export function generatePrintHTML(chart: any, dashas: any[], yogas: any[] = [], extra?: { shadbala?: any; panchanga?: any; ashtakavarga?: any }): string {
  const now = new Date()
  const isNow = (start: string, end: string) => new Date(start) <= now && now <= new Date(end)
  const planets = chart.planets || {}
  const asc = chart.ascendant || {}
  const phm = chart.planet_house_map || {}

  // Reverse map planet -> house
  const planetHouse: Record<string, number> = {}
  for (const [h, ps] of Object.entries(phm)) {
    for (const p of (ps as string[])) {
      planetHouse[p] = parseInt(h)
    }
  }

  const planetList = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu']

  const planetRows = planetList
    .filter(p => planets[p])
    .map(p => planetRow(p, planets[p], planetHouse[p] || planets[p]?.house || 0))
    .join('')

  const nakshatraRows = planetList
    .filter(p => planets[p]?.nakshatra)
    .map(p => nakshatraRow(p, planets[p]))
    .join('')

  const dashaRows = dashas.map(d => dashaRow(d, isNow(d.start, d.end))).join('')

  const yogaRows = yogas.slice(0, 20).map(yogaRow).join('')

  const sb = extra?.shadbala?.shadbala || {}
  const shadbalaRows = planetList
    .filter(p => sb[p])
    .map(p => shadbalaRow(p, sb[p]))
    .join('')

  const panch = extra?.panchanga || {}
  const av = extra?.ashtakavarga?.sarvashtakavarga || {}

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Jyotish Chart — ${chart.name || 'Native'}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Georgia', serif; font-size: 13px; color: #1a1a1a; background: #fff; padding: 20px; }
  .page { max-width: 800px; margin: 0 auto; }
  h1 { font-size: 22px; font-weight: 800; color: #1a1a1a; }
  h2 { font-size: 14px; font-weight: 700; color: #5746af; text-transform: uppercase; letter-spacing: 0.06em; margin: 18px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #5746af22; }
  h3 { font-size: 12px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 0.05em; margin: 12px 0 6px; }
  .header { border-bottom: 3px solid #5746af; padding-bottom: 14px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end; }
  .header-right { text-align: right; font-size: 11px; color: #888; }
  .logo { font-size: 28px; font-weight: 900; letter-spacing: -1px; }
  .logo .dev { font-family: serif; }
  .meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
  .meta-item { padding: 10px 12px; background: #f8f7ff; border-radius: 8px; border-left: 3px solid #5746af; }
  .meta-label { font-size: 9px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.06em; }
  .meta-value { font-size: 14px; font-weight: 800; color: #1a1a1a; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { padding: 6px 8px; text-align: left; font-size: 10px; font-weight: 700; color: #888; text-transform: uppercase; border-bottom: 2px solid #e5e5e5; }
  tr:nth-child(even) { background: #fafafa; }
  .section { margin-bottom: 22px; }
  .house-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
  .house-cell { padding: 8px; border: 1px solid #e5e5e5; border-radius: 6px; font-size: 11px; }
  .house-num { font-size: 9px; font-weight: 700; color: #888; }
  .planets-in-house { color: #1a1a1a; font-weight: 600; margin-top: 3px; }
  .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e5e5; font-size: 10px; color: #aaa; display: flex; justify-content: space-between; }
  .asc-badge { display: inline-block; padding: 2px 10px; background: #5746af18; color: #5746af; border-radius: 20px; font-size: 11px; font-weight: 700; }
  @media print {
    body { padding: 10px; font-size: 11px; }
    .page { max-width: 100%; }
    h2 { margin-top: 12px; }
    .section { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div>
      <div class="logo">Jyo·<span class="dev">तिष</span></div>
      <div style="font-size:12px;color:#888;margin-top:2px">Vedic Astrology Chart Report</div>
    </div>
    <div class="header-right">
      Generated: ${now.toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}<br>
      ${now.toLocaleTimeString('en-IN')}
    </div>
  </div>

  <!-- Meta -->
  <div class="meta">
    <div class="meta-item">
      <div class="meta-label">Native</div>
      <div class="meta-value">${chart.name || '—'}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Birth</div>
      <div class="meta-value" style="font-size:11px">${chart.birth || '—'}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Place</div>
      <div class="meta-value" style="font-size:11px">${chart.place || '—'}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Ayanamsa</div>
      <div class="meta-value">${chart.ayanamsa || 'Lahiri'}</div>
    </div>
  </div>

  <!-- Ascendant -->
  <div style="margin-bottom:14px">
    <span class="asc-badge">Lagna: ${asc.sign || '—'} ${asc.degree?.toFixed ? asc.degree.toFixed(2) : ''}°</span>
    ${chart.atmakaraka ? `<span class="asc-badge" style="margin-left:8px">Atmakaraka: ${chart.atmakaraka}</span>` : ''}
  </div>

  <!-- House Map -->
  <div class="section">
    <h2>Planetary Positions</h2>
    <table>
      <thead>
        <tr><th>Planet</th><th>Sign & Degree</th><th>House</th><th>Nakshatra</th><th>Status</th></tr>
      </thead>
      <tbody>${planetRows}</tbody>
    </table>
  </div>

  <!-- House overview -->
  <div class="section">
    <h2>House Occupancy</h2>
    <div class="house-grid">
      ${Array.from({length:12}, (_,i) => {
        const h = i + 1
        const ps: string[] = phm[h] || phm[String(h)] || []
        const signIdx = (asc.sign_index !== undefined ? (asc.sign_index + i) % 12 : i)
        const signs = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"]
        return `<div class="house-cell">
          <div class="house-num">H${h} · ${signs[signIdx]}</div>
          <div class="planets-in-house">${ps.length ? ps.join(', ') : '—'}</div>
        </div>`
      }).join('')}
    </div>
  </div>

  <!-- Nakshatra -->
  ${nakshatraRows ? `
  <div class="section" style="page-break-before:auto">
    <h2>Nakshatra Positions</h2>
    <table>
      <thead><tr><th>Planet</th><th>Nakshatra</th><th>Pada</th><th>Nakshatra Lord</th></tr></thead>
      <tbody>${nakshatraRows}</tbody>
    </table>
  </div>` : ''}

  <!-- Panchanga -->
  ${panch.tithi ? `
  <div class="section">
    <h2>Panchanga at Birth</h2>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px">
      ${['tithi','vara','nakshatra','yoga','karana'].map(k => panch[k] ? `
        <div style="padding:8px;background:#f8f7ff;border-radius:6px;text-align:center">
          <div style="font-size:9px;font-weight:700;color:#888;text-transform:uppercase">${k}</div>
          <div style="font-size:12px;font-weight:700;margin-top:3px">${typeof panch[k] === 'object' ? panch[k].name || JSON.stringify(panch[k]) : panch[k]}</div>
        </div>` : '').join('')}
    </div>
  </div>` : ''}

  <!-- Dashas -->
  ${dashas.length ? `
  <div class="section" style="page-break-before:always">
    <h2>Vimshottari Dasha Timeline</h2>
    <table>
      <thead><tr><th>Mahadasha</th><th>Start</th><th>End</th><th>Duration</th><th></th></tr></thead>
      <tbody>${dashaRows}</tbody>
    </table>
  </div>` : ''}

  <!-- Yogas -->
  ${yogaRows ? `
  <div class="section">
    <h2>Active Yogas</h2>
    <table>
      <thead><tr><th>Yoga</th><th>Description</th><th>Planets</th></tr></thead>
      <tbody>${yogaRows}</tbody>
    </table>
  </div>` : ''}

  <!-- Shadbala -->
  ${shadbalaRows ? `
  <div class="section">
    <h2>Shadbala — Planetary Strength</h2>
    <table>
      <thead><tr><th>Planet</th><th>Total (Rupas)</th><th>Strength</th><th>Sthana · Dig · Kala</th></tr></thead>
      <tbody>${shadbalaRows}</tbody>
    </table>
  </div>` : ''}

  <!-- Ashtakavarga -->
  ${Object.keys(av).length ? `
  <div class="section">
    <h2>Sarvashtakavarga — House Scores</h2>
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px">
      ${Array.from({length:12},(_,i) => {
        const h = i + 1
        const score = av[h] || av[String(h)] || 0
        const color = score >= 30 ? '#16A34A' : score >= 25 ? '#F59E0B' : '#DC2626'
        return `<div style="text-align:center;padding:8px;background:#f8f7ff;border-radius:6px">
          <div style="font-size:9px;color:#888">H${h}</div>
          <div style="font-size:18px;font-weight:800;color:${color}">${score}</div>
        </div>`
      }).join('')}
    </div>
    <div style="font-size:10px;color:#888;margin-top:6px">≥30 strong · 25-29 average · &lt;25 weak</div>
  </div>` : ''}

  <!-- Footer -->
  <div class="footer">
    <div>Jyo·तिष — Vedic Astrology Engine · jyotish.app</div>
    <div>Chart of ${chart.name || 'Native'} · ${chart.birth || ''}</div>
  </div>

</div>
</body>
</html>`
}

export function printChart(chart: any, dashas: any[], yogas: any[] = [], extra?: any) {
  const html = generatePrintHTML(chart, dashas, yogas, extra)
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) { alert('Please allow popups to print the chart.'); return }
  win.document.write(html)
  win.document.close()
  win.onload = () => { win.focus(); win.print() }
}

export function downloadPDF(chart: any, dashas: any[], yogas: any[] = [], extra?: any) {
  printChart(chart, dashas, yogas, extra)
}

interface Props {
  chart: any
  dashas?: any[]
  yogas?: any[]
  compact?: boolean
}

export default function PrintExportButton({ chart, dashas = [], yogas = [], compact }: Props) {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        onClick={() => printChart(chart, dashas, yogas)}
        title="Print or save as PDF"
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: compact ? '6px 12px' : '8px 16px',
          borderRadius: '8px', border: '1px solid var(--border)',
          background: 'var(--surface)', color: 'var(--text2)',
          fontSize: compact ? '12px' : '13px', fontWeight: '600', cursor: 'pointer',
          transition: 'all .15s',
        }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
        {compact ? 'Print' : 'Print / PDF'}
      </button>
    </div>
  )
}
