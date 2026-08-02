/**
 * Classical Jyotish terminology in English, Hindi, and Sanskrit (Devanagari).
 * Sources: BPHS (Brihat Parashara Hora Shastra), Phaladeepika, Saravali,
 *          Jataka Parijata, Brihat Jataka (Varahamihira).
 */

export type Lang = 'en' | 'hi' | 'sa'

type Dict = Record<string, { en: string; hi: string; sa: string }>

// ── Grahas (Planets) ────────────────────────────────────────────────────────
export const PLANETS: Dict = {
  Sun:     { en: 'Sun',     hi: 'सूर्य',       sa: 'सूर्यः'       },
  Moon:    { en: 'Moon',    hi: 'चन्द्र',       sa: 'चन्द्रः'      },
  Mars:    { en: 'Mars',    hi: 'मंगल',         sa: 'मङ्गलः'       },
  Mercury: { en: 'Mercury', hi: 'बुध',          sa: 'बुधः'         },
  Jupiter: { en: 'Jupiter', hi: 'बृहस्पति',     sa: 'बृहस्पतिः'   },
  Venus:   { en: 'Venus',   hi: 'शुक्र',        sa: 'शुक्रः'       },
  Saturn:  { en: 'Saturn',  hi: 'शनि',          sa: 'शनैश्चरः'    },
  Rahu:    { en: 'Rahu',    hi: 'राहु',         sa: 'राहुः'        },
  Ketu:    { en: 'Ketu',    hi: 'केतु',         sa: 'केतुः'        },
  Uranus:  { en: 'Uranus',  hi: 'अरुण',         sa: 'अरुणः'        },
  Neptune: { en: 'Neptune', hi: 'वरुण',         sa: 'वरुणः'        },
  Pluto:   { en: 'Pluto',   hi: 'यम',           sa: 'यमः'          },
}

// ── Rashis (Zodiac Signs) ────────────────────────────────────────────────────
export const SIGNS: Dict = {
  Aries:       { en: 'Aries',       hi: 'मेष',     sa: 'मेषः'      },
  Taurus:      { en: 'Taurus',      hi: 'वृषभ',    sa: 'वृषभः'     },
  Gemini:      { en: 'Gemini',      hi: 'मिथुन',   sa: 'मिथुनम्'   },
  Cancer:      { en: 'Cancer',      hi: 'कर्क',    sa: 'कर्कटः'    },
  Leo:         { en: 'Leo',         hi: 'सिंह',    sa: 'सिंहः'     },
  Virgo:       { en: 'Virgo',       hi: 'कन्या',   sa: 'कन्या'     },
  Libra:       { en: 'Libra',       hi: 'तुला',    sa: 'तुला'      },
  Scorpio:     { en: 'Scorpio',     hi: 'वृश्चिक', sa: 'वृश्चिकः'  },
  Sagittarius: { en: 'Sagittarius', hi: 'धनु',     sa: 'धनुः'      },
  Capricorn:   { en: 'Capricorn',   hi: 'मकर',     sa: 'मकरः'      },
  Aquarius:    { en: 'Aquarius',    hi: 'कुम्भ',   sa: 'कुम्भः'    },
  Pisces:      { en: 'Pisces',      hi: 'मीन',     sa: 'मीनः'      },
}

// ── Nakshatras ───────────────────────────────────────────────────────────────
export const NAKSHATRAS: Dict = {
  'Ashwini':           { en: 'Ashwini',           hi: 'अश्विनी',         sa: 'अश्विनी'         },
  'Bharani':           { en: 'Bharani',           hi: 'भरणी',            sa: 'भरणी'            },
  'Krittika':          { en: 'Krittika',          hi: 'कृत्तिका',         sa: 'कृत्तिका'        },
  'Rohini':            { en: 'Rohini',            hi: 'रोहिणी',           sa: 'रोहिणी'          },
  'Mrigashira':        { en: 'Mrigashira',        hi: 'मृगशिरा',          sa: 'मृगशिरः'         },
  'Ardra':             { en: 'Ardra',             hi: 'आर्द्रा',           sa: 'आर्द्रा'          },
  'Punarvasu':         { en: 'Punarvasu',         hi: 'पुनर्वसु',          sa: 'पुनर्वसु'         },
  'Pushya':            { en: 'Pushya',            hi: 'पुष्य',             sa: 'पुष्यः'           },
  'Ashlesha':          { en: 'Ashlesha',          hi: 'आश्लेषा',           sa: 'आश्लेषा'          },
  'Magha':             { en: 'Magha',             hi: 'मघा',              sa: 'मघा'             },
  'Purva Phalguni':    { en: 'Purva Phalguni',    hi: 'पूर्व फाल्गुनी',    sa: 'पूर्वफाल्गुनी'    },
  'Uttara Phalguni':   { en: 'Uttara Phalguni',   hi: 'उत्तर फाल्गुनी',   sa: 'उत्तरफाल्गुनी'   },
  'Hasta':             { en: 'Hasta',             hi: 'हस्त',             sa: 'हस्तः'            },
  'Chitra':            { en: 'Chitra',            hi: 'चित्रा',            sa: 'चित्रा'           },
  'Swati':             { en: 'Swati',             hi: 'स्वाती',            sa: 'स्वाती'           },
  'Vishakha':          { en: 'Vishakha',          hi: 'विशाखा',            sa: 'विशाखा'           },
  'Anuradha':          { en: 'Anuradha',          hi: 'अनुराधा',           sa: 'अनुराधा'          },
  'Jyeshtha':          { en: 'Jyeshtha',          hi: 'ज्येष्ठा',           sa: 'ज्येष्ठा'          },
  'Mula':              { en: 'Mula',              hi: 'मूल',              sa: 'मूलम्'            },
  'Purva Ashadha':     { en: 'Purva Ashadha',     hi: 'पूर्वाषाढा',        sa: 'पूर्वाषाढा'        },
  'Uttara Ashadha':    { en: 'Uttara Ashadha',    hi: 'उत्तराषाढा',        sa: 'उत्तराषाढा'        },
  'Shravana':          { en: 'Shravana',          hi: 'श्रवण',             sa: 'श्रवणः'           },
  'Dhanishtha':        { en: 'Dhanishtha',        hi: 'धनिष्ठा',           sa: 'धनिष्ठा'          },
  'Dhanishta':         { en: 'Dhanishtha',        hi: 'धनिष्ठा',           sa: 'धनिष्ठा'          },
  'Shatabhisha':       { en: 'Shatabhisha',       hi: 'शतभिषा',           sa: 'शतभिषक्'          },
  'Purva Bhadrapada':  { en: 'Purva Bhadrapada',  hi: 'पूर्व भाद्रपद',     sa: 'पूर्वभाद्रपदा'    },
  'Uttara Bhadrapada': { en: 'Uttara Bhadrapada', hi: 'उत्तर भाद्रपद',    sa: 'उत्तरभाद्रपदा'    },
  'Revati':            { en: 'Revati',            hi: 'रेवती',             sa: 'रेवती'            },
}

// ── Bhavas (Houses) ─────────────────────────────────────────────────────────
export const HOUSES: Dict = {
  'H1':  { en: 'H1 (Lagna)',    hi: 'प्रथम भाव (लग्न)',   sa: 'प्रथमभावः (लग्नम्)'   },
  'H2':  { en: 'H2 (Dhana)',    hi: 'द्वितीय भाव (धन)',   sa: 'द्वितीयभावः (धनम्)'   },
  'H3':  { en: 'H3 (Sahaja)',   hi: 'तृतीय भाव (सहज)',    sa: 'तृतीयभावः (सहजम्)'    },
  'H4':  { en: 'H4 (Sukha)',    hi: 'चतुर्थ भाव (सुख)',   sa: 'चतुर्थभावः (सुखम्)'   },
  'H5':  { en: 'H5 (Putra)',    hi: 'पञ्चम भाव (पुत्र)',   sa: 'पञ्चमभावः (पुत्रम्)'  },
  'H6':  { en: 'H6 (Ripu)',     hi: 'षष्ठ भाव (रिपु)',    sa: 'षष्ठभावः (रिपुः)'     },
  'H7':  { en: 'H7 (Kalatra)',  hi: 'सप्तम भाव (कलत्र)',  sa: 'सप्तमभावः (कलत्रम्)'  },
  'H8':  { en: 'H8 (Ayur)',     hi: 'अष्टम भाव (आयु)',    sa: 'अष्टमभावः (आयुः)'     },
  'H9':  { en: 'H9 (Dharma)',   hi: 'नवम भाव (धर्म)',     sa: 'नवमभावः (धर्मः)'      },
  'H10': { en: 'H10 (Karma)',   hi: 'दशम भाव (कर्म)',     sa: 'दशमभावः (कर्म)'       },
  'H11': { en: 'H11 (Labha)',   hi: 'एकादश भाव (लाभ)',    sa: 'एकादशभावः (लाभः)'     },
  'H12': { en: 'H12 (Vyaya)',   hi: 'द्वादश भाव (व्यय)',  sa: 'द्वादशभावः (व्ययः)'   },
}

