import { useState, useEffect } from 'react'
import { getChart } from './api/jyotish'
import type { BirthData, ChartResponse } from './api/jyotish'
import { chartsApi, authApi } from './api/client'
import { useAuth } from './store/auth'
import BirthForm from './components/BirthForm'
import DashaTimeline from './components/DashaTimeline'
import LiveSky from './components/LiveSky'
import YogaCards from './components/YogaCards'
import VargaCharts from './components/VargaCharts'
import DivisionalBoard from './components/DivisionalBoard'
import ShadbalaTable from './components/ShadbalaTable'
import CRMPanel from './components/CRMPanel'
import ResearchLab from './components/ResearchLab'
import AIChat from './components/AIChat'
import AuthPage from './components/AuthPage'
import SavedCharts from './components/SavedCharts'
import PrashnaPanel from './components/PrashnaPanel'
import ErrorBoundary from './components/ErrorBoundary'
import TransitPanel from './components/TransitPanel'
import AshtakavargaPanel from './components/AshtakavargaPanel'
import InterpretationPanel from './components/InterpretationPanel'
import DashaPredictionPanel from './components/DashaPredictionPanel'
import CompatibilityPanel from './components/CompatibilityPanel'
import PanchangaCard from './components/PanchangaCard'
import DoshaPanel from './components/DoshaPanel'
import ChartComparisonPanel from './components/ChartComparisonPanel'
import VarshaphalPanel from './components/VarshaphalPanel'
import MuhurtaPanel from './components/MuhurtaPanel'
import KPPanel from './components/KPPanel'
import ArudhaPanel from './components/ArudhaPanel'
import YoginiDashaPanel from './components/YoginiDashaPanel'
import AspectsPanel from './components/AspectsPanel'
import CharaDashaPanel from './components/CharaDashaPanel'
import SarvatobhadraPanel from './components/SarvatobhadraPanel'
import BhavaChaliPanel from './components/BhavaChaliPanel'
import JaiminiPanel from './components/JaiminiPanel'
import CombustionPanel from './components/CombustionPanel'
import SudarshanPanel from './components/SudarshanPanel'
import AshtottariPanel from './components/AshtottariPanel'
import NarayanaPanel from './components/NarayanaPanel'
import SpecialLagnaPanel from './components/SpecialLagnaPanel'
import DignityPanel from './components/DignityPanel'
import KalachakraPanel from './components/KalachakraPanel'
import ShoolaPanel from './components/ShoolaPanel'
import KotaChakraPanel from './components/KotaChakraPanel'
import GocharaPanel from './components/GocharaPanel'
import BhavaMadhyaPanel from './components/BhavaMadhyaPanel'
import UpagrahaPanel from './components/UpagrahaPanel'
import TransitHitPanel from './components/TransitHitPanel'
import TithiPraveshaPanel from './components/TithiPraveshaPanel'
import SahamPanel from './components/SahamPanel'
import AyurdayaPanel from './components/AyurdayaPanel'
import JaiminiAspectPanel from './components/JaiminiAspectPanel'
import PlanetInterpretationDrawer from './components/PlanetInterpretation'
import PrintExportButton from './components/PrintExport'
import LanguageToggle from './components/LanguageToggle'
import { useLang } from './contexts/LanguageContext'
import SaptarishiPanel from './components/SaptarishiPanel'
import PanchaPakshiPanel from './components/PanchaPakshiPanel'
import LagneshPanel from './components/LagneshPanel'
import TransitNatalPanel from './components/TransitNatalPanel'
import RemediesPanel from './components/RemediesPanel'
import MiscDashaPanel from './components/MiscDashaPanel'
import HoraVariantsPanel from './components/HoraVariantsPanel'
import VimshopakaBhavaPanel from './components/VimshopakaBhavaPanel'
import RectificationPanel from './components/RectificationPanel'
import VargaDashaPanel from './components/VargaDashaPanel'
import ClassicalTextsPanel from './components/ClassicalTextsPanel'
import FamousChartsPanel from './components/FamousChartsPanel'
import NumerologyPanel from './components/NumerologyPanel'
import PredictionTrackerPanel from './components/PredictionTrackerPanel'
import EphemerisExportPanel from './components/EphemerisExportPanel'
import DashaTransitOverlayPanel from './components/DashaTransitOverlayPanel'
import AvasthaPanel from './components/AvasthaPanel'
import KarakamshaPanel from './components/KarakamshaPanel'
import ArgalaPanel from './components/ArgalaPanel'
import ConditionalDashaPanel from './components/ConditionalDashaPanel'
import UpapadaPanel from './components/UpapadaPanel'
import VarnadaPanel from './components/VarnadaPanel'
import DashaTriColumn from './components/DashaTriColumn'
import AstrologerProfileSettings from './components/business/AstrologerProfileSettings'
import ReportBuilderModal from './components/business/ReportBuilderModal'
import ClientPortalPage from './components/business/ClientPortalPage'
import GemShopPanel from './components/business/GemShopPanel'
import EarningsPanel from './components/business/EarningsPanel'
import GemPickerForClient from './components/business/GemPickerForClient'
import GemPurchasePage from './components/business/GemPurchasePage'

type Tab ='chart' | 'interpret' | 'dasha_predict' | 'vargas' | 'dasha' | 'yogas' | 'shadbala' | 'planets' | 'sky' | 'saved' | 'crm' | 'research' | 'ai' | 'prashna' | 'transit' | 'ashtakavarga' | 'compatibility' | 'doshas' | 'synastry' | 'varshaphal' | 'muhurta' | 'kp' | 'arudha' | 'yogini' | 'aspects' | 'chara' | 'sbc' | 'bhava' | 'jaimini' | 'combustion' | 'sudarshan' | 'ashtottari' | 'narayana' | 'special' | 'dignity' | 'kalachakra' | 'shoola' | 'kota' | 'gochara' | 'madhya' | 'upagraha' | 'transit_hits' | 'tithi' | 'sahams' | 'ayurdaya' | 'jaimini_asp' | 'saptarishi' | 'pancha_pakshi' | 'lagnesh' | 'transit_natal' | 'remedies' | 'misc_dasha' | 'hora_variants' | 'vimshopaka' | 'rectification' | 'varga_dasha' | 'classical' | 'famous_charts' | 'numerology' | 'predictions' | 'ephemeris' | 'dasha_transit' | 'avasthas' | 'karakamsha' | 'argala' | 'conditional_dasha' | 'upapada' | 'varnada' | 'dasha_3col' | 'profile' | 'gems' | 'earnings'

// Grouped tab menu — each group renders as a dropdown in the sub-tab bar.
// icon is kept separate from label so `label` stays a plain-English i18n key
// that resolves through t() → Hindi/Sanskrit. Emoji never enters the dictionary.
type TabItem = { id: Tab; label: string; icon?: string }
type TabGroup = { label: string; tabs: TabItem[] }

