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
  // dignity / status / value words
  exalted: 'उच्च', debilitated: 'नीच', 'own sign': 'स्वराशि', own: 'स्व', moolatrikona: 'मूलत्रिकोण', friendly: 'मित्र', friend: 'मित्र', enemy: 'शत्रु', neutral: 'सम',
  'great friend': 'अधिमित्र', 'great enemy': 'अधिशत्रु', combust: 'अस्त', retrograde: 'वक्री', direct: 'मार्गी', debilitation: 'नीच', exaltation: 'उच्च',
  Yes: 'हाँ', No: 'नहीं', None: 'कोई नहीं', high: 'उच्च', medium: 'मध्यम', low: 'निम्न', moderate: 'मध्यम', strong: 'बलवान', weak: 'निर्बल',
  favorable: 'शुभ', favourable: 'शुभ', unfavorable: 'अशुभ', unfavourable: 'अशुभ', protected: 'सुरक्षित', hostile: 'शत्रुतापूर्ण', mixed: 'मिश्रित',
  Favorable: 'शुभ', Unfavorable: 'अशुभ', 'Moderately Favorable': 'मध्यम शुभ', Challenging: 'कठिन',
  // vargas
  Rashi: 'राशि', Navamsha: 'नवांश', Dashamsha: 'दशांश', Hora: 'होरा', Drekkana: 'द्रेष्काण', Saptamsha: 'सप्तांश',
  // card / section labels
  'D1 · RĀŚI': 'D1 · राशि',
  'VIMŚOTTARĪ · tap to expand antar / pratyantar': 'विंशोत्तरी · अन्तर/प्रत्यन्तर हेतु टैप करें',
  'Aṣṭakavarga': 'अष्टकवर्ग', 'Ṣaḍbala': 'षड्बल',
  // More tools
  Dignity: 'बल-स्थिति', 'Avasthās': 'अवस्था', Argala: 'अर्गला', Upagrahas: 'उपग्रह', Combustion: 'अस्त',
  Sahams: 'सहम', 'Special Lagnas': 'विशेष लग्न', Varnada: 'वर्णदा', 'Kārakāṁśa': 'कारकांश', 'Vimśopaka': 'विंशोपक',
  'Bhāva Chalit': 'भाव चलित', 'Lagneśa': 'लग्नेश', 'Jaimini Aspects': 'जैमिनी दृष्टि', 'Saptarṣi': 'सप्तर्षि', 'Pañca Pakṣī': 'पंच पक्षी',
  'Kota Chakra': 'कोटा चक्र', Sarvatobhadra: 'सर्वतोभद्र', 'Sudarśana': 'सुदर्शन',
  'Yoginī Daśā': 'योगिनी दशा', 'Aṣṭottarī Daśā': 'अष्टोत्तरी दशा', 'Kālachakra': 'कालचक्र', 'Chara Daśā': 'चर दशा', 'Nārāyaṇa Daśā': 'नारायण दशा',
  // screen titles / buttons / fields
  'Choose a chart': 'कुंडली चुनें',
  Calculate: 'गणना', 'Show Panchāng': 'पंचांग देखें', 'Find Muhūrtas': 'मुहूर्त खोजें', DATE: 'तिथि', PLACE: 'स्थान', PURPOSE: 'उद्देश्य',
  'Full name': 'पूरा नाम', Name: 'नाम', Email: 'ईमेल', Password: 'पासवर्ड', 'Your question (optional)': 'आपका प्रश्न (वैकल्पिक)', 'QUESTION ABOUT': 'प्रश्न का विषय',
  general: 'सामान्य', career: 'करियर', marriage: 'विवाह', finance: 'धन', health: 'स्वास्थ्य', travel: 'यात्रा', education: 'शिक्षा', property: 'संपत्ति', child: 'संतान', litigation: 'मुकदमा', business: 'व्यापार', medical: 'चिकित्सा', construction: 'निर्माण',
  SIGNALS: 'संकेत', 'Talk to Astrologer': 'ज्योतिषी से बात करें', 'Order': 'ऑर्डर', 'New comparison': 'नई तुलना',
  'No saved charts yet': 'अभी कोई कुंडली सहेजी नहीं', 'Sign in to sync': 'समन्वय हेतु साइन इन', 'Log in / Create account': 'लॉग इन / खाता बनाएँ',
  'Birth place': 'जन्म स्थान', 'Search city (default Delhi)': 'शहर खोजें (डिफ़ॉल्ट दिल्ली)', 'Place (default Delhi)': 'स्थान (डिफ़ॉल्ट दिल्ली)',
  'AṢṬAKOOTA BREAKDOWN': 'अष्टकूट विवरण', 'INTER-CHART ASPECTS': 'अंतर-कुंडली दृष्टि', 'GOCHARA · from natal Moon': 'गोचर · जन्म चंद्र से',
  'PRAŚNA KUNDLI': 'प्रश्न कुंडली', 'KP RULING PLANETS': 'KP शासक ग्रह', 'PLANETARY REMEDIES': 'ग्रह उपाय', 'ARUDHA PADAS': 'आरूढ़ पद',
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