// ── Tithi names ──────────────────────────────────────────────────────────────
export const TITHIS: Dict = {
  'Pratipada':      { en: 'Pratipada',      hi: 'प्रतिपदा',   sa: 'प्रतिपदा'    },
  'Dwitiya':        { en: 'Dwitiya',        hi: 'द्वितीया',   sa: 'द्वितीया'    },
  'Tritiya':        { en: 'Tritiya',        hi: 'तृतीया',     sa: 'तृतीया'      },
  'Chaturthi':      { en: 'Chaturthi',      hi: 'चतुर्थी',    sa: 'चतुर्थी'     },
  'Panchami':       { en: 'Panchami',       hi: 'पञ्चमी',     sa: 'पञ्चमी'      },
  'Shashthi':       { en: 'Shashthi',       hi: 'षष्ठी',      sa: 'षष्ठी'       },
  'Saptami':        { en: 'Saptami',        hi: 'सप्तमी',     sa: 'सप्तमी'      },
  'Ashtami':        { en: 'Ashtami',        hi: 'अष्टमी',     sa: 'अष्टमी'      },
  'Navami':         { en: 'Navami',         hi: 'नवमी',       sa: 'नवमी'        },
  'Dashami':        { en: 'Dashami',        hi: 'दशमी',       sa: 'दशमी'        },
  'Ekadashi':       { en: 'Ekadashi',       hi: 'एकादशी',     sa: 'एकादशी'      },
  'Dwadashi':       { en: 'Dwadashi',       hi: 'द्वादशी',    sa: 'द्वादशी'     },
  'Trayodashi':     { en: 'Trayodashi',     hi: 'त्रयोदशी',   sa: 'त्रयोदशी'    },
  'Chaturdashi':    { en: 'Chaturdashi',    hi: 'चतुर्दशी',   sa: 'चतुर्दशी'    },
  'Purnima/Amavasya': { en: 'Purnima/Amavasya', hi: 'पूर्णिमा/अमावस्या', sa: 'पूर्णिमा/अमावास्या' },
}

// ── Vara (Weekdays) ──────────────────────────────────────────────────────────
export const VARAS: Dict = {
  'Sunday':    { en: 'Sunday',    hi: 'रविवार',    sa: 'रविवासरः'    },
  'Monday':    { en: 'Monday',    hi: 'सोमवार',    sa: 'सोमवासरः'    },
  'Tuesday':   { en: 'Tuesday',   hi: 'मंगलवार',   sa: 'मङ्गलवासरः'  },
  'Wednesday': { en: 'Wednesday', hi: 'बुधवार',    sa: 'बुधवासरः'    },
  'Thursday':  { en: 'Thursday',  hi: 'गुरुवार',   sa: 'गुरुवासरः'   },
  'Friday':    { en: 'Friday',    hi: 'शुक्रवार',  sa: 'शुक्रवासरः'  },
  'Saturday':  { en: 'Saturday',  hi: 'शनिवार',    sa: 'शनिवासरः'    },
}

// ── Nitya Yogas ──────────────────────────────────────────────────────────────
export const NITYA_YOGAS: Dict = {
  'Vishkambha':  { en: 'Vishkambha',  hi: 'विष्कम्भ',  sa: 'विष्कम्भः'  },
  'Priti':       { en: 'Priti',       hi: 'प्रीति',    sa: 'प्रीतिः'    },
  'Ayushman':    { en: 'Ayushman',    hi: 'आयुष्मान्', sa: 'आयुष्मान्'  },
  'Saubhagya':   { en: 'Saubhagya',   hi: 'सौभाग्य',   sa: 'सौभाग्यम्'  },
  'Shobhana':    { en: 'Shobhana',    hi: 'शोभन',      sa: 'शोभनम्'     },
  'Atiganda':    { en: 'Atiganda',    hi: 'अतिगण्ड',   sa: 'अतिगण्डः'   },
  'Sukarman':    { en: 'Sukarman',    hi: 'सुकर्मन्',  sa: 'सुकर्मन्'   },
  'Dhriti':      { en: 'Dhriti',      hi: 'धृति',      sa: 'धृतिः'      },
  'Shula':       { en: 'Shula',       hi: 'शूल',       sa: 'शूलम्'      },
  'Ganda':       { en: 'Ganda',       hi: 'गण्ड',      sa: 'गण्डः'      },
  'Vriddhi':     { en: 'Vriddhi',     hi: 'वृद्धि',    sa: 'वृद्धिः'    },
  'Dhruva':      { en: 'Dhruva',      hi: 'ध्रुव',     sa: 'ध्रुवः'     },
  'Vyaghata':    { en: 'Vyaghata',    hi: 'व्याघात',   sa: 'व्याघातः'   },
  'Harshana':    { en: 'Harshana',    hi: 'हर्षण',     sa: 'हर्षणम्'    },
  'Vajra':       { en: 'Vajra',       hi: 'वज्र',      sa: 'वज्रम्'     },
  'Siddhi':      { en: 'Siddhi',      hi: 'सिद्धि',    sa: 'सिद्धिः'    },
  'Vyatipata':   { en: 'Vyatipata',   hi: 'व्यतीपात',  sa: 'व्यतीपातः'  },
  'Variyan':     { en: 'Variyan',     hi: 'वरीयान्',   sa: 'वरीयान्'    },
  'Parigha':     { en: 'Parigha',     hi: 'परिघ',      sa: 'परिघः'      },
  'Shiva':       { en: 'Shiva',       hi: 'शिव',       sa: 'शिवः'       },
  'Siddha':      { en: 'Siddha',      hi: 'सिद्ध',     sa: 'सिद्धः'     },
  'Sadhya':      { en: 'Sadhya',      hi: 'साध्य',     sa: 'साध्यः'     },
  'Shubha':      { en: 'Shubha',      hi: 'शुभ',       sa: 'शुभम्'      },
  'Shukla':      { en: 'Shukla',      hi: 'शुक्ल',     sa: 'शुक्लः'     },
  'Brahma':      { en: 'Brahma',      hi: 'ब्रह्म',    sa: 'ब्रह्म'     },
  'Indra':       { en: 'Indra',       hi: 'इन्द्र',    sa: 'इन्द्रः'    },
  'Vaidhriti':   { en: 'Vaidhriti',   hi: 'वैधृति',    sa: 'वैधृतिः'    },
}

// ── Karana names ─────────────────────────────────────────────────────────────
export const KARANAS: Dict = {
  'Bava':        { en: 'Bava',        hi: 'बव',        sa: 'बवः'        },
  'Balava':      { en: 'Balava',      hi: 'बालव',      sa: 'बालवः'      },
  'Kaulava':     { en: 'Kaulava',     hi: 'कौलव',      sa: 'कौलवः'      },
  'Taitila':     { en: 'Taitila',     hi: 'तैतिल',     sa: 'तैतिलः'     },
  'Garaja':      { en: 'Garaja',      hi: 'गरज',       sa: 'गरजः'       },
  'Vanija':      { en: 'Vanija',      hi: 'वणिज',      sa: 'वणिजः'      },
  'Vishti':      { en: 'Vishti',      hi: 'विष्टि',    sa: 'विष्टिः'    },
  'Shakuni':     { en: 'Shakuni',     hi: 'शकुनि',     sa: 'शकुनिः'     },
  'Chatushpada': { en: 'Chatushpada', hi: 'चतुष्पाद',  sa: 'चतुष्पादः'  },
  'Naga':        { en: 'Naga',        hi: 'नाग',       sa: 'नागः'       },
  'Kimstughna':  { en: 'Kimstughna',  hi: 'किंस्तुघ्न', sa: 'किंस्तुघ्नः' },
}