const TAB_GROUPS: TabGroup[] = [
  { label: 'Chart', tabs: [
    { id: 'chart',        label: 'Birth Chart' },
    { id: 'planets',      label: 'Planets Table' },
    { id: 'vargas',       label: 'D9 / Vargas' },
    { id: 'bhava',        label: 'Bhava Chalit' },
    { id: 'madhya',       label: 'Bhava Madhya' },
    { id: 'sky',          label: 'Live Sky' },
  ]},
  { label: 'Dasha', tabs: [
    { id: 'dasha',        label: 'Vimshottari' },
    { id: 'dasha_predict', label: 'Dasha Predictions', icon: '🔮' },
    { id: 'dasha_3col',   label: '3-Level View', icon: '⊞' },
    { id: 'yogini',       label: 'Yogini' },
    { id: 'chara',        label: 'Chara (Jaimini)' },
    { id: 'narayana',     label: 'Narayana' },
    { id: 'ashtottari',   label: 'Ashtottari' },
    { id: 'kalachakra',   label: 'Kalachakra' },
    { id: 'shoola',       label: 'Shoola / Niryana' },
    { id: 'misc_dasha',        label: 'Sthira · Moola · Tara' },
    { id: 'conditional_dasha', label: 'Conditional Dashas', icon: '🔀' },
    { id: 'varga_dasha',  label: 'Varga Dasha (D9/D10…)' },
    { id: 'sudarshan',    label: 'Sudarshana' },
    { id: 'varshaphal',   label: 'Varshaphal', icon: '☀' },
    { id: 'tithi',        label: 'Tithi Pravesha' },
  ]},
  { label: 'Analysis', tabs: [
    { id: 'interpret',    label: 'Interpretation', icon: '🔮' },
    { id: 'yogas',        label: 'Yogas' },
    { id: 'shadbala',     label: 'Shadbala' },
    { id: 'aspects',      label: 'Aspects' },
    { id: 'arudha',       label: 'Arudha Lagnas' },
    { id: 'jaimini',      label: 'Jaimini Karakas' },
    { id: 'karakamsha',   label: 'Karakamsha', icon: '🔱' },
    { id: 'argala',       label: 'Argala', icon: '⚡' },
    { id: 'upapada',      label: 'Upapada (UL)', icon: '💍' },
    { id: 'varnada',      label: 'Varnada Lagna', icon: '⌛' },
    { id: 'special',      label: 'Special Lagnas' },
    { id: 'dignity',      label: 'Dignity Table' },
    { id: 'doshas',       label: 'Doshas', icon: '⚠' },
    { id: 'remedies',     label: 'Remedies', icon: '💊' },
    { id: 'avasthas',     label: 'Avasthas', icon: '🌙' },
    { id: 'combustion',   label: 'Combust / War' },
    { id: 'upagraha',     label: 'Upagrahas' },
    { id: 'ayurdaya',     label: 'Longevity' },
    { id: 'sahams',       label: 'Sahams' },
    { id: 'jaimini_asp',  label: 'Jaimini Aspects' },
    { id: 'lagnesh',      label: 'Lagnesh Analysis' },
    { id: 'saptarishi',   label: 'Saptarishis' },
    { id: 'pancha_pakshi',label: 'Pancha Pakshi' },
  ]},
  { label: 'Transits', tabs: [
    { id: 'transit',      label: 'Transit Chart' },
    { id: 'gochara',      label: 'Gochara' },
    { id: 'transit_hits', label: 'Hit List' },
    { id: 'transit_natal',  label: 'Transit → Natal' },
    { id: 'dasha_transit',  label: 'Dasha ↔ Transit', icon: '🔗' },
    { id: 'ashtakavarga', label: 'Ashtakavarga' },
    { id: 'kota',         label: 'Kota Chakra' },
    { id: 'sbc',          label: 'SBC Chakra' },
  ]},
  { label: 'KP', tabs: [
    { id: 'kp',           label: 'KP System' },
  ]},
  { label: 'Tools', tabs: [
    { id: 'vimshopaka',    label: 'Vimshopaka + Bhava Bala' },
    { id: 'hora_variants', label: 'Hora Methods' },
    { id: 'rectification',  label: 'Birth Rectification', icon: '🔍' },
    { id: 'classical',      label: 'Classical Texts', icon: '📜' },
    { id: 'famous_charts',  label: 'Famous Charts Atlas', icon: '🌟' },
    { id: 'numerology',     label: 'Numerology', icon: '🔢' },
    { id: 'predictions',    label: 'Prediction Tracker', icon: '🎯' },
    { id: 'ephemeris',      label: 'Ephemeris Export', icon: '📥' },
  ]},
]

// Flat list for backwards-compat lookups
const CHART_TABS: TabItem[] = TAB_GROUPS.flatMap(g => g.tabs)

const APP_TABS: TabItem[] = [
  { id: 'prashna',       label: 'Prashna',  icon: '☽' },
  { id: 'muhurta',       label: 'Muhurta',  icon: '✦' },
  { id: 'compatibility', label: 'Match',    icon: '♥' },
  { id: 'synastry',      label: 'Compare',  icon: '⊗' },
  { id: 'saved',         label: 'Saved' },
  { id: 'crm',           label: 'Clients' },
  { id: 'gems',          label: 'Gems',     icon: '💎' },
  { id: 'earnings',      label: 'Earnings', icon: '💰' },
  { id: 'research',      label: 'Research' },
  { id: 'ai',            label: 'AI' },
  { id: 'profile',       label: 'Brand',    icon: '⚙' },
]

// Header sections — the top-level nav. Astrology tools for everyone;
// Business grouped and shown only to the 'astrologer' role.
// businessOnly = requires an active trial / paid plan (the ₹500 Practice tier).
// Gems + Earnings are FREE (referral income for everyone); calculations are free.
type AppSection = { label: string; icon?: string; businessOnly?: boolean; tabs: TabItem[] }
const APP_SECTIONS: AppSection[] = [
  { label: 'Tools', icon: '✦', tabs: [
    { id: 'prashna',       label: 'Prashna',  icon: '☽' },
    { id: 'muhurta',       label: 'Muhurta',  icon: '✦' },
    { id: 'compatibility', label: 'Match',    icon: '♥' },
    { id: 'synastry',      label: 'Compare',  icon: '⊗' },
    { id: 'gems',          label: 'Gems',     icon: '💎' },   // free — referral income
    { id: 'earnings',      label: 'Earnings', icon: '💰' },   // free — your gem commissions
    { id: 'research',      label: 'Research' },
    { id: 'ai',            label: 'AI' },
  ]},
  { label: 'Business', icon: '💼', businessOnly: true, tabs: [
    { id: 'crm',      label: 'Clients' },
    { id: 'profile',  label: 'Brand',    icon: '⚙' },
  ]},
]

// Tabs that need a logged-in account (guests get a sign-in prompt).
const LOGIN_REQUIRED: Tab[] = ['research','ai','crm','gems','earnings','profile','saved','predictions']
// Tabs that need an active trial / paid plan (business-management suite).
const BUSINESS_TABS: Tab[] = ['crm','profile']
const BUSINESS_PLANS = ['trial','practitioner','professional']

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#D97706', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E'
}

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  exalted:     { bg: 'var(--green-bg)',  color: 'var(--green)',  label: '↑ Exalted' },
  debilitated: { bg: 'var(--red-bg)',    color: 'var(--red)',    label: '↓ Debilitated' },
  own_sign:    { bg: 'var(--accent-bg)', color: 'var(--accent)', label: '◈ Own Sign' },
}

// Decorative zodiac sign symbols
const ZODIAC = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓']

