import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export type Lang = 'en' | 'hi';

interface LangState { lang: Lang; setLang: (l: Lang) => void; toggle: () => void; init: () => void; }
export const useLangStore = create<LangState>((set, get) => ({
  lang: 'en',
  setLang: (lang) => { set({ lang }); SecureStore.setItemAsync('grahika_lang', lang).catch(() => {}); },
  toggle: () => get().setLang(get().lang === 'en' ? 'hi' : 'en'),
  init: async () => { try { const l = await SecureStore.getItemAsync('grahika_lang'); if (l === 'hi' || l === 'en') set({ lang: l }); } catch {} },
}));

// English key → Hindi. Covers UI chrome + Jyotish terms (planets, signs, nakshatras).
const HI: Record<string, string> = {
  // planets
  Sun: 'सूर्य', Moon: 'चंद्र', Mars: 'मंगल', Mercury: 'बुध', Jupiter: 'गुरु', Venus: 'शुक्र', Saturn: 'शनि', Rahu: 'राहु', Ketu: 'केतु',
  Lagna: 'लग्न', Ascendant: 'लग्न', Atmakaraka: 'आत्मकारक',
  // signs
  Aries: 'मेष', Taurus: 'वृषभ', Gemini: 'मिथुन', Cancer: 'कर्क', Leo: 'सिंह', Virgo: 'कन्या', Libra: 'तुला', Scorpio: 'वृश्चिक', Sagittarius: 'धनु', Capricorn: 'मकर', Aquarius: 'कुंभ', Pisces: 'मीन',
  // nakshatras
  Ashwini: 'अश्विनी', Bharani: 'भरणी', Krittika: 'कृत्तिका', Rohini: 'रोहिणी', Mrigashira: 'मृगशिरा', Ardra: 'आर्द्रा', Punarvasu: 'पुनर्वसु', Pushya: 'पुष्य', Ashlesha: 'आश्लेषा', Magha: 'मघा', 'Purva Phalguni': 'पूर्वा फाल्गुनी', 'Uttara Phalguni': 'उत्तरा फाल्गुनी', Hasta: 'हस्त', Chitra: 'चित्रा', Swati: 'स्वाति', Vishakha: 'विशाखा', Anuradha: 'अनुराधा', Jyeshtha: 'ज्येष्ठा', Mula: 'मूल', 'Purva Ashadha': 'पूर्वाषाढ़ा', 'Uttara Ashadha': 'उत्तराषाढ़ा', Shravana: 'श्रवण', Dhanishta: 'धनिष्ठा', Shatabhisha: 'शतभिषा', 'Purva Bhadrapada': 'पूर्व भाद्रपद', 'Uttara Bhadrapada': 'उत्तर भाद्रपद', Revati: 'रेवती',
  // nav / tabs
  Home: 'होम', Saved: 'सहेजे', Profile: 'प्रोफ़ाइल', Charts: 'कुंडली',
  // home
  Namaste: 'नमस्ते', 'What shall we read today?': 'आज क्या देखें?', TOOLS: 'साधन', 'Birth Chart': 'जन्म कुंडली',
  'Create Kundli': 'कुंडली बनाएँ', 'Full D1–D60, dashās & interpretation from birth details.': 'जन्म विवरण से D1–D60, दशा व फलादेश।', Start: 'शुरू करें',
  Matchmaking: 'मिलान', Compare: 'तुलना', Prashna: 'प्रश्न', 'Saved Charts': 'सहेजी कुंडलियाँ', Gems: 'रत्न', 'Famous Charts': 'प्रसिद्ध कुंडलियाँ',
  'Panchāng': 'पंचांग', 'Muhūrta': 'मुहूर्त', Numerology: 'अंक ज्योतिष',
  'Ashtakoot compatibility': 'अष्टकूट मिलान', 'Two charts · synastry': 'दो कुंडली · सिनैस्ट्री', 'Ask a question now': 'अभी प्रश्न पूछें',
  'Synced to your account': 'खाते से समन्वयित', 'Recommended stones': 'अनुशंसित रत्न', 'Study notable nativities': 'प्रसिद्ध कुंडलियाँ देखें',
  "Today's tithi, nakṣatra": 'आज की तिथि, नक्षत्र', 'Best times for an event': 'शुभ मुहूर्त', 'Moolank · Bhagyank': 'मूलांक · भाग्यांक',
  // chart sections
  Chart: 'कुंडली', Vargas: 'वर्ग', 'Dāśā': 'दशा', Reading: 'फलादेश', Transits: 'गोचर', Analysis: 'विश्लेषण', More: 'और',
  Yogas: 'योग', Doshas: 'दोष', Karakas: 'कारक', Arudha: 'आरूढ़', Remedies: 'उपाय', Aspects: 'दृष्टि',
  PLANETS: 'ग्रह', SIGN: 'राशि', DEG: 'अंश', 'NAKṢATRA': 'नक्षत्र', PLANET: 'ग्रह',
  // buttons / common
  'Calculate Chart': 'कुंडली गणना', 'Full Name': 'पूरा नाम', GENDER: 'लिंग', Male: 'पुरुष', Female: 'स्त्री', Other: 'अन्य',
  'DATE OF BIRTH': 'जन्म तिथि', 'TIME OF BIRTH': 'जन्म समय', 'BIRTH PLACE': 'जन्म स्थान', 'Search any city…': 'शहर खोजें…',
  'Log in': 'लॉग इन', 'Create account': 'खाता बनाएँ', 'Sign out': 'साइन आउट', Continue: 'जारी रखें', Retry: 'पुनः प्रयास',
  'Check Compatibility': 'मिलान जाँचें', 'Compare Charts': 'कुंडली तुलना', 'Cast Prashna': 'प्रश्न कुंडली', 'New match': 'नया मिलान',
  'Load saved / famous': 'सहेजी / प्रसिद्ध चुनें', 'Person 1': 'व्यक्ति 1', 'Person 2': 'व्यक्ति 2',
  Theme: 'थीम', Language: 'भाषा', 'Sign in to Grahika': 'ग्रहिका में साइन इन', 'Save & sync charts across devices': 'कुंडलियाँ सहेजें व समन्वयित करें',
};

/** Translate a UI string or a Jyotish term. Returns Hindi in HI mode, else the key. */
export function translate(key: string, lang: Lang): string {
  if (!key) return key;
  if (lang === 'en') return key;
  return HI[key] || key;
}

/** Hook: returns { t, lang }. Re-renders on language change. */
export function useT() {
  const lang = useLangStore((s) => s.lang);
  return { lang, t: (k: string) => translate(k, lang) };
}