// ── Paksha ───────────────────────────────────────────────────────────────────
export const PAKSHA: Dict = {
  'Shukla':  { en: 'Shukla (Waxing)',  hi: 'शुक्ल पक्ष',  sa: 'शुक्लपक्षः'  },
  'Krishna': { en: 'Krishna (Waning)', hi: 'कृष्ण पक्ष', sa: 'कृष्णपक्षः'  },
}

// ── Dignity ──────────────────────────────────────────────────────────────────
export const DIGNITY: Dict = {
  'exalted':     { en: 'Exalted',     hi: 'उच्च',        sa: 'उच्चस्थः'     },
  'debilitated': { en: 'Debilitated', hi: 'नीच',         sa: 'नीचस्थः'      },
  'own':         { en: 'Own Sign',    hi: 'स्वराशि',     sa: 'स्वक्षेत्रम्' },
  'friendly':    { en: 'Friendly',    hi: 'मित्र राशि',  sa: 'मित्रक्षेत्रम्' },
  'neutral':     { en: 'Neutral',     hi: 'सम राशि',     sa: 'समक्षेत्रम्'   },
  'enemy':       { en: 'Enemy',       hi: 'शत्रु राशि',  sa: 'शत्रुक्षेत्रम्' },
  'retrograde':  { en: 'Retrograde',  hi: 'वक्री',       sa: 'वक्रः'          },
}

// ── Dasha systems ────────────────────────────────────────────────────────────
export const DASHAS: Dict = {
  'Vimshottari': { en: 'Vimshottari Dasha', hi: 'विंशोत्तरी दशा',  sa: 'विंशोत्तरीदशा'  },
  'Yogini':      { en: 'Yogini Dasha',      hi: 'योगिनी दशा',     sa: 'योगिनीदशा'      },
  'Chara':       { en: 'Chara Dasha',       hi: 'चर दशा',         sa: 'चरदशा'          },
  'Narayana':    { en: 'Narayana Dasha',    hi: 'नारायण दशा',     sa: 'नारायणदशा'      },
  'Ashtottari':  { en: 'Ashtottari Dasha',  hi: 'अष्टोत्तरी दशा', sa: 'अष्टोत्तरीदशा'  },
  'Kalachakra':  { en: 'Kalachakra Dasha',  hi: 'कालचक्र दशा',    sa: 'कालचक्रदशा'     },
  'Shoola':      { en: 'Shoola Dasha',      hi: 'शूल दशा',        sa: 'शूलदशा'         },
}

// ── Karakas (Jaimini) ────────────────────────────────────────────────────────
export const KARAKAS: Dict = {
  'Atmakaraka':    { en: 'Atmakaraka',    hi: 'आत्मकारक',   sa: 'आत्मकारकः'    },
  'Amatyakaraka':  { en: 'Amatyakaraka',  hi: 'अमात्यकारक', sa: 'अमात्यकारकः'  },
  'Bhratrikaraka': { en: 'Bhratrikaraka', hi: 'भ्रातृकारक',  sa: 'भ्रातृकारकः'  },
  'Matrikaraka':   { en: 'Matrikaraka',   hi: 'मातृकारक',   sa: 'मातृकारकः'    },
  'Putrakaraka':   { en: 'Putrakaraka',   hi: 'पुत्रकारक',  sa: 'पुत्रकारकः'   },
  'Gnatikaraka':   { en: 'Gnatikaraka',   hi: 'ज्ञातिकारक', sa: 'ज्ञातिकारकः'  },
  'Darakaraka':    { en: 'Darakaraka',    hi: 'दारकारक',    sa: 'दारकारकः'     },
  'Pitrikaraka':   { en: 'Pitrikaraka',   hi: 'पितृकारक',   sa: 'पितृकारकः'    },
}

// ── Nakshatra Lords (for display) ────────────────────────────────────────────
export const NAK_LORDS: Dict = {
  Ketu:    PLANETS.Ketu,
  Venus:   PLANETS.Venus,
  Sun:     PLANETS.Sun,
  Moon:    PLANETS.Moon,
  Mars:    PLANETS.Mars,
  Rahu:    PLANETS.Rahu,
  Jupiter: PLANETS.Jupiter,
  Saturn:  PLANETS.Saturn,
  Mercury: PLANETS.Mercury,
}