export default function App() {
  const { t } = useLang()
  const [chart, setChart] = useState<ChartResponse | null>(null)
  const [birthDataRaw, setBirthDataRaw] = useState<BirthData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('chart')
  const [showForm, setShowForm] = useState(true)
  const [saveMsg, setSaveMsg] = useState('')
  const [chartKey, setChartKey] = useState(0)
  const [chartStyle, setChartStyle] = useState<'north' | 'south' | 'east'>('north')
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null)
  const [openSection, setOpenSection] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)   // mobile drawer
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [showAuthPage, setShowAuthPage] = useState(false)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const { user, logout, loadUser } = useAuth()
  useEffect(() => { loadUser() }, [])

  // Business suite needs an active trial / paid plan (₹500 Practice). Gems + all
  // calculations stay free. Guests are prompted to sign in first.
  const hasBusiness = !!user && BUSINESS_PLANS.includes((user as any).plan)
  const goTab = (id: Tab) => {
    if (!user && LOGIN_REQUIRED.includes(id)) { setShowAuthPage(true); return }
    if (BUSINESS_TABS.includes(id) && !hasBusiness) { setShowUpgrade(true); setOpenSection(null); return }
    setActiveTab(id); setShowForm(false); setOpenSection(null); setMenuOpen(false)
  }

  const handleCalculate = async (data: BirthData) => {
    setLoading(true); setError(''); setBirthDataRaw(data)
    try {
      const result = await getChart(data)
      setChart(result); setChartKey(k => k + 1)
      setShowForm(false); setActiveTab('chart')
      if (!user) setShowSavePrompt(true)   // nudge guests to save & unlock
    } catch {
      setError('Calculation failed — is the backend running on port 8888?')
    } finally { setLoading(false) }
  }

  const handleSaveChart = async () => {
    if (!chart || !birthDataRaw) return
    if (!user) { setShowAuthPage(true); return }
    try {
      const [yr, mo, dy] = chart.birth.split(' ')[0].split('-')
      const [hr, mn] = chart.birth.split(' ')[1].split(':')
      await chartsApi.save({
        name: chart.name,
        birth_date: `${yr}-${mo}-${dy}`, birth_time: `${hr}:${mn}`,
        birth_tz: birthDataRaw.tz_offset,
        birth_place: chart.place || birthDataRaw.place,
        latitude: birthDataRaw.latitude, longitude: birthDataRaw.longitude,
        ayanamsa: chart.ayanamsa,
      })
      setSaveMsg('Saved ✓'); setTimeout(() => setSaveMsg(''), 3000)
    } catch { setSaveMsg('Save failed'); setTimeout(() => setSaveMsg(''), 3000) }
  }

  const getBirthDataForCalc = () => birthDataRaw ? {
    year: birthDataRaw.year, month: birthDataRaw.month, day: birthDataRaw.day,
    hour: birthDataRaw.hour, minute: birthDataRaw.minute,
    tz_offset: birthDataRaw.tz_offset,
    latitude: birthDataRaw.latitude, longitude: birthDataRaw.longitude,
    ayanamsa: chart?.ayanamsa || 'lahiri',
    house_system: birthDataRaw.house_system || 'whole_sign',
    node_type: birthDataRaw.node_type || 'true',
  } : null

  const isAppTab = ['crm','research','saved','ai','prashna','compatibility','synastry','muhurta','profile','gems','earnings'].includes(activeTab) && !chart
  const [showReportModal, setShowReportModal] = useState(false)
  const [showGemPicker, setShowGemPicker] = useState(false)

  // Compute weak planets (debilitated + low dignity) for smart gem suggestion
  const weakPlanets: string[] = chart?.planets ? Object.entries(chart.planets as any)
    .filter(([_, p]: any) => p.status === 'debilitated' || p.retrograde)
    .map(([n]) => n)
    .filter(n => !['Rahu', 'Ketu'].includes(n))
    .slice(0, 3) : []

  // Public client portal route — bypass app shell
  const portalMatch = typeof window !== 'undefined' ? window.location.pathname.match(/^\/portal\/([A-Za-z0-9_-]+)/) : null
  if (portalMatch) {
    return <ClientPortalPage token={portalMatch[1]} />
  }
  // Public gem purchase route
  const gemMatch = typeof window !== 'undefined' ? window.location.pathname.match(/^\/gem-purchase\/([A-Za-z0-9-]+)/) : null
  if (gemMatch) {
    return <GemPurchasePage orderNumber={gemMatch[1]} />
  }

  // App-first: guests land straight on Kundli. The auth page is shown only
  // on demand (header "Log in" button or the save-prompt after calculating).
  if (showAuthPage && !user) {
    return <AuthPage onClose={() => setShowAuthPage(false)} />
  }

  return (
    <div style={{ height: '100svh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <header style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '0 20px', display: 'flex', alignItems: 'center',
        height: '48px', gap: '4px', flexShrink: 0,
        boxShadow: '0 1px 0 var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '16px' }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '6px',
            background: 'linear-gradient(135deg, #5746AF, #8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', color: '#fff', flexShrink: 0,
          }}>✦</div>
          <span style={{ fontWeight: '800', fontSize: '15px', letterSpacing: '-0.02em' }}>
            <span style={{ fontFamily: 'serif' }}>Jyo</span>
            <span style={{ color: 'var(--accent)', fontFamily: 'serif' }}>·</span>
            <span style={{ fontFamily: "'Noto Sans Devanagari', serif", fontWeight: '700' }}>तिष</span>
          </span>
        </div>

        {/* Hamburger — mobile only */}
        <button className="jyo-hamburger" onClick={() => setMenuOpen(true)} aria-label="Menu" style={{
          border: 'none', background: 'transparent', color: 'var(--text)',
          fontSize: '20px', cursor: 'pointer', padding: '4px 8px', lineHeight: 1,
        }}>☰</button>

        <div className="jyo-desktopnav" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <div style={{ width: '1px', height: '16px', background: 'var(--border)', margin: '0 8px' }} />

        {/* Kundli (chart) */}
        {(() => {
          const kundliActive = !APP_TABS.some(t => t.id === activeTab)
          return (
            <button onClick={() => { setActiveTab('chart'); setShowForm(!chart); setOpenSection(null) }} style={{
              padding: '4px 12px', borderRadius: '6px', border: 'none',
              background: kundliActive ? 'var(--hover)' : 'transparent',
              color: kundliActive ? 'var(--text)' : 'var(--text3)',
              cursor: 'pointer', fontSize: '13px', fontWeight: kundliActive ? '600' : '400', transition: 'all .15s',
            }}>{t('Kundli')}</button>
          )
        })()}

        {/* Section dropdowns (Tools, Business) */}
        {APP_SECTIONS.filter(s => !s.businessOnly || !!user).map(section => {
          const active = section.tabs.some(tb => tb.id === activeTab)
          const open = openSection === section.label
          return (
            <div key={section.label} style={{ position: 'relative' }}>
              <button
                onClick={() => setOpenSection(open ? null : section.label)}
                style={{
                  padding: '4px 12px', borderRadius: '6px', border: 'none',
                  background: active || open ? 'var(--hover)' : 'transparent',
                  color: active ? 'var(--text)' : 'var(--text3)',
                  cursor: 'pointer', fontSize: '13px', fontWeight: active ? '600' : '400', transition: 'all .15s',
                }}>{section.icon ? section.icon + ' ' : ''}{t(section.label)} <span style={{ fontSize: '9px', opacity: 0.6 }}>▾</span></button>
              {open && (
                <>
                  {/* click-away backdrop so the menu stays open until you pick or click out */}
                  <div onClick={() => setOpenSection(null)} style={{ position: 'fixed', inset: 0, zIndex: 190 }} />
                  <div style={{ ...menuBox, zIndex: 200 }}>
                    {section.tabs.map(tb => (
                      <div key={tb.id} onClick={() => goTab(tb.id)} style={{
                        ...menuItem,
                        background: activeTab === tb.id ? 'var(--accent-bg)' : 'transparent',
                        color: activeTab === tb.id ? 'var(--accent)' : 'var(--text)',
                      }}
                        onMouseEnter={e => { if (activeTab !== tb.id) e.currentTarget.style.background = 'var(--hover)' }}
                        onMouseLeave={e => { if (activeTab !== tb.id) e.currentTarget.style.background = 'transparent' }}
                      >{tb.icon ? tb.icon + ' ' : ''}{t(tb.label)}</div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )
        })}

        {/* Saved */}
        <button onClick={() => goTab('saved')} style={{
          padding: '4px 12px', borderRadius: '6px', border: 'none',
          background: activeTab === 'saved' ? 'var(--hover)' : 'transparent',
          color: activeTab === 'saved' ? 'var(--text)' : 'var(--text3)',
          cursor: 'pointer', fontSize: '13px', fontWeight: activeTab === 'saved' ? '600' : '400', transition: 'all .15s',
        }}>{t('Saved')}</button>
        </div>{/* /jyo-desktopnav */}

        <div style={{ flex: 1 }} />

        {/* Language — permanently visible */}
        <LanguageToggle />
        <div style={{ width: '1px', height: '16px', background: 'var(--border)', margin: '0 10px' }} />

        {/* New Chart */}
        <button
          onClick={() => { setShowForm(!showForm); if (!showForm) setActiveTab('chart') }}
          style={{
            padding: '5px 12px', borderRadius: '6px', border: 'none',
            background: 'var(--accent)', color: '#fff',
            fontSize: '12.5px', fontWeight: '600', cursor: 'pointer', transition: 'opacity .15s', marginRight: '10px',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          {showForm && chart ? t('Hide form') : chart ? t('+ New Chart') : showForm ? t('Hide') : t('+ New Chart')}
        </button>

        {user ? (
          /* Avatar menu (logged in) */
          <div style={{ position: 'relative' }}>
            <button onClick={() => setAvatarOpen(o => !o)} style={{
              width: '30px', height: '30px', borderRadius: '50%', border: '1px solid var(--border)',
              background: 'linear-gradient(135deg,#5746AF,#8B5CF6)',
              color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{(user.name?.[0] || 'U').toUpperCase()}</button>
            {avatarOpen && (
              <>
                <div onClick={() => setAvatarOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 190 }} />
                <div style={{ ...menuBox, right: 0, left: 'auto', minWidth: '220px', zIndex: 200 }}>
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>{user.name}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text3)' }}>{user.email}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--accent)', marginTop: '2px', textTransform: 'capitalize' }}>{t(user.role === 'user' ? 'Seeker' : 'Astrologer')} · {user.plan}</div>
                  </div>
                  <div onClick={() => { logout(); setAvatarOpen(false) }} style={menuItem}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>{t('Sign out')}</div>
                </div>
              </>
            )}
          </div>
        ) : (
          /* Log in (guest) */
          <button onClick={() => setShowAuthPage(true)} style={{
            padding: '5px 14px', borderRadius: '6px', border: '1px solid var(--accent)',
            background: 'transparent', color: 'var(--accent)',
            fontSize: '12.5px', fontWeight: '600', cursor: 'pointer', transition: 'all .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--accent)' }}
          >{t('Log in')}</button>
        )}
      </header>

      {/* ── Mobile drawer ─────────────────────────────────────────────────── */}
      {menuOpen && (
        <div onClick={e => e.target === e.currentTarget && setMenuOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1100, display: 'flex' }}>
          <nav className="anim-slide-in-right" style={{
            width: '80%', maxWidth: '320px', height: '100%', background: 'var(--surface)',
            borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
            overflowY: 'auto', boxShadow: '2px 0 24px rgba(0,0,0,0.2)',
          }}>
            {/* header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 800, fontSize: '15px' }}>
                <span style={{ fontFamily: 'serif' }}>Jyo</span><span style={{ color: 'var(--accent)' }}>·</span>
                <span style={{ fontFamily: "'Noto Sans Devanagari', serif" }}>तिष</span>
              </span>
              <button onClick={() => setMenuOpen(false)} aria-label="Close" style={{ border: 'none', background: 'transparent', fontSize: '22px', color: 'var(--text3)', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            <div style={{ padding: '8px 0', flex: 1 }}>
              {/* Kundli */}
              <div onClick={() => { setActiveTab('chart'); setShowForm(!chart); setMenuOpen(false) }}
                style={{ padding: '11px 18px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', color: !APP_TABS.some(tb => tb.id === activeTab) ? 'var(--accent)' : 'var(--text)' }}>
                {t('Kundli')}
              </div>

              {/* Sections + their tabs */}
              {APP_SECTIONS.filter(s => !s.businessOnly || !!user).map(section => (
                <div key={section.label} style={{ marginTop: '6px' }}>
                  <div style={{ padding: '8px 18px 4px', fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text3)' }}>
                    {section.icon ? section.icon + ' ' : ''}{t(section.label)}
                  </div>
                  {section.tabs.map(tb => (
                    <div key={tb.id} onClick={() => goTab(tb.id)} style={{
                      padding: '9px 18px 9px 26px', fontSize: '13.5px', cursor: 'pointer',
                      background: activeTab === tb.id ? 'var(--accent-bg)' : 'transparent',
                      color: activeTab === tb.id ? 'var(--accent)' : 'var(--text)',
                      fontWeight: activeTab === tb.id ? 700 : 400,
                    }}>{tb.icon ? tb.icon + ' ' : ''}{t(tb.label)}</div>
                  ))}
                </div>
              ))}

              {/* Saved */}
              <div onClick={() => goTab('saved')} style={{
                marginTop: '6px', padding: '11px 18px', fontSize: '14px', fontWeight: activeTab === 'saved' ? 700 : 600, cursor: 'pointer',
                borderTop: '1px solid var(--border)',
                color: activeTab === 'saved' ? 'var(--accent)' : 'var(--text)',
              }}>{t('Saved')}</div>
            </div>

            {/* footer: language */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <LanguageToggle />
            </div>
          </nav>
        </div>
      )}

      {/* Upgrade prompt — free user hit a business-only tool */}
      {showUpgrade && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
             onClick={e => e.target === e.currentTarget && setShowUpgrade(false)}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '30px', width: '400px', maxWidth: '90vw', textAlign: 'center', boxShadow: '0 20px 50px -20px rgba(0,0,0,0.4)' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>💼</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>{t('Unlock your practice')}</div>
            <div style={{ fontSize: '13.5px', color: 'var(--text3)', lineHeight: 1.6, marginBottom: '18px' }}>
              {t('Clients, invoices, branded PDF reports, client portal & prediction tracker. Free for 30 days.')}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '18px' }}>
              {t('All calculations & gem earnings stay free.')}
            </div>
            <button onClick={() => setShowUpgrade(false)} style={{
              width: '100%', padding: '12px', background: 'var(--accent)', border: 'none', borderRadius: '9px',
              color: '#fff', fontWeight: 700, fontSize: '14.5px', cursor: 'pointer', marginBottom: '10px',
            }}>{t('Start 30-day free trial')}</button>
            <div onClick={() => setShowUpgrade(false)} style={{ fontSize: '13px', color: 'var(--text3)', cursor: 'pointer' }}>{t('Maybe later')}</div>
          </div>
        </div>
      )}

      {/* Save-prompt after a guest calculates a chart */}
      {showSavePrompt && !user && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
             onClick={e => e.target === e.currentTarget && setShowSavePrompt(false)}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '30px', width: '380px', maxWidth: '90vw', textAlign: 'center', boxShadow: '0 20px 50px -20px rgba(0,0,0,0.4)' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔒</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>{t('Save this chart?')}</div>
            <div style={{ fontSize: '13.5px', color: 'var(--text3)', lineHeight: 1.6, marginBottom: '22px' }}>
              {t('Log in or create a free account to save charts, manage clients and unlock all features.')}
            </div>
            <button onClick={() => { setShowSavePrompt(false); setShowAuthPage(true) }} style={{
              width: '100%', padding: '12px', background: 'var(--accent)', border: 'none', borderRadius: '9px',
              color: '#fff', fontWeight: 700, fontSize: '14.5px', cursor: 'pointer', marginBottom: '10px',
            }}>{t('Log in / Create account')}</button>
            <div onClick={() => setShowSavePrompt(false)} style={{ fontSize: '13px', color: 'var(--text3)', cursor: 'pointer' }}>{t('Maybe later')}</div>
          </div>
        </div>
      )}

      {showGemPicker && chart && birthDataRaw && (
        <GemPickerForClient
          clientId={''}
          clientName={chart.name}
          weakPlanets={weakPlanets}
          birthData={{
            year: birthDataRaw.year, month: birthDataRaw.month, day: birthDataRaw.day,
            hour: birthDataRaw.hour, minute: birthDataRaw.minute,
            tz_offset: birthDataRaw.tz_offset,
            latitude: birthDataRaw.latitude, longitude: birthDataRaw.longitude,
            ayanamsa: chart.ayanamsa || 'lahiri',
          }}
          onClose={() => setShowGemPicker(false)}
        />
      )}

      {showReportModal && chart && birthDataRaw && (
        <ReportBuilderModal
          open={showReportModal}
          onClose={() => setShowReportModal(false)}
          clientName={chart.name}
          birthData={{
            birth_date: chart.birth.split(' ')[0],
            birth_time: chart.birth.split(' ')[1]?.slice(0, 5) || '12:00',
            birth_tz: birthDataRaw.tz_offset,
            birth_place: chart.place || birthDataRaw.place,
            latitude: birthDataRaw.latitude,
            longitude: birthDataRaw.longitude,
            ayanamsa: chart.ayanamsa,
          }}
        />
      )}

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Full-page app tabs — no sidebar */}
        {isAppTab && (
          activeTab === 'prashna' ? (
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <ErrorBoundary name="prashna"><PrashnaPanel /></ErrorBoundary>
            </div>
          ) : (
            <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
              {activeTab === 'crm'      && <CRMPanel />}
              {activeTab === 'research' && <ResearchLab />}
              {activeTab === 'saved'    && <SavedCharts onSelect={(saved: any) => {
                const [bh, bmin] = (saved.birth_time || '12:00').split(':').map(Number)
                const [by, bm, bd] = (saved.birth_date || '1990-01-01').split('-').map(Number)
                handleCalculate({
                  name: saved.name || 'Saved Chart',
                  year: by, month: bm, day: bd,
                  hour: bh, minute: bmin,
                  tz_offset: saved.birth_tz ?? 5.5,
                  latitude: saved.latitude ?? 28.6,
                  longitude: saved.longitude ?? 77.2,
                  place: saved.birth_place || '',
                  ayanamsa: saved.ayanamsa || 'lahiri',
                })
              }} />}
              {activeTab === 'ai'            && <AIChat chartId={undefined} chartName={undefined} />}
              {activeTab === 'compatibility' && <CompatibilityPanel birth={getBirthDataForCalc()} chart={chart} />}
              {activeTab === 'synastry'      && <ChartComparisonPanel birth={getBirthDataForCalc()} chart={chart} />}
              {activeTab === 'muhurta'       && <ErrorBoundary name="muhurta"><MuhurtaPanel /></ErrorBoundary>}
              {activeTab === 'profile'       && <AstrologerProfileSettings />}
              {activeTab === 'gems'          && <GemShopPanel />}
              {activeTab === 'earnings'      && <EarningsPanel />}
            </div>
          )
        )}

        {/* Chart mode — left form panel + right content */}
        {!isAppTab && (
          <>
            {/* ── Left panel: form ──────────────────────────────────────────── */}
            {showForm && (
              <div style={{
                width: '460px', flexShrink: 0,
                borderRight: '1px solid var(--border)',
                background: 'var(--surface)',
                overflowY: 'auto', padding: '28px',
                display: 'flex', flexDirection: 'column', gap: '0',
              }}>
                <BirthForm onSubmit={handleCalculate} loading={loading} />
                {error && (
                  <div style={{
                    marginTop: '10px', padding: '10px 14px',
                    background: 'var(--red-bg)', border: '1px solid #FCA5A5',
                    borderRadius: '6px', color: 'var(--red)', fontSize: '12.5px',
                  }}>{error}</div>
                )}
              </div>
            )}

            {/* ── Right panel: content ──────────────────────────────────────── */}
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
              {chart ? (
                <div key={chartKey} className="anim-fade-up" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

                  {/* Chart header bar */}
                  <div style={{
                    padding: '14px 24px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'var(--surface)', flexShrink: 0, flexWrap: 'wrap', gap: '10px',
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: '17px', fontWeight: '700' }}>{chart.name}</h2>
                        <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{chart.birth}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{chart.place}</span>
                        <span style={{
                          fontSize: '12px', fontWeight: '600', color: 'var(--accent)',
                          background: 'var(--accent-bg)', padding: '1px 8px', borderRadius: '20px',
                        }}>{chart.ascendant.sign} Lagna</span>
                        <span style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'capitalize' }}>{chart.ayanamsa}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '3px' }}>
                        Atmakaraka: <strong style={{ color: 'var(--gold)' }}>{chart.atmakaraka}</strong>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {saveMsg && (
                        <span style={{ fontSize: '12px', color: saveMsg.includes('✓') ? 'var(--green)' : 'var(--red)' }}>
                          {saveMsg}
                        </span>
                      )}
                      <button onClick={handleSaveChart} style={ghostBtnSm}>Save</button>
                      <button onClick={() => setShowReportModal(true)} style={ghostBtnSm}>📄 PDF Report</button>
                      <button onClick={() => setShowGemPicker(true)} style={{
                        ...ghostBtnSm, background: '#D97706', color: '#fff', border: 'none',
                      }}>💎 Recommend Gem</button>
                      <button onClick={() => setActiveTab('ai')} style={{
                        ...ghostBtnSm, background: 'var(--accent)', color: '#fff', border: 'none',
                      }}>✦ Ask AI</button>
                    </div>
                  </div>

                  {/* Sub-tab bar — grouped dropdowns */}
                  <div style={{
                    padding: '6px 16px', borderBottom: '1px solid var(--border)',
                    display: 'flex', gap: '4px', background: 'var(--surface)', flexShrink: 0,
                    alignItems: 'center',
                  }} onMouseLeave={() => setOpenGroup(null)}>
                    {TAB_GROUPS.map(group => {
                      const isActive = group.tabs.some(t => t.id === activeTab)
                      const isOpen = openGroup === group.label
                      return (
                        <div key={group.label} style={{ position: 'relative' }}>
                          <button
                            onMouseEnter={() => setOpenGroup(group.label)}
                            onClick={() => setOpenGroup(isOpen ? null : group.label)}
                            style={{
                              padding: '6px 12px', border: 'none', borderRadius: '6px',
                              background: isActive ? 'var(--accent)' : isOpen ? 'var(--accent-bg)' : 'transparent',
                              color: isActive ? '#fff' : isOpen ? 'var(--accent)' : 'var(--text3)',
                              cursor: 'pointer', fontSize: '12.5px',
                              fontWeight: isActive ? '600' : '400',
                              transition: 'all .15s',
                              display: 'flex', alignItems: 'center', gap: '4px',
                            }}
                          >
                            {t(group.label)}
                            <span style={{ fontSize: '9px', opacity: 0.7 }}>▾</span>
                          </button>
                          {isOpen && (
                            <div style={{
                              position: 'absolute', top: '100%', left: 0, zIndex: 100,
                              background: 'var(--surface)', border: '1px solid var(--border)',
                              borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                              minWidth: '170px', padding: '4px', marginTop: '2px',
                            }}>
                              {group.tabs.map(tab => (
                                <button key={tab.id} onClick={() => { setActiveTab(tab.id); setOpenGroup(null) }} style={{
                                  display: 'block', width: '100%', textAlign: 'left',
                                  padding: '7px 12px', border: 'none', borderRadius: '5px',
                                  background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
                                  color: activeTab === tab.id ? '#fff' : 'var(--text2)',
                                  cursor: 'pointer', fontSize: '12.5px',
                                  fontWeight: activeTab === tab.id ? '600' : '400',
                                  transition: 'background .1s',
                                  fontFamily: "'Noto Sans Devanagari', 'Mangal', sans-serif",
                                }}>{tab.icon ? tab.icon + ' ' : ''}{t(tab.label)}</button>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {/* Active tab label pill */}
                    {(() => {
                      const activeItem = CHART_TABS.find(ci => ci.id === activeTab)
                      return activeItem ? (
                        <span style={{
                          marginLeft: 'auto', fontSize: '11.5px', color: 'var(--text3)',
                          background: 'var(--bg)', padding: '3px 10px', borderRadius: '20px',
                          border: '1px solid var(--border)',
                        }}>{activeItem.icon ? activeItem.icon + ' ' : ''}{t(activeItem.label)}</span>
                      ) : null
                    })()}
                  </div>

                  {/* Tab content */}
                  <div key={activeTab} className="anim-fade-in" style={{ flex: 1, padding: '24px', overflow: 'auto' }}>

                    {activeTab === 'chart' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Chart style toggle + print */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text3)', fontWeight: '600' }}>Chart Style:</span>
                          {([['north','North Indian'],['south','South Indian'],['east','East Indian']] as const).map(([style, label]) => (
                            <button key={style} onClick={() => setChartStyle(style)} style={{
                              padding: '4px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                              border: chartStyle === style ? 'none' : '1px solid var(--border)',
                              background: chartStyle === style ? 'var(--accent)' : 'transparent',
                              color: chartStyle === style ? '#fff' : 'var(--text3)', fontWeight: '600',
                            }}>{label}</button>
                          ))}
                          <div style={{ marginLeft: 'auto' }}>
                            <PrintExportButton chart={chart} dashas={chart.dashas || []} compact />
                          </div>
                        </div>

                        {getBirthDataForCalc() && (
                          <DivisionalBoard
                            birthData={getBirthDataForCalc()!}
                            chartStyle={chartStyle}
                            d1={{ ascendant: chart.ascendant, planets: chart.planets, planet_house_map: chart.planet_house_map }}
                            initialLayout={user?.board_layout ?? null}
                            onSave={layout => { if (user) authApi.saveBoardLayout(layout).catch(() => {}) }}
                          />
                        )}

                        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

                          {/* Right column: planets + panchanga */}
                          <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Planets at a glance */}
                            <div>
                              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px', fontFamily: "'Noto Sans Devanagari',sans-serif" }}>{t('Planets at a Glance') || 'Planets at a Glance'}</div>
                              {Object.entries(chart.planets).map(([name, p]) => (
                                <div key={name} onClick={() => setSelectedPlanet(name)} style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '7px 4px', borderBottom: '1px solid var(--border)', gap: '8px',
                                  cursor: 'pointer', borderRadius: '4px', transition: 'background .1s',
                                }}
                                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover)')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '90px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: PLANET_COLORS[name] || 'var(--accent)', flexShrink: 0, display: 'block' }} />
                                    <span style={{ fontSize: '12.5px', fontWeight: '600', color: PLANET_COLORS[name] || 'var(--accent)', fontFamily: "'Noto Sans Devanagari',sans-serif" }}>{t(name)}</span>
                                    {(p as any).retrograde && <span style={{ fontSize: '9px', color: 'var(--red)' }}>ᴿ</span>}
                                  </div>
                                  <span style={{ fontSize: '12px', color: 'var(--text2)', flex: 1, fontFamily: "'Noto Sans Devanagari',sans-serif" }}>{t((p as any).sign)}</span>
                                  <span style={{ fontSize: '11px', color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>{(p as any).degree?.toFixed(1)}°</span>
                                  <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '600', width: '28px', textAlign: 'right' }}>H{(p as any).house}</span>
                                  {(p as any).status && STATUS_BADGE[(p as any).status] && (
                                    <span style={{
                                      fontSize: '10px', padding: '1px 6px', borderRadius: '20px',
                                      background: STATUS_BADGE[(p as any).status].bg, color: STATUS_BADGE[(p as any).status].color,
                                      fontWeight: '600', whiteSpace: 'nowrap',
                                    }}>{(p as any).status === 'exalted' ? '↑' : (p as any).status === 'debilitated' ? '↓' : '◈'}</span>
                                  )}
                                  <span style={{ fontSize: '10px', color: 'var(--text4)' }}>›</span>
                                </div>
                              ))}
                            </div>
                            {/* Panchanga */}
                            {getBirthDataForCalc() && <PanchangaCard birthData={getBirthDataForCalc()} />}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'vargas' && getBirthDataForCalc() && <VargaCharts birthData={getBirthDataForCalc()!} />}
                    {activeTab === 'dasha' && <DashaTimeline dashas={chart.dashas} birthYear={parseInt(chart.birth.split('-')[0])} birthData={getBirthDataForCalc()} />}
                    {activeTab === 'interpret' && <InterpretationPanel birth={getBirthDataForCalc()} />}
                    {activeTab === 'dasha_predict' && <DashaPredictionPanel birth={getBirthDataForCalc()} />}
                    {activeTab === 'yogas' && getBirthDataForCalc() && <YogaCards birthData={getBirthDataForCalc()!} />}
                    {activeTab === 'shadbala' && getBirthDataForCalc() && <ShadbalaTable birthData={getBirthDataForCalc()!} />}

                    {activeTab === 'planets' && (
                      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                          <thead>
                            <tr style={{ background: 'var(--surface2)' }}>
                              {['Planet','Sign','Degree','Nakshatra','Pada','Lord','House','Status'].map(h => (
                                <th key={h} style={{
                                  padding: '10px 16px', textAlign: 'left',
                                  color: 'var(--text3)', fontWeight: '500', fontSize: '11.5px',
                                  borderBottom: '1px solid var(--border)',
                                  fontFamily: "'Noto Sans Devanagari',sans-serif",
                                }}>{t(h)}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(chart.planets).map(([name, p], idx) => (
                              <tr key={name} onClick={() => setSelectedPlanet(name)}
                                style={{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? 'var(--surface)' : 'var(--surface2)', transition: 'background .1s', cursor: 'pointer' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover)')}
                                onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'var(--surface)' : 'var(--surface2)')}
                              >
                                <td style={{ padding: '9px 16px', fontWeight: '600', color: PLANET_COLORS[name] || 'var(--accent)', fontFamily: "'Noto Sans Devanagari',sans-serif" }}>
                                  {t(name)} {p.retrograde ? <span style={{ color: 'var(--red)', fontSize: '10px', fontWeight: '400' }}>ᴿ</span> : ''}
                                </td>
                                <td style={{ padding: '9px 16px', fontFamily: "'Noto Sans Devanagari',sans-serif" }}>{t(p.sign)}</td>
                                <td style={{ padding: '9px 16px', color: 'var(--text2)', fontVariantNumeric: 'tabular-nums' }}>{p.degree.toFixed(2)}°</td>
                                <td style={{ padding: '9px 16px', color: 'var(--text2)', fontFamily: "'Noto Sans Devanagari',sans-serif" }}>{t(p.nakshatra)}</td>
                                <td style={{ padding: '9px 16px', color: 'var(--text3)' }}>{p.pada}</td>
                                <td style={{ padding: '9px 16px', color: 'var(--text3)', fontFamily: "'Noto Sans Devanagari',sans-serif" }}>{t(p.nakshatra_lord)}</td>
                                <td style={{ padding: '9px 16px', fontWeight: '600', color: 'var(--accent)' }}>H{p.house}</td>
                                <td style={{ padding: '9px 16px' }}>
                                  {p.status && STATUS_BADGE[p.status]
                                    ? <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: '600', background: STATUS_BADGE[p.status].bg, color: STATUS_BADGE[p.status].color, fontFamily: "'Noto Sans Devanagari',sans-serif" }}>
                                        {p.status === 'exalted' ? (t('exalted') || '↑ Exalted') : p.status === 'debilitated' ? (t('debilitated') || '↓ Debilitated') : (t('own') || '◈ Own')}
                                      </span>
                                    : <span style={{ color: 'var(--text4)' }}>—</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {activeTab === 'doshas'       && getBirthDataForCalc() && <DoshaPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'transit'      && <TransitPanel chart={chart} />}
                    {activeTab === 'ashtakavarga' && <AshtakavargaPanel chart={chart} />}
                    {activeTab === 'compatibility' && <CompatibilityPanel birth={getBirthDataForCalc()} chart={chart} />}
                    {activeTab === 'synastry'      && <ChartComparisonPanel birth={getBirthDataForCalc()} chart={chart} />}
                    {activeTab === 'prashna'       && <ErrorBoundary name="prashna"><PrashnaPanel /></ErrorBoundary>}
                    {activeTab === 'muhurta'       && <ErrorBoundary name="muhurta"><MuhurtaPanel /></ErrorBoundary>}
                    {activeTab === 'varshaphal'    && getBirthDataForCalc() && <VarshaphalPanel chart={chart} birthData={getBirthDataForCalc()} />}
                    {activeTab === 'kp'            && getBirthDataForCalc() && <KPPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'arudha'        && getBirthDataForCalc() && <ArudhaPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'yogini'        && getBirthDataForCalc() && <YoginiDashaPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'aspects'       && getBirthDataForCalc() && <AspectsPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'chara'         && getBirthDataForCalc() && <CharaDashaPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'sbc'           && getBirthDataForCalc() && <SarvatobhadraPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'bhava'         && getBirthDataForCalc() && <BhavaChaliPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'jaimini'       && getBirthDataForCalc() && <JaiminiPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'combustion'    && getBirthDataForCalc() && <CombustionPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'sudarshan'     && getBirthDataForCalc() && <SudarshanPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'ashtottari'    && getBirthDataForCalc() && <AshtottariPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'narayana'      && getBirthDataForCalc() && <NarayanaPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'special'       && getBirthDataForCalc() && <SpecialLagnaPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'dignity'       && getBirthDataForCalc() && <DignityPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'kalachakra'    && getBirthDataForCalc() && <KalachakraPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'shoola'        && getBirthDataForCalc() && <ShoolaPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'kota'          && getBirthDataForCalc() && <KotaChakraPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'gochara'       && getBirthDataForCalc() && <GocharaPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'madhya'        && getBirthDataForCalc() && <BhavaMadhyaPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'upagraha'      && getBirthDataForCalc() && <UpagrahaPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'transit_hits'  && getBirthDataForCalc() && <TransitHitPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'transit_natal' && getBirthDataForCalc() && <TransitNatalPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'tithi'         && getBirthDataForCalc() && <TithiPraveshaPanel birthData={getBirthDataForCalc()} chartStyle={chartStyle === 'east' ? 'north' : chartStyle} />}
                    {activeTab === 'sahams'        && getBirthDataForCalc() && <SahamPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'ayurdaya'      && getBirthDataForCalc() && <AyurdayaPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'jaimini_asp'   && getBirthDataForCalc() && <JaiminiAspectPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'lagnesh'       && getBirthDataForCalc() && <LagneshPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'saptarishi'    && getBirthDataForCalc() && <SaptarishiPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'pancha_pakshi' && getBirthDataForCalc() && <PanchaPakshiPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'remedies'     && getBirthDataForCalc() && <RemediesPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'misc_dasha'   && getBirthDataForCalc() && <MiscDashaPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'hora_variants'&& getBirthDataForCalc() && <HoraVariantsPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'vimshopaka'  && getBirthDataForCalc() && <VimshopakaBhavaPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'rectification' && getBirthDataForCalc() && <RectificationPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'varga_dasha'  && getBirthDataForCalc() && <VargaDashaPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'classical'     && <ClassicalTextsPanel />}
                    {activeTab === 'famous_charts' && <FamousChartsPanel onLoadChart={(c: any) => {
                      handleCalculate({
                        name: c.name, year: c.year, month: c.month, day: c.day,
                        hour: c.hour, minute: c.minute, tz_offset: c.tz_offset,
                        latitude: c.latitude, longitude: c.longitude,
                        place: c.place, ayanamsa: chart?.ayanamsa || 'lahiri',
                      } as any)
                      setActiveTab('chart')
                    }} />}
                    {activeTab === 'numerology'    && <NumerologyPanel />}
                    {activeTab === 'predictions'   && <PredictionTrackerPanel />}
                    {activeTab === 'ephemeris'     && <EphemerisExportPanel />}
                    {activeTab === 'dasha_transit' && <DashaTransitOverlayPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'avasthas'     && <AvasthaPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'karakamsha'   && <KarakamshaPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'argala'            && <ArgalaPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'conditional_dasha' && <ConditionalDashaPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'upapada'           && <UpapadaPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'varnada'           && <VarnadaPanel birthData={getBirthDataForCalc()} />}
                    {activeTab === 'dasha_3col'        && <DashaTriColumn birthData={getBirthDataForCalc()} />}
                    {activeTab === 'sky' && <LiveSky />}
                  </div>
                </div>
              ) : (
                /* ── Hero empty state — full panel ─────────────────────────── */
                <HeroEmpty />
              )}
            </div>
          </>
        )}
      </div>

      {/* Planet interpretation drawer */}
      {chart && selectedPlanet && (
        <PlanetInterpretationDrawer
          planet={selectedPlanet}
          planetData={selectedPlanet ? (chart.planets as any)[selectedPlanet] : null}
          allPlanets={Object.fromEntries(Object.entries(chart.planets).map(([n, p]) => [n, { house: (p as any).house }]))}
          onClose={() => setSelectedPlanet(null)}
        />
      )}
    </div>
  )
}

// ── Hero panel shown before any chart is calculated ───────────────────────────
const PLANET_DATA = [
  { name: 'Mo', color: '#0891B2', r: 88,  size: 7,  speed: 27,   symbol: '☽' },
  { name: 'Ma', color: '#DC2626', r: 116, size: 6,  speed: 45,   symbol: '♂' },
  { name: 'Me', color: '#16A34A', r: 142, size: 5.5,speed: 38,   symbol: '☿' },
  { name: 'Ve', color: '#7C3AED', r: 168, size: 6.5,speed: 55,   symbol: '♀' },
  { name: 'Sa', color: '#2563EB', r: 196, size: 6,  speed: 85,   symbol: '♄' },
  { name: 'Ju', color: '#B45309', r: 222, size: 8,  speed: 70,   symbol: '♃' },
  { name: 'Ra', color: '#57534E', r: 248, size: 5,  speed: 120,  symbol: 'Ω' },
]

function AstrologyOrrery() {
  const cx = 280, cy = 280
  const sunR = 22

  return (
    <div style={{
      position: 'absolute', top: '-40px', right: '-40px',
      width: '560px', height: '560px', pointerEvents: 'none', userSelect: 'none',
    }}>
      <svg width="560" height="560" viewBox="0 0 560 560" style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id="sunGrad" cx="50%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#FFF7ED" />
            <stop offset="40%" stopColor="#FCD34D" />
            <stop offset="100%" stopColor="#D97706" />
          </radialGradient>
          <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FCD34D" stopOpacity="0" />
          </radialGradient>
          <filter id="sunGlow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Orbit rings */}
        {PLANET_DATA.map(p => (
          <circle key={p.name + 'ring'} cx={cx} cy={cy} r={p.r}
            fill="none" stroke="var(--border)" strokeWidth="0.75" strokeDasharray="2 4" opacity="0.5" />
        ))}

        {/* Zodiac ring (outermost) */}
        <circle cx={cx} cy={cy} r={274} fill="none" stroke="var(--border2)" strokeWidth="1" opacity="0.7" />
        <circle cx={cx} cy={cy} r={258} fill="none" stroke="var(--border)" strokeWidth="0.5" opacity="0.4" />

        {/* Zodiac signs — counter-rotate so they stay upright, ring rotates slowly */}
        <g style={{ transformOrigin: `${cx}px ${cy}px`, animation: 'spin 200s linear infinite' }}>
          {ZODIAC.map((z, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180)
            const r = 266
            const x = cx + r * Math.cos(angle)
            const y = cy + r * Math.sin(angle)
            return (
              <g key={i} transform={`translate(${x},${y})`}>
                <g style={{ transformOrigin: '0px 0px', animation: 'counterLabel 200s linear infinite' }}>
                  <text textAnchor="middle" dominantBaseline="central"
                    fontSize="12" fill="var(--text3)" fontWeight="500" opacity="0.8"
                  >{z}</text>
                </g>
              </g>
            )
          })}
        </g>

        {/* Tick marks between signs */}
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * 30 - 90) * (Math.PI / 180)
          return (
            <line key={i}
              x1={cx + 255 * Math.cos(a)} y1={cy + 255 * Math.sin(a)}
              x2={cx + 265 * Math.cos(a)} y2={cy + 265 * Math.sin(a)}
              stroke="var(--border2)" strokeWidth="1.5" opacity="0.6"
            />
          )
        })}

        {/* Planets on orbits */}
        {PLANET_DATA.map((p, idx) => (
          <g key={p.name}
            style={{
              transformOrigin: `${cx}px ${cy}px`,
              animation: `spin ${p.speed}s linear infinite${idx % 2 === 1 ? '' : ''}`,
            }}
          >
            {/* Planet dot */}
            <circle cx={cx + p.r} cy={cy} r={p.size}
              fill={p.color} opacity="0.85"
            />
            {/* Planet glow */}
            <circle cx={cx + p.r} cy={cy} r={p.size + 5}
              fill={p.color} opacity="0.12"
            />
            {/* Planet symbol — counter-rotate to stay upright */}
            <g transform={`translate(${cx + p.r},${cy})`}
              style={{ transformOrigin: '0px 0px', animation: `counterLabel ${p.speed}s linear infinite` }}
            >
              <text textAnchor="middle" dominantBaseline="central" dy="-14"
                fontSize="10" fill={p.color} fontWeight="700" opacity="0.9"
              >{p.name}</text>
            </g>
          </g>
        ))}

        {/* Sun glow halo */}
        <circle cx={cx} cy={cy} r={sunR + 16} fill="url(#glowGrad)"
          style={{ animation: 'pulseGlow 3s ease-in-out infinite' }} />

        {/* Sun core */}
        <circle cx={cx} cy={cy} r={sunR} fill="url(#sunGrad)"
          filter="url(#sunGlow)" style={{ animation: 'pulseGlow 3s ease-in-out infinite' }} />

        {/* Sun symbol */}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
          fontSize="14" fill="#92400E" fontWeight="700">☀</text>
      </svg>
    </div>
  )
}