// ── UI Labels ────────────────────────────────────────────────────────────────
export const UI: Dict = {
  // Tabs
  'Birth Chart':        { en: 'Birth Chart',        hi: 'जन्म कुण्डली',     sa: 'जन्मकुण्डली'      },
  'Planets Table':      { en: 'Planets Table',      hi: 'ग्रह तालिका',      sa: 'ग्रहसारणी'         },
  'D9 / Vargas':        { en: 'D9 / Vargas',        hi: 'वर्ग कुण्डली',     sa: 'वर्गकुण्डल्यः'     },
  'Bhava Chalit':       { en: 'Bhava Chalit',       hi: 'भाव चलित',         sa: 'भावचलितम्'         },
  'Bhava Madhya':       { en: 'Bhava Madhya',       hi: 'भाव मध्य',         sa: 'भावमध्यम्'         },
  'Live Sky':           { en: 'Live Sky',            hi: 'वर्तमान आकाश',    sa: 'वर्तमानाकाशः'      },
  'Vimshottari':        { en: 'Vimshottari',         hi: 'विंशोत्तरी दशा',  sa: 'विंशोत्तरीदशा'     },
  'Yogini':             { en: 'Yogini',              hi: 'योगिनी दशा',      sa: 'योगिनीदशा'         },
  'Chara (Jaimini)':    { en: 'Chara (Jaimini)',     hi: 'चर दशा (जैमिनी)', sa: 'चरदशा (जैमिनिः)'  },
  'Narayana':           { en: 'Narayana',            hi: 'नारायण दशा',      sa: 'नारायणदशा'         },
  'Ashtottari':         { en: 'Ashtottari',          hi: 'अष्टोत्तरी दशा',  sa: 'अष्टोत्तरीदशा'     },
  'Kalachakra':         { en: 'Kalachakra',          hi: 'कालचक्र दशा',     sa: 'कालचक्रदशा'        },
  'Shoola / Niryana':   { en: 'Shoola / Niryana',    hi: 'शूल दशा',         sa: 'शूलदशा'            },
  'Sudarshana':         { en: 'Sudarshana',          hi: 'सुदर्शन चक्र',    sa: 'सुदर्शनचक्रम्'     },
  '☀ Varshaphal':       { en: '☀ Varshaphal',        hi: '☀ वर्षफल',        sa: '☀ वर्षफलम्'        },
  'Tithi Pravesha':     { en: 'Tithi Pravesha',      hi: 'तिथि प्रवेश',     sa: 'तिथिप्रवेशः'       },
  'Yogas':              { en: 'Yogas',               hi: 'योग',              sa: 'योगाः'             },
  'Shadbala':           { en: 'Shadbala',            hi: 'षड्बल',            sa: 'षड्बलम्'           },
  'Aspects':            { en: 'Aspects',             hi: 'दृष्टि',           sa: 'दृष्टिः'           },
  'Arudha Lagnas':      { en: 'Arudha Lagnas',       hi: 'आरूढ लग्न',       sa: 'आरूढलग्नम्'        },
  'Jaimini Karakas':    { en: 'Jaimini Karakas',     hi: 'जैमिनी कारक',     sa: 'जैमिनिकारकाः'      },
  'Special Lagnas':     { en: 'Special Lagnas',       hi: 'विशेष लग्न',      sa: 'विशेषलग्नानि'      },
  'Dignity Table':      { en: 'Dignity Table',        hi: 'ग्रह बल सारणी',  sa: 'ग्रहबलसारणी'       },
  '⚠ Doshas':           { en: '⚠ Doshas',            hi: '⚠ दोष',           sa: '⚠ दोषाः'           },
  'Combust / War':      { en: 'Combust / War',        hi: 'अस्त / ग्रहयुद्ध', sa: 'अस्तः / ग्रहयुद्धः' },
  'Upagrahas':          { en: 'Upagrahas',           hi: 'उपग्रह',           sa: 'उपग्रहाः'          },
  'Longevity':          { en: 'Longevity',            hi: 'आयुर्दाय',        sa: 'आयुर्दायः'         },
  'Sahams':             { en: 'Sahams',              hi: 'सहम',              sa: 'सहमानि'            },
  'Jaimini Aspects':    { en: 'Jaimini Aspects',     hi: 'जैमिनी दृष्टि',   sa: 'जैमिनिदृष्टिः'     },
  'Lagnesh Analysis':   { en: 'Lagnesh Analysis',    hi: 'लग्नेश विश्लेषण', sa: 'लग्नेशविश्लेषणम्'  },
  'Saptarishis':        { en: 'Saptarishis',         hi: 'सप्तर्षि',         sa: 'सप्तर्षयः'         },
  'Pancha Pakshi':      { en: 'Pancha Pakshi',       hi: 'पञ्च पक्षी',      sa: 'पञ्चपक्षिणः'       },
  'Transit Chart':      { en: 'Transit Chart',       hi: 'गोचर कुण्डली',    sa: 'गोचरकुण्डली'       },
  'Gochara':            { en: 'Gochara',             hi: 'गोचर',             sa: 'गोचरः'             },
  'Hit List':           { en: 'Hit List',            hi: 'ग्रह प्रभाव',     sa: 'ग्रहप्रभावः'        },
  'Transit → Natal':    { en: 'Transit → Natal',     hi: 'गोचर → जन्म',    sa: 'गोचरः → जन्मम्'    },
  'Ashtakavarga':       { en: 'Ashtakavarga',        hi: 'अष्टकवर्ग',       sa: 'अष्टकवर्गः'        },
  'Kota Chakra':        { en: 'Kota Chakra',         hi: 'कोट चक्र',        sa: 'कोटचक्रम्'         },
  'SBC Chakra':         { en: 'SBC Chakra',          hi: 'सर्वतोभद्र चक्र', sa: 'सर्वतोभद्रचक्रम्'  },
  'KP System':          { en: 'KP System',           hi: 'कृष्णमूर्ति पद्धति', sa: 'कृष्णमूर्तिपद्धतिः' },

  // Common UI
  'Planet':      { en: 'Planet',      hi: 'ग्रह',       sa: 'ग्रहः'       },
  'Sign':        { en: 'Sign',        hi: 'राशि',       sa: 'राशिः'       },
  'Degree':      { en: 'Degree',      hi: 'अंश',        sa: 'अंशः'        },
  'House':       { en: 'House',       hi: 'भाव',        sa: 'भावः'        },
  'Nakshatra':   { en: 'Nakshatra',   hi: 'नक्षत्र',   sa: 'नक्षत्रम्'   },
  'Lord':        { en: 'Lord',        hi: 'स्वामी',     sa: 'स्वामी'      },
  'Pada':        { en: 'Pada',        hi: 'पाद',        sa: 'पादः'        },
  'Status':      { en: 'Status',      hi: 'अवस्था',     sa: 'अवस्था'      },
  'Longitude':   { en: 'Longitude',   hi: 'रेखांश',     sa: 'रेखांशः'     },
  'Ascendant':   { en: 'Ascendant',   hi: 'लग्न',       sa: 'लग्नम्'      },
  'Lagna':       { en: 'Lagna',       hi: 'लग्न',       sa: 'लग्नम्'      },

  // Panchanga
  'Tithi':    { en: 'Tithi',   hi: 'तिथि',    sa: 'तिथिः'    },
  'Vara':     { en: 'Vara',    hi: 'वार',     sa: 'वासरः'    },
  'Yoga':     { en: 'Yoga',    hi: 'योग',     sa: 'योगः'     },
  'Karana':   { en: 'Karana',  hi: 'करण',    sa: 'करणम्'    },
  'Hora':     { en: 'Hora',    hi: 'होरा',    sa: 'होरा'     },

  // Buttons / misc
  'Export CSV':     { en: 'Export CSV',    hi: 'CSV निर्यात', sa: 'CSV निर्यातः'  },
  'North':          { en: 'North',         hi: 'उत्तर',       sa: 'उत्तरम्'       },
  'South':          { en: 'South',         hi: 'दक्षिण',      sa: 'दक्षिणम्'      },
  'Auspicious':     { en: 'Auspicious',    hi: 'शुभ',         sa: 'शुभम्'         },
  'Inauspicious':   { en: 'Inauspicious',  hi: 'अशुभ',        sa: 'अशुभम्'        },
  'Favorable':      { en: 'Favorable',     hi: 'अनुकूल',      sa: 'अनुकूलम्'      },
  'Unfavorable':    { en: 'Unfavorable',   hi: 'प्रतिकूल',    sa: 'प्रतिकूलम्'    },
  'Waxing Moon':    { en: 'Waxing Moon',   hi: 'शुक्ल पक्ष — चन्द्र', sa: 'शुक्लपक्षे चन्द्रः' },
  'Waning Moon':    { en: 'Waning Moon',   hi: 'कृष्ण पक्ष — चन्द्र', sa: 'कृष्णपक्षे चन्द्रः' },
}

// ── Tab group labels ─────────────────────────────────────────────────────────
export const TAB_GROUPS: Dict = {
  'Chart':    { en: 'Chart',    hi: 'कुण्डली',    sa: 'कुण्डली'     },
  'Dasha':    { en: 'Dasha',    hi: 'दशा',        sa: 'दशा'         },
  'Analysis': { en: 'Analysis', hi: 'विश्लेषण',   sa: 'विश्लेषणम्'  },
  'Transits': { en: 'Transits', hi: 'गोचर',       sa: 'गोचरः'       },
  'KP':       { en: 'KP',       hi: 'कृष्णमूर्ति', sa: 'कृष्णमूर्तिः' },
}

// ── App top-nav labels ───────────────────────────────────────────────────────
export const APP_NAV: Dict = {
  '☽ Prashna':       { en: '☽ Prashna',       hi: '☽ प्रश्न',         sa: '☽ प्रश्नः'         },
  '✦ Muhurta':       { en: '✦ Muhurta',       hi: '✦ मुहूर्त',        sa: '✦ मुहूर्तम्'       },
  '♥ Match':         { en: '♥ Match',         hi: '♥ विवाह मिलान',   sa: '♥ विवाहमेलनम्'    },
  'Compare':         { en: 'Compare',         hi: 'तुलना',            sa: 'तुलना'             },
  'Saved':           { en: 'Saved',           hi: 'सहेजे',            sa: 'संग्रहीतम्'        },
  'Clients':         { en: 'Clients',         hi: 'जातक',             sa: 'जातकाः'            },
  'Research':        { en: 'Research',        hi: 'शोध',              sa: 'शोधः'              },
  'AI':              { en: 'AI',              hi: 'AI सहायक',         sa: 'AI सहायकः'         },
  'Sign in':         { en: 'Sign in',         hi: 'प्रवेश',           sa: 'प्रवेशः'           },
}

// ── BirthForm labels ─────────────────────────────────────────────────────────
export const FORM: Dict = {
  'Full Name':            { en: 'Full Name',            hi: 'पूरा नाम',         sa: 'पूर्णनाम'           },
  'Date of Birth':        { en: 'Date of Birth',        hi: 'जन्म तिथि',        sa: 'जन्मतिथिः'          },
  'Time of Birth':        { en: 'Time of Birth',        hi: 'जन्म काल',         sa: 'जन्मकालः'           },
  'Birth Place':          { en: 'Birth Place',          hi: 'जन्म स्थान',       sa: 'जन्मस्थानम्'        },
  'Ayanamsa':             { en: 'Ayanamsa',             hi: 'अयनांश',           sa: 'अयनांशः'            },
  'Calculate Chart':      { en: 'Calculate Chart ⚡',   hi: 'कुण्डली बनाएं ⚡', sa: 'कुण्डलीं गणयतु ⚡'  },
  'Latitude':             { en: 'Latitude',             hi: 'अक्षांश',          sa: 'अक्षांशः'           },
  'Longitude':            { en: 'Longitude',            hi: 'रेखांश',           sa: 'रेखांशः'            },
  'Gender':               { en: 'Gender',               hi: 'लिंग',             sa: 'लिङ्गम्'            },
  'Male':                 { en: 'Male',                 hi: 'पुरुष',            sa: 'पुरुषः'             },
  'Female':               { en: 'Female',               hi: 'स्त्री',           sa: 'स्त्री'             },
  'Other':                { en: 'Other',                hi: 'अन्य',             sa: 'अन्यम्'             },
  'Coordinates & Timezone': { en: 'Coordinates & Timezone', hi: 'निर्देशांक एवं काल क्षेत्र', sa: 'निर्देशांकः कालक्षेत्रञ्च' },
}

// ── Dasha / timeline terms ───────────────────────────────────────────────────
export const DASHA_TERMS: Dict = {
  'Mahadasha':        { en: 'Mahadasha',         hi: 'महादशा',           sa: 'महादशा'            },
  'Antardasha':       { en: 'Antardasha',        hi: 'अन्तर्दशा',        sa: 'अन्तर्दशा'         },
  'Pratyantardasha':  { en: 'Pratyantardasha',   hi: 'प्रत्यन्तर्दशा',   sa: 'प्रत्यन्तर्दशा'    },
  'Balance':          { en: 'Balance',           hi: 'शेष',              sa: 'शेषम्'             },
  'Current':          { en: 'Current',           hi: 'वर्तमान',          sa: 'वर्तमानम्'         },
  'Start':            { en: 'Start',             hi: 'आरम्भ',            sa: 'आरम्भः'            },
  'End':              { en: 'End',               hi: 'समाप्ति',          sa: 'समाप्तिः'          },
  'Years':            { en: 'Years',             hi: 'वर्ष',             sa: 'वर्षाणि'           },
  'Months':           { en: 'Months',            hi: 'माह',              sa: 'मासाः'             },
  'Days':             { en: 'Days',              hi: 'दिन',              sa: 'दिनानि'            },
  'Duration':         { en: 'Duration',          hi: 'अवधि',             sa: 'अवधिः'             },
  'Period':           { en: 'Period',            hi: 'काल',              sa: 'कालः'              },
  'Dasha Lord':       { en: 'Dasha Lord',        hi: 'दशाधिपति',         sa: 'दशाधिपतिः'         },
  'Sub-period':       { en: 'Sub-period',        hi: 'अन्तर्दशा',        sa: 'अन्तर्दशा'         },
  'Active':           { en: 'Active',            hi: 'सक्रिय',           sa: 'सक्रियः'           },
  'Upcoming':         { en: 'Upcoming',          hi: 'आगामी',            sa: 'आगामी'             },
  'Past':             { en: 'Past',              hi: 'गत',               sa: 'गतम्'              },
}

// ── Shadbala / strength terms ────────────────────────────────────────────────
export const BALA: Dict = {
  'Shadbala':         { en: 'Shadbala',          hi: 'षड्बल',            sa: 'षड्बलम्'           },
  'Sthana Bala':      { en: 'Sthana Bala',       hi: 'स्थान बल',         sa: 'स्थानबलम्'         },
  'Dig Bala':         { en: 'Dig Bala',          hi: 'दिग्बल',           sa: 'दिग्बलम्'          },
  'Kala Bala':        { en: 'Kala Bala',         hi: 'काल बल',           sa: 'कालबलम्'           },
  'Chesta Bala':      { en: 'Chesta Bala',       hi: 'चेष्टा बल',        sa: 'चेष्टाबलम्'        },
  'Naisargika Bala':  { en: 'Naisargika Bala',   hi: 'नैसर्गिक बल',      sa: 'नैसर्गिकबलम्'      },
  'Drik Bala':        { en: 'Drik Bala',         hi: 'दृग्बल',           sa: 'दृग्बलम्'          },
  'Total':            { en: 'Total',             hi: 'कुल',              sa: 'योगः'              },
  'Required':         { en: 'Required',          hi: 'आवश्यक',           sa: 'आवश्यकम्'          },
  'Strength':         { en: 'Strength',          hi: 'बल',               sa: 'बलम्'              },
  'Strong':           { en: 'Strong',            hi: 'बलवान्',           sa: 'बलवान्'            },
  'Weak':             { en: 'Weak',              hi: 'निर्बल',           sa: 'निर्बलः'           },
}

// ── Yoga terms ───────────────────────────────────────────────────────────────
export const YOGA_TERMS: Dict = {
  'Raja Yoga':        { en: 'Raja Yoga',         hi: 'राजयोग',          sa: 'राजयोगः'           },
  'Dhana Yoga':       { en: 'Dhana Yoga',        hi: 'धन योग',          sa: 'धनयोगः'            },
  'Pancha Mahapurusha': { en: 'Pancha Mahapurusha', hi: 'पञ्च महापुरुष', sa: 'पञ्चमहापुरुषः'    },
  'Ruchaka':          { en: 'Ruchaka',           hi: 'रुचक',            sa: 'रुचकः'             },
  'Bhadra':           { en: 'Bhadra',            hi: 'भद्र',            sa: 'भद्रः'             },
  'Hamsa':            { en: 'Hamsa',             hi: 'हंस',             sa: 'हंसः'              },
  'Malavya':          { en: 'Malavya',           hi: 'मालव्य',          sa: 'मालव्यः'           },
  'Shasha':           { en: 'Shasha',            hi: 'शश',              sa: 'शशः'               },
  'Gajakesari':       { en: 'Gajakesari',        hi: 'गजकेसरी',         sa: 'गजकेसरीयोगः'       },
  'Budha Aditya':     { en: 'Budha Aditya',      hi: 'बुध-आदित्य',      sa: 'बुधादित्ययोगः'     },
  'Chandra Mangal':   { en: 'Chandra Mangal',    hi: 'चन्द्र-मङ्गल',    sa: 'चन्द्रमङ्गलयोगः'   },
  'Viparita Raja':    { en: 'Viparita Raja',     hi: 'विपरीत राज',      sa: 'विपरीतराजयोगः'     },
  'Neecha Bhanga':    { en: 'Neecha Bhanga',     hi: 'नीच भंग',         sa: 'नीचभङ्गः'          },
  'Kemadruma':        { en: 'Kemadruma',         hi: 'केमद्रुम',         sa: 'केमद्रुमः'          },
  'Kala Sarpa':       { en: 'Kala Sarpa',        hi: 'काल सर्प',        sa: 'कालसर्पयोगः'       },
  'Mangal Dosha':     { en: 'Mangal Dosha',      hi: 'मंगल दोष',        sa: 'मङ्गलदोषः'         },
  'Shrapit Dosha':    { en: 'Shrapit Dosha',     hi: 'श्रापित दोष',     sa: 'श्रापितदोषः'        },
  'Benefic':          { en: 'Benefic',           hi: 'शुभ ग्रह',        sa: 'शुभग्रहः'          },
  'Malefic':          { en: 'Malefic',           hi: 'पाप ग्रह',        sa: 'पापग्रहः'          },
  'Present':          { en: 'Present',           hi: 'उपस्थित',         sa: 'उपस्थितम्'         },
  'Absent':           { en: 'Absent',            hi: 'अनुपस्थित',       sa: 'अनुपस्थितम्'       },
  'Formed':           { en: 'Formed',            hi: 'निर्मित',         sa: 'निर्मितम्'         },
}

// ── Aspect terms ─────────────────────────────────────────────────────────────
export const ASPECT_TERMS: Dict = {
  'Aspects':          { en: 'Aspects',           hi: 'दृष्टि',           sa: 'दृष्टिः'           },
  'Drishti':          { en: 'Drishti',           hi: 'दृष्टि',           sa: 'दृष्टिः'           },
  'Aspect':           { en: 'Aspect',            hi: 'दृष्टि',           sa: 'दृष्टिः'           },
  '7th':              { en: '7th aspect',        hi: 'सप्तम दृष्टि',     sa: 'सप्तमदृष्टिः'      },
  '4th':              { en: '4th aspect',        hi: 'चतुर्थ दृष्टि',    sa: 'चतुर्थदृष्टिः'     },
  '8th':              { en: '8th aspect',        hi: 'अष्टम दृष्टि',     sa: 'अष्टमदृष्टिः'      },
  '5th':              { en: '5th aspect',        hi: 'पञ्चम दृष्टि',     sa: 'पञ्चमदृष्टिः'      },
  '9th':              { en: '9th aspect',        hi: 'नवम दृष्टि',       sa: 'नवमदृष्टिः'        },
  '3rd':              { en: '3rd aspect',        hi: 'तृतीय दृष्टि',     sa: 'तृतीयदृष्टिः'      },
  '10th':             { en: '10th aspect',       hi: 'दशम दृष्टि',       sa: 'दशमदृष्टिः'        },
  'Mutual':           { en: 'Mutual',            hi: 'परस्पर',           sa: 'परस्परम्'          },
  'Conjunction':      { en: 'Conjunction',       hi: 'युति',             sa: 'युतिः'             },
  'Opposition':       { en: 'Opposition',        hi: 'विपक्ष',           sa: 'विपक्षः'           },
  'Aspecting':        { en: 'Aspecting',         hi: 'दृष्टि डालता',     sa: 'दृष्टिं ददाति'     },
  'Aspected by':      { en: 'Aspected by',       hi: 'दृष्टि पाता',      sa: 'दृष्टिं प्राप्नोति' },
}