function HeroEmpty() {
  const { t } = useLang()
  return (
    <div style={{
      flex: 1, display: 'flex', position: 'relative', overflow: 'hidden',
      background: 'var(--bg)',
    }}>
      {/* Animated Orrery — top-right */}
      <AstrologyOrrery />

      {/* Dot grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.6,
        backgroundImage: 'radial-gradient(circle, var(--border2) 1px, transparent 1px)',
        backgroundSize: '28px 28px', pointerEvents: 'none',
      }} />

      {/* Center content */}
      <div className="anim-fade-up" style={{
        position: 'relative', zIndex: 1, flex: 1,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '64px 80px',
      }}>

        {/* Logo wordmark */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '42px', fontWeight: '800', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '6px' }}>
            <span style={{ fontFamily: 'Georgia, serif', color: 'var(--text)' }}>Jyo</span>
            <span style={{ fontFamily: 'Georgia, serif', color: 'var(--accent)', fontSize: '44px' }}>·</span>
            <span style={{
              fontFamily: "'Noto Sans Devanagari', 'Mangal', serif",
              background: 'linear-gradient(135deg, #5746AF 0%, #8B5CF6 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>तिष</span>
          </div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text3)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {t('By Jyotishis · For Jyotishis')}
          </div>
        </div>

        {/* Shloka block */}
        <div style={{
          marginBottom: '32px', paddingLeft: '18px',
          borderLeft: '3px solid var(--accent)',
        }}>
          <div style={{
            fontFamily: "'Noto Sans Devanagari', 'Mangal', serif",
            fontSize: '18px', fontWeight: '600', color: 'var(--text)',
            lineHeight: 1.6, marginBottom: '6px', letterSpacing: '0.01em',
          }}>
            वेदस्य निर्मलं चक्षुः ज्योतिषं मुनिसत्तमाः
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--text3)', fontStyle: 'italic', lineHeight: 1.5 }}>
            "O great sages, Jyotisha is the flawless eye of the Vedas"
            <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--text4)', fontStyle: 'normal' }}>— BPHS</span>
          </div>
        </div>

        <p style={{ fontSize: '15px', color: 'var(--text2)', lineHeight: 1.75, marginBottom: '36px', maxWidth: '480px' }}>
          {t('Sub-arcsecond planetary positions · 16 divisional charts · AI interpretation rooted in classical texts. Built for serious practitioners.')}
        </p>

        {/* Feature chips — 2 rows, grouped */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '48px', maxWidth: '560px' }}>
          {[
            { icon: '◉', label: 'Birth Chart' },
            { icon: '⬡', label: '16 Vargas' },
            { icon: '⟳', label: 'Vimshottari Dasha' },
            { icon: '✦', label: '15+ Yogas' },
            { icon: '⬆', label: 'Shadbala' },
            { icon: '🧠', label: 'AI Interpretation' },
            { icon: '☽', label: 'Prashna Horary' },
            { icon: '★', label: 'Live Sky' },
          ].map(f => (
            <span key={f.label} style={{
              padding: '7px 14px', borderRadius: '20px', fontSize: '12.5px',
              background: 'var(--surface)', border: '1px solid var(--border)',
              color: 'var(--text2)', fontWeight: '500',
              boxShadow: 'var(--shadow-xs)',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <span style={{ fontSize: '13px' }}>{f.icon}</span>{t(f.label)}
            </span>
          ))}
        </div>

        {/* Trust bar */}
        <div style={{
          display: 'flex', gap: '32px', alignItems: 'center',
          borderTop: '1px solid var(--border)', paddingTop: '28px',
        }}>
          {[
            { text: 'BPHS', sub: 'Brihat Parashara Hora Shastra' },
            { text: 'Swiss Eph.', sub: 'Sub-arcsecond precision' },
            { text: 'Lahiri', sub: 'Standard ayanamsa' },
            { text: 'KP System', sub: 'Krishnamurti Paddhati' },
          ].map(item => (
            <div key={item.text}>
              <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text)' }}>{item.text}</div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const ghostBtnSm: React.CSSProperties = {
  padding: '4px 10px', borderRadius: '6px',
  border: '1px solid var(--border)', background: 'transparent',
  color: 'var(--text2)', cursor: 'pointer', fontSize: '12.5px',
  fontWeight: '500', transition: 'all .15s',
}

const menuBox: React.CSSProperties = {
  position: 'absolute', top: '100%', left: 0, marginTop: '4px',
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px',
  boxShadow: '0 12px 32px -12px rgba(0,0,0,0.35)', padding: '4px', minWidth: '190px', zIndex: 200,
}
const menuItem: React.CSSProperties = {
  padding: '8px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer',
  color: 'var(--text)', transition: 'background .12s',
}