// ── Gochara (transit) terms ──────────────────────────────────────────────────
export const GOCHARA_TERMS: Dict = {
  'Gochara':          { en: 'Gochara',           hi: 'गोचर',             sa: 'गोचरः'             },
  'Transit':          { en: 'Transit',           hi: 'गोचर',             sa: 'गोचरः'             },
  'Natal':            { en: 'Natal',             hi: 'जन्म',             sa: 'जन्मम्'            },
  'Vedha':            { en: 'Vedha',             hi: 'वेध',              sa: 'वेधः'              },
  'Favorable':        { en: 'Favorable',         hi: 'अनुकूल',           sa: 'अनुकूलम्'          },
  'Unfavorable':      { en: 'Unfavorable',       hi: 'प्रतिकूल',         sa: 'प्रतिकूलम्'        },
  'Cancelled':        { en: 'Cancelled (Vedha)', hi: 'वेध द्वारा रद्द',  sa: 'वेधेन निरस्तम्'    },
  'Overall':          { en: 'Overall',           hi: 'सम्पूर्ण',         sa: 'समग्रम्'           },
  'Moon Sign':        { en: 'Moon Sign',         hi: 'चन्द्र राशि',      sa: 'चन्द्रराशिः'       },
  'From Moon':        { en: 'From Moon',         hi: 'चन्द्र से',        sa: 'चन्द्रात्'         },
}

// ── Varshaphal terms ─────────────────────────────────────────────────────────
export const VARSHA_TERMS: Dict = {
  'Varshaphal':       { en: 'Varshaphal',        hi: 'वर्षफल',           sa: 'वर्षफलम्'          },
  'Solar Return':     { en: 'Solar Return',      hi: 'वर्ष प्रवेश',      sa: 'वर्षप्रवेशः'       },
  'Varshesha':        { en: 'Varshesha',         hi: 'वर्षेश',           sa: 'वर्षेशः'           },
  'Muntha':           { en: 'Muntha',            hi: 'मुन्था',           sa: 'मुन्था'            },
  'Year':             { en: 'Year',              hi: 'वर्ष',             sa: 'वर्षम्'            },
  'Age':              { en: 'Age',               hi: 'आयु',              sa: 'आयुः'              },
  'Tajika':           { en: 'Tajika',            hi: 'ताजिक',            sa: 'ताजिकम्'           },
  'Ithasala':         { en: 'Ithasala',          hi: 'इत्थशाल',          sa: 'इत्थशालः'          },
  'Ishrafa':          { en: 'Ishrafa',           hi: 'इश्राफ',           sa: 'इश्राफः'           },
  'Yamaya':           { en: 'Yamaya',            hi: 'यमाय',             sa: 'यमायः'             },
}

// ── Jaimini specific terms ────────────────────────────────────────────────────
export const JAIMINI_TERMS: Dict = {
  'Chara Karaka':     { en: 'Chara Karaka',      hi: 'चर कारक',         sa: 'चरकारकः'           },
  'Rashi Dasha':      { en: 'Rashi Dasha',       hi: 'राशि दशा',        sa: 'राशिदशा'           },
  'Argala':           { en: 'Argala',            hi: 'अर्गल',            sa: 'अर्गलः'            },
  'Arudha':           { en: 'Arudha',            hi: 'आरूढ',             sa: 'आरूढम्'            },
  'Pada':             { en: 'Pada',              hi: 'पद',               sa: 'पदम्'              },
  'Upapada':          { en: 'Upapada',           hi: 'उप पद',            sa: 'उपदम्'             },
  'Darapada':         { en: 'Darapada',          hi: 'दार पद',           sa: 'दारपदम्'           },
}

// ── Dosha / special conditions ────────────────────────────────────────────────
export const DOSHA_TERMS: Dict = {
  'Dosha':            { en: 'Dosha',             hi: 'दोष',              sa: 'दोषः'              },
  'Kuja Dosha':       { en: 'Kuja Dosha',        hi: 'कुज दोष',         sa: 'कुजदोषः'           },
  'Manglik':          { en: 'Manglik',           hi: 'मांगलिक',          sa: 'मङ्गलदोषयुक्तः'    },
  'Combust':          { en: 'Combust',           hi: 'अस्त',             sa: 'अस्तः'             },
  'Combustion':       { en: 'Combustion',        hi: 'अस्त',             sa: 'अस्तः'             },
  'Planetary War':    { en: 'Planetary War',     hi: 'ग्रह युद्ध',       sa: 'ग्रहयुद्धः'        },
  'Graha Yuddha':     { en: 'Graha Yuddha',      hi: 'ग्रह युद्ध',       sa: 'ग्रहयुद्धः'        },
  'Winner':           { en: 'Winner',            hi: 'विजेता',           sa: 'विजेता'            },
  'Loser':            { en: 'Loser',             hi: 'पराजित',           sa: 'पराजितः'           },
  'Degrees from Sun': { en: 'Degrees from Sun',  hi: 'सूर्य से अंश',    sa: 'सूर्यात् अंशः'     },
  'Combust Limit':    { en: 'Combust Limit',     hi: 'अस्त सीमा',       sa: 'अस्तसीमा'          },
}

// ── Upagraha / special points ────────────────────────────────────────────────
export const UPAGRAHA_TERMS: Dict = {
  'Upagraha':         { en: 'Upagraha',          hi: 'उपग्रह',           sa: 'उपग्रहः'           },
  'Gulika':           { en: 'Gulika',            hi: 'गुलिक',            sa: 'गुलिकः'            },
  'Mandi':            { en: 'Mandi',             hi: 'मांदी',             sa: 'मान्दी'             },
  'Dhuma':            { en: 'Dhuma',             hi: 'धूम',              sa: 'धूमः'              },
  'Vyatipata':        { en: 'Vyatipata',         hi: 'व्यतीपात',         sa: 'व्यतीपातः'         },
  'Parivesha':        { en: 'Parivesha',         hi: 'परिवेष',           sa: 'परिवेषः'           },
  'Indrachapa':       { en: 'Indrachapa',        hi: 'इन्द्रचाप',        sa: 'इन्द्रचापः'        },
  'Upaketu':          { en: 'Upaketu',           hi: 'उपकेतु',           sa: 'उपकेतुः'           },
  'Kalavela':         { en: 'Kalavela',          hi: 'कालवेल',           sa: 'कालवेलः'           },
}

// ── Misc / common panel labels ────────────────────────────────────────────────
export const MISC: Dict = {
  'Birth Chart':       { en: 'Birth Chart',      hi: 'जन्म कुण्डली',    sa: 'जन्मकुण्डली'       },
  'Lagna':             { en: 'Lagna',            hi: 'लग्न',             sa: 'लग्नम्'            },
  'Ascendant':         { en: 'Ascendant',        hi: 'लग्न',             sa: 'लग्नम्'            },
  'Classical':         { en: 'Classical',        hi: 'शास्त्रीय',        sa: 'शास्त्रीयम्'       },
  'Interpretation':    { en: 'Interpretation',   hi: 'फलित',             sa: 'फलितम्'            },
  'Classical Interpretation': { en: 'Classical Interpretation', hi: 'शास्त्रीय फलित', sa: 'शास्त्रीयफलितम्' },
  'Natural Significations': { en: 'Natural Significations', hi: 'नैसर्गिक कारकत्व', sa: 'नैसर्गिककारकत्वम्' },
  'Conjunct':          { en: 'Conjunct',         hi: 'युत',              sa: 'युतः'              },
  'Conjunct Planets':  { en: 'Conjunct Planets', hi: 'युत ग्रह',         sa: 'युतग्रहाः'         },
  'Sources':           { en: 'Sources',          hi: 'स्रोत',            sa: 'स्रोतः'            },
  'Loading':           { en: 'Loading…',         hi: 'गणना हो रही है…', sa: 'गण्यते…'           },
  'No data':           { en: 'No data',          hi: 'कोई डेटा नहीं',   sa: 'कोऽपि नास्ति'      },
  'Export':            { en: 'Export',           hi: 'निर्यात',          sa: 'निर्यातः'          },
  'Print':             { en: 'Print',            hi: 'मुद्रण',           sa: 'मुद्रणम्'          },
  'Close':             { en: 'Close',            hi: 'बंद करें',         sa: 'बन्धयतु'           },
  'Show':              { en: 'Show',             hi: 'दिखाएं',           sa: 'दर्शयतु'           },
  'Hide':              { en: 'Hide',             hi: 'छुपाएं',           sa: 'गोपयतु'            },
  'Summary':           { en: 'Summary',          hi: 'सारांश',           sa: 'सारांशः'           },
  'Details':           { en: 'Details',          hi: 'विवरण',            sa: 'विवरणम्'           },
  'Position':          { en: 'Position',         hi: 'स्थिति',           sa: 'स्थितिः'           },
  'In House':          { en: 'In House',         hi: 'भाव में',          sa: 'भावे'              },
  'In Sign':           { en: 'In Sign',          hi: 'राशि में',         sa: 'राशौ'              },
  'Orb':               { en: 'Orb',              hi: 'अंश भेद',          sa: 'अंशभेदः'           },
  'Applying':          { en: 'Applying',         hi: 'समीप',             sa: 'समीपः'             },
  'Separating':        { en: 'Separating',       hi: 'दूर',              sa: 'दूरः'              },
  'Exact':             { en: 'Exact',            hi: 'यथार्थ',           sa: 'यथार्थम्'          },
  'Note':              { en: 'Note',             hi: 'टिप्पणी',          sa: 'टिप्पणी'           },
  'Ayanamsa':          { en: 'Ayanamsa',         hi: 'अयनांश',           sa: 'अयनांशः'           },
  'Lahiri':            { en: 'Lahiri',           hi: 'लाहिरी',           sa: 'लाहिरी'            },
  'KP':                { en: 'KP',               hi: 'कृष्णमूर्ति',       sa: 'कृष्णमूर्तिः'       },
  'Raman':             { en: 'Raman',            hi: 'रमण',              sa: 'रमणः'              },
  'Atmakaraka':        { en: 'Atmakaraka',       hi: 'आत्मकारक',         sa: 'आत्मकारकः'         },

  // Auth
  'Sign In':           { en: 'Sign In',          hi: 'प्रवेश करें',      sa: 'प्रविशतु'          },
  'Create Account':    { en: 'Create Account',   hi: 'खाता बनाएं',       sa: 'खातं निर्मातु'      },
  'Full Name':         { en: 'Full Name',        hi: 'पूरा नाम',         sa: 'पूर्णनाम'           },
  'Email':             { en: 'Email',            hi: 'ईमेल',             sa: 'ईमेल'               },
  'Password':          { en: 'Password',         hi: 'पासवर्ड',          sa: 'गुप्तशब्दः'         },
  'Please wait':       { en: 'Please wait…',     hi: 'प्रतीक्षा करें…',  sa: 'प्रतीक्षताम्…'      },
  'No account':        { en: "Don't have an account? Register", hi: 'खाता नहीं? पंजीकरण करें', sa: 'खातं नास्ति? पञ्जीकरणम्' },
  'Have account':      { en: 'Already have an account? Sign in', hi: 'खाता है? प्रवेश करें', sa: 'खातमस्ति? प्रविशतु' },

  // Live Sky
  'Current Sky':       { en: 'Current Sky',      hi: 'वर्तमान आकाश',     sa: 'वर्तमानाकाशः'       },
  'Live':              { en: 'Live',             hi: 'सजीव',             sa: 'सजीवम्'             },
  'Updates every minute': { en: 'Live · Updates every minute', hi: 'सजीव · प्रतिमिनट अपडेट', sa: 'सजीवम् · प्रतिमिनटं नवीयते' },
  'Tithi':             { en: 'Tithi',            hi: 'तिथि',             sa: 'तिथिः'              },
  'Hora Lord':         { en: 'Hora Lord',        hi: 'होरा स्वामी',      sa: 'होरानाथः'           },
  'Nakshatra':         { en: 'Nakshatra',        hi: 'नक्षत्र',          sa: 'नक्षत्रम्'          },
  'Loading sky data':  { en: 'Loading sky data…', hi: 'आकाश डेटा लोड हो रहा है…', sa: 'आकाशदत्तांशं लोड्यते…' },

  // Doshas
  'Dosha Summary':     { en: 'Dosha Summary',    hi: 'दोष सारांश',       sa: 'दोषसारांशः'         },
  'Present':           { en: 'Present',          hi: 'उपस्थित',          sa: 'विद्यते'            },
  'Absent':            { en: 'Absent',           hi: 'अनुपस्थित',        sa: 'नास्ति'             },
  'Not present':       { en: 'Not present in this chart', hi: 'इस कुण्डली में नहीं', sa: 'अत्र नास्ति' },
  'Severity':          { en: 'Severity',         hi: 'तीव्रता',          sa: 'तीव्रता'            },
  'Remedies':          { en: 'Remedies',         hi: 'उपाय',             sa: 'उपायाः'             },
  'Effects':           { en: 'Effects',          hi: 'प्रभाव',           sa: 'फलम्'               },
  'Calculating doshas': { en: 'Calculating doshas…', hi: 'दोष गणना हो रही है…', sa: 'दोषाः गण्यन्ते…' },
  'Upagrahas Shadow':  { en: 'Upagrahas — Shadow Points', hi: 'उपग्रह — छाया बिंदु', sa: 'उपग्रहाः — छायाबिन्दवः' },

  // Compatibility
  'Kundali Milan':     { en: 'Kundali Milan — 36 Guna Matching', hi: 'कुण्डली मिलान — ३६ गुण', sa: 'कुण्डलीमिलनम् — षट्त्रिंशद्गुणाः' },
  'Match Kundalis':    { en: '✦ Match Kundalis', hi: '✦ कुण्डली मिलाएं',  sa: '✦ कुण्डली मिलयतु' },
  'Calculating':       { en: 'Calculating…',     hi: 'गणना हो रही है…',  sa: 'गण्यते…'           },
  '8-Koota Breakdown': { en: '8-Koota Breakdown', hi: '८ कूट विश्लेषण', sa: 'अष्टकूटविश्लेषणम्'  },
  'compatibility':     { en: 'compatibility',    hi: 'अनुकूलता',         sa: 'सामञ्जस्यम्'        },
  'Important Notes':   { en: 'Important Notes',  hi: 'महत्वपूर्ण टिप्पणियाँ', sa: 'महत्त्वपूर्णटिप्पण्यः' },
  'Name':              { en: 'Name',             hi: 'नाम',              sa: 'नाम'                },
  'Gender':            { en: 'Gender',           hi: 'लिंग',             sa: 'लिङ्गम्'            },
  'Birth Place':       { en: 'Birth Place',      hi: 'जन्म स्थान',       sa: 'जन्मस्थानम्'        },
  'Year':              { en: 'Year',             hi: 'वर्ष',             sa: 'वर्षम्'             },
  'Month':             { en: 'Month',            hi: 'माह',              sa: 'मासः'               },
  'Day':               { en: 'Day',              hi: 'दिन',              sa: 'दिनम्'              },
  'Hour':              { en: 'Hour (24h)',        hi: 'घंटा (२४ घं.)',    sa: 'घटिका (२४)'         },
  'Minute':            { en: 'Minute',           hi: 'मिनट',             sa: 'क्षणः'              },
  'Latitude':          { en: 'Latitude',         hi: 'अक्षांश',          sa: 'अक्षांशः'           },
  'Longitude':         { en: 'Longitude',        hi: 'देशांतर',          sa: 'देशान्तरम्'          },
  'Search city':       { en: 'Search city…',     hi: 'शहर खोजें…',       sa: 'नगरम् अन्विष्यतु…'  },

  // Saved Charts / CRM
  'Saved Charts':      { en: 'Saved Charts',     hi: 'सहेजी कुण्डलियाँ', sa: 'संरक्षितकुण्डल्यः'  },
  'No saved charts':   { en: 'No saved charts yet. Calculate a chart and save it.', hi: 'कोई कुण्डली सहेजी नहीं। गणना करें और सहेजें।', sa: 'संरक्षितकुण्डली नास्ति।' },
  'Loading saved':     { en: 'Loading saved charts...', hi: 'सहेजी कुण्डलियाँ लोड हो रही हैं...', sa: 'संरक्षितकुण्डल्यः लोड्यन्ते...' },
  'Delete this chart': { en: 'Delete this chart?', hi: 'यह कुण्डली मिटाएं?', sa: 'कुण्डलीम् अपाकरोतु?' },
  'Clients':           { en: 'Clients',          hi: 'ग्राहक',           sa: 'ग्राहकाः'           },
  'Sessions':          { en: 'Sessions',         hi: 'सत्र',             sa: 'सत्राणि'            },
  'Appointments':      { en: 'Appointments',     hi: 'नियुक्तियाँ',       sa: 'नियुक्तयः'          },
  'Invoices':          { en: 'Invoices',         hi: 'चालान',            sa: 'शुल्कपत्राणि'        },
  'Predictions':       { en: 'Predictions',      hi: 'भविष्यवाणियाँ',    sa: 'भविष्यकथनानि'       },
  'No clients yet':    { en: 'No clients yet',   hi: 'अभी कोई ग्राहक नहीं', sa: 'कोऽपि ग्राहकः नास्ति' },
  'Add':               { en: '+ Add',            hi: '+ जोड़ें',          sa: '+ योजयतु'           },
  'Save':              { en: 'Save',             hi: 'सहेजें',           sa: 'संरक्षतु'           },
  'Cancel':            { en: 'Cancel',           hi: 'रद्द करें',        sa: 'निरस्यतु'           },
  'Notes':             { en: 'Notes',            hi: 'टिप्पणियाँ',        sa: 'टिप्पण्यः'          },
  'No contact':        { en: 'No contact',       hi: 'संपर्क नहीं',      sa: 'सम्पर्कः नास्ति'    },
  'Date':              { en: 'Date',             hi: 'तारीख',            sa: 'दिनाङ्कः'           },
  'Duration':          { en: 'Duration',         hi: 'अवधि',             sa: 'अवधिः'              },
  'Fee':               { en: 'Fee',              hi: 'शुल्क',            sa: 'शुल्कम्'            },
  'Status':            { en: 'Status',           hi: 'स्थिति',           sa: 'स्थितिः'            },
  'Select client':     { en: 'Select a client to view details', hi: 'विवरण देखने के लिए ग्राहक चुनें', sa: 'विवरणार्थं ग्राहकं चिनोतु' },
  'No sessions':       { en: 'No sessions recorded', hi: 'कोई सत्र दर्ज नहीं', sa: 'कोऽपि सत्रः नास्ति' },
  'Reading Sessions':  { en: 'Reading Sessions', hi: 'वाचन सत्र',        sa: 'वाचनसत्राणि'        },

  // AI Chat
  'Chart Analysis':    { en: 'Chart Analysis',   hi: 'कुण्डली विश्लेषण', sa: 'कुण्डलीविश्लेषणम्'  },
  'Research':          { en: 'Research',         hi: 'अनुसंधान',         sa: 'अनुसन्धानम्'        },
  'Thinking':          { en: 'Thinking…',        hi: 'सोच रहा है…',      sa: 'चिन्त्यते…'         },
  'Send':              { en: 'Send',             hi: 'भेजें',            sa: 'प्रेषयतु'           },
  'AI Placeholder Chart': { en: 'Ask about yogas, dashas, placements…', hi: 'योग, दशा, स्थिति के बारे में पूछें…', sa: 'योग-दशा-स्थितिं पृच्छतु…' },
  'AI Placeholder Research': { en: 'Research: e.g. "What placements indicate a surgeon?"', hi: 'अनुसंधान: उदा. "कौन से योग शल्यचिकित्सक दर्शाते हैं?"', sa: 'अनुसन्धानम्: उदा. "के योगाः शल्यचिकित्सकं दर्शयन्ति?"' },

  // Print/Export
  'Print Chart':       { en: 'Print Chart',      hi: 'कुण्डली मुद्रण',   sa: 'कुण्डलीं मुद्रयतु'  },
  'Export PDF':        { en: 'Export PDF',       hi: 'PDF निर्यात',      sa: 'PDF निर्यातः'        },
  'Copy':              { en: 'Copy',             hi: 'प्रतिलिपि',        sa: 'प्रतिलिपिः'          },

  // Research Lab
  'Research Lab':      { en: 'Research Lab',     hi: 'अनुसंधान प्रयोगशाला', sa: 'अनुसन्धानप्रयोगशाला' },
  'Filter':            { en: 'Filter',           hi: 'फ़िल्टर',          sa: 'फ़िल्टरः'            },
  'Search':            { en: 'Search',           hi: 'खोजें',            sa: 'अन्विष्यतु'          },
  'Moon Sign':         { en: 'Moon Sign',        hi: 'चंद्र राशि',       sa: 'चन्द्रराशिः'         },
  'Yoga':              { en: 'Yoga',             hi: 'योग',              sa: 'योगः'               },
  'Dasha':             { en: 'Dasha',            hi: 'दशा',              sa: 'दशा'                },
  'Results':           { en: 'Results',          hi: 'परिणाम',           sa: 'परिणामाः'            },
  'No results':        { en: 'No results found', hi: 'कोई परिणाम नहीं', sa: 'कोऽपि परिणामः नास्ति' },

  // Synastry / Comparison
  'Chart Comparison':  { en: 'Chart Comparison', hi: 'कुण्डली तुलना',    sa: 'कुण्डलीतुलना'        },
  'Person 1':          { en: 'Person 1',         hi: 'व्यक्ति १',        sa: 'प्रथमः'             },
  'Person 2':          { en: 'Person 2',         hi: 'व्यक्ति २',        sa: 'द्वितीयः'           },
  'Compare':           { en: 'Compare',          hi: 'तुलना करें',       sa: 'तुलयतु'             },
}

// ── Combined lookup ──────────────────────────────────────────────────────────
import { EXT } from './terms_ext'
import { EXT2 } from './terms_ext2'
import { EXT3 } from './terms_ext3'
import { EXT4 } from './terms_ext4'

const ALL_DICTS = [PLANETS, SIGNS, NAKSHATRAS, HOUSES, TITHIS, VARAS, NITYA_YOGAS,
                   KARANAS, PAKSHA, DIGNITY, DASHAS, KARAKAS, NAK_LORDS, UI,
                   TAB_GROUPS, APP_NAV, FORM, DASHA_TERMS, BALA, YOGA_TERMS,
                   ASPECT_TERMS, GOCHARA_TERMS, VARSHA_TERMS, JAIMINI_TERMS,
                   DOSHA_TERMS, UPAGRAHA_TERMS, MISC, EXT, EXT2, EXT3, EXT4]

export function translate(term: string, lang: Lang): string {
  if (lang === 'en') return term
  for (const dict of ALL_DICTS) {
    if (dict[term]) return dict[term][lang] || term
  }
  // Try partial match for "H1", "H2" etc
  if (/^H\d+$/.test(term)) {
    const entry = HOUSES[term]
    if (entry) return entry[lang] || term
  }
  // DEV-only: silently record untranslated keys so we can find i18n gaps
  // without flooding the console. Inspect via `window.__i18nMissing` (a Set),
  // or opt into logging with `localStorage.i18nDebug = '1'`.
  if (import.meta.env?.DEV && typeof window !== 'undefined') {
    const w = window as unknown as { __i18nMissing?: Set<string> }
    if (!w.__i18nMissing) w.__i18nMissing = new Set()
    if (!w.__i18nMissing.has(term)) {
      w.__i18nMissing.add(term)
      if (localStorage.getItem('i18nDebug') === '1') {
        console.warn(`[i18n] missing key (${lang}): "${term}"`)
      }
    }
  }
  return term
}
