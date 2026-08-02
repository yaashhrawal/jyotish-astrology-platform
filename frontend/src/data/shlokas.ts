/**
 * Classical shlokas (verse citations) — Batch 1: BPHS Ch. 3 (planet natures & dignity).
 *
 * NO FABRICATION: every `devanagari`/`iast` is the verbatim mula text parsed from the
 * public-domain source below and transliterated deterministically (indic_transliteration),
 * never authored by hand. `translation` + `breakdown` are our own faithful renderings
 * (derivative, trilingual). `ref` is the exact BPHS chapter.verse; `sourceUrl` is verifiable.
 * Source: sanskritdocuments.org — Bṛhat Parāśara Horā Śāstra (ITRANS edition).
 */
import type { Lang } from '../i18n/terms'

export interface Shloka {
  ref: string
  source: string
  sourceUrl: string
  topics: string[]
  devanagari: string
  iast: string
  translation: Record<Lang, string>
  breakdown: Record<Lang, string>
}

export const SHLOKAS: Shloka[] = [
  {
    ref: 'BPHS 3.12', source: 'Bṛhat Parāśara Horā Śāstra, Ch. 3 — Grahaguṇasvarūpa',
    sourceUrl: 'https://sanskritdocuments.org/doc_z_misc_sociology_astrology/par0110.itx',
    topics: ['karaka', 'Sun', 'Moon', 'Mars', 'Mercury'],
    devanagari: 'सर्वात्मा च दिवानाथो मनः कुमुदबान्धवः । सत्त्वं कुजो बुधैः प्रोक्तो बुधो वाणीप्रदायकः',
    iast: 'sarvātmā ca divānātho manaḥ kumudabāndhavaḥ | sattvaṃ kujo budhaiḥ prokto budho vāṇīpradāyakaḥ',
    translation: { en: 'The Sun is the soul of all; the Moon is the mind; Mars is strength; and Mercury, it is said, is the giver of speech.', hi: 'सूर्य सबकी आत्मा है; चन्द्र मन है; मंगल बल है; और बुध वाणी का दाता कहा गया है।', sa: 'सूर्यः सर्वस्य आत्मा, चन्द्रमा मनः, भौमो बलम्, बुधश्च वाग्दायकः प्रोक्तः।' },
    breakdown: { en: 'This is the root verse for the planetary karakas (significators). It anchors the Sun to atma (soul/vitality), the Moon to manas (mind/emotion), Mars to bala (strength, drive), and Mercury to vak (speech, intellect) — exactly the significations used throughout the reading.', hi: 'यह ग्रह-कारकों (द्योतक) का मूल श्लोक है। यह सूर्य को आत्मा (जीवनशक्ति), चन्द्र को मन (भाव), मंगल को बल (शक्ति, प्रेरणा), और बुध को वाक् (वाणी, बुद्धि) से जोड़ता है — ठीक वही कारकत्व जो सम्पूर्ण फलादेश में प्रयुक्त होते हैं।', sa: 'अयं ग्रहकारकाणां मूलश्लोकः। अत्र सूर्यः आत्मना (जीवनशक्त्या), चन्द्रः मनसा (भावेन), मंगलः बलेन (शक्त्या प्रेरणया च), बुधश्च वाचा (वाण्या बुद्ध्या च) संयुज्यते — यान्येव कारकत्वानि सर्वस्मिन् फलादेशे प्रयुज्यन्ते।' },
  },
  {
    ref: 'BPHS 3.13', source: 'Bṛhat Parāśara Horā Śāstra, Ch. 3 — Grahaguṇasvarūpa',
    sourceUrl: 'https://sanskritdocuments.org/doc_z_misc_sociology_astrology/par0110.itx',
    topics: ['karaka', 'Jupiter', 'Venus', 'Saturn'],
    devanagari: 'देवेज्यो ज्ञानसुखदो भृगुर्वीर्यप्रदयकः । ऋषिभिः प्राक्।ह्तनैः प्रोक्तश्छायासूनुश्च दुःखदः',
    iast: 'devejyo jñānasukhado bhṛgurvīryapradayakaḥ | ṛṣibhiḥ prāk|htanaiḥ proktaśchāyāsūnuśca duḥkhadaḥ',
    translation: { en: 'Jupiter bestows knowledge and happiness; Venus grants vigor; and Saturn, say the ancient sages, gives sorrow.', hi: 'गुरु ज्ञान और सुख प्रदान करते हैं; शुक्र वीर्य (ओज) देते हैं; और शनि, प्राचीन ऋषि कहते हैं, दुःख देते हैं।', sa: 'गुरुः ज्ञानं सुखं च ददाति, शुक्रो वीर्यं प्रयच्छति, शनिश्च दुःखं ददातीति प्राचीना ऋषयो वदन्ति।' },
    breakdown: { en: 'Continuing the karakas: Jupiter signifies jnana (wisdom) and sukha (well-being), Venus signifies virya (vitality, reproductive strength, refinement), and Saturn signifies duhkha (sorrow, delay, discipline through hardship).', hi: 'कारकों को आगे बढ़ाते हुए: गुरु ज्ञान (विवेक) और सुख (कल्याण) का कारक है, शुक्र वीर्य (जीवनशक्ति, प्रजनन-बल, सौष्ठव) का कारक है, और शनि दुःख (शोक, विलम्ब, कष्ट द्वारा अनुशासन) का कारक है।', sa: 'कारकाणाम् अनुवृत्तौ — गुरुः ज्ञानस्य (विवेकस्य) सुखस्य (कल्याणस्य) च कारकः, शुक्रो वीर्यस्य (जीवनशक्तेः प्रजननबलस्य सौष्ठवस्य च) कारकः, शनिश्च दुःखस्य (शोकस्य विलम्बस्य कष्टानुशासनस्य च) कारकः।' },
  },
  {
    ref: 'BPHS 3.14', source: 'Bṛhat Parāśara Horā Śāstra, Ch. 3 — Grahaguṇasvarūpa',
    sourceUrl: 'https://sanskritdocuments.org/doc_z_misc_sociology_astrology/par0110.itx',
    topics: ['karaka', 'status'],
    devanagari: 'रविचन्द्रौ तु राजानौ नेता ज्ञेयो धरात्मजः । बुधो राजकुमारश्च सचिवौ गुरुभार्गवौ',
    iast: 'ravicandrau tu rājānau netā jñeyo dharātmajaḥ | budho rājakumāraśca sacivau gurubhārgavau',
    translation: { en: 'The Sun and Moon are kings; Mars is the army-commander; Mercury is the crown-prince; Jupiter and Venus are the ministers.', hi: 'सूर्य और चन्द्र राजा हैं; मंगल सेनापति है; बुध युवराज है; गुरु और शुक्र मंत्री हैं।', sa: 'सूर्याचन्द्रमसौ राजानौ, मंगलः सेनापतिः, बुधो युवराजः, गुरुशुक्रौ मन्त्रिणौ।' },
    breakdown: { en: 'The planetary \'cabinet\' — a hierarchy of natural authority. Sun and Moon are royalty (self and mind), Mars the general (courage, defence), Mercury the heir (adaptable intellect), Jupiter and Venus the wise counsellors (dharma and pleasure). It frames how each graha exercises influence.', hi: 'ग्रहों का \'मंत्रिमण्डल\' — स्वाभाविक अधिकार का क्रम। सूर्य और चन्द्र राजवर्ग हैं (आत्मा और मन), मंगल सेनापति है (साहस, रक्षा), बुध उत्तराधिकारी है (अनुकूलनशील बुद्धि), गुरु और शुक्र विद्वान सलाहकार हैं (धर्म और सुख)। यह दर्शाता है कि प्रत्येक ग्रह किस प्रकार अपना प्रभाव डालता है।', sa: 'ग्रहाणां मन्त्रिमण्डलम् — स्वाभाविकाधिकारस्य क्रमः। सूर्याचन्द्रौ राजवर्गः (आत्मा मनश्च), मंगलः सेनापतिः (साहसं रक्षा च), बुध उत्तराधिकारी (अनुकूलनशीला बुद्धिः), गुरुशुक्रौ विद्वांसौ मन्त्रिणौ (धर्मः सुखं च)। एतत् दर्शयति कथं प्रत्येको ग्रहः स्वप्रभावं प्रयुङ्क्ते।' },
  },
  {
    ref: 'BPHS 3.22', source: 'Bṛhat Parāśara Horā Śāstra, Ch. 3 — Grahaguṇasvarūpa',
    sourceUrl: 'https://sanskritdocuments.org/doc_z_misc_sociology_astrology/par0110.itx',
    topics: ['guna'],
    devanagari: 'जीवसूर्येन्द्रवः सत्त्वं बुधशुक्रौ रजस्तथा । सूर्यपुत्रभरापुत्रौ तमःप्रकृतिकौ द्विज',
    iast: 'jīvasūryendravaḥ sattvaṃ budhaśukrau rajastathā | sūryaputrabharāputrau tamaḥprakṛtikau dvija',
    translation: { en: 'Jupiter, the Sun and the Moon are of sattva nature; Mercury and Venus are of rajas; Saturn and Mars are by nature tamas, O twice-born.', hi: 'गुरु, सूर्य और चन्द्र सत्त्व स्वभाव के हैं; बुध और शुक्र रजस् के हैं; हे द्विज, शनि और मंगल स्वभाव से तमस् हैं।', sa: 'गुरुः सूर्यश्च चन्द्रश्च सत्त्वस्वभावाः, बुधशुक्रौ रजोगुणौ, शनिमंगलौ स्वभावतस्तमसौ, हे द्विज।' },
    breakdown: { en: 'The three gunas classify planetary temperament. Sattva (Jupiter, Sun, Moon) = clarity, harmony; rajas (Mercury, Venus) = activity, desire; tamas (Saturn, Mars) = inertia, intensity, endurance. This colours how a planet\'s results feel when it is strong or afflicted.', hi: 'तीन गुण ग्रहों के स्वभाव का वर्गीकरण करते हैं। सत्त्व (गुरु, सूर्य, चन्द्र) = स्पष्टता, सामंजस्य; रजस् (बुध, शुक्र) = क्रियाशीलता, इच्छा; तमस् (शनि, मंगल) = जड़ता, तीव्रता, सहनशीलता। यह निर्धारित करता है कि ग्रह के बलवान या पीड़ित होने पर उसके फल कैसे अनुभव होते हैं।', sa: 'त्रयो गुणा ग्रहस्वभावं विभजन्ति। सत्त्वम् (गुरुः सूर्यश्चन्द्रश्च) = प्रसन्नता सामञ्जस्यं च; रजः (बुधशुक्रौ) = क्रियाशीलता इच्छा च; तमः (शनिमंगलौ) = जाड्यं तीव्रता सहनशीलता च। एतेन ग्रहस्य बलवत्त्वे पीडने वा तत्फलानि कीदृशानि अनुभूयन्ते इति निर्णीयते।' },
  },
  {
    ref: 'BPHS 3.49', source: 'Bṛhat Parāśara Horā Śāstra, Ch. 3 — Grahaguṇasvarūpa',
    sourceUrl: 'https://sanskritdocuments.org/doc_z_misc_sociology_astrology/par0110.itx',
    topics: ['dignity', 'exaltation'],
    devanagari: 'मेषो वृषो मृगः कन्या कर्को मीनस्तथा तुला । सूर्यादीनां क्रमादेते कथिता उच्चराशयः',
    iast: 'meṣo vṛṣo mṛgaḥ kanyā karko mīnastathā tulā | sūryādīnāṃ kramādete kathitā uccarāśayaḥ',
    translation: { en: 'Aries, Taurus, Capricorn, Virgo, Cancer, Pisces and Libra — these are declared, in order, the exaltation signs of the Sun, Moon, Mars, Mercury, Jupiter, Venus and Saturn.', hi: 'मेष, वृषभ, मकर, कन्या, कर्क, मीन और तुला — ये क्रमशः सूर्य, चन्द्र, मंगल, बुध, गुरु, शुक्र और शनि की उच्च राशियाँ कही गई हैं।', sa: 'मेषो वृषभो मकरः कन्या कर्कटो मीनस्तुला च — एताः क्रमेण सूर्यचन्द्रमंगलबुधगुरुशुक्रशनीनाम् उच्चराशयः कथिताः।' },
    breakdown: { en: 'The classical exaltation (uccha) signs, where each planet gives its highest results: Sun-Aries, Moon-Taurus, Mars-Capricorn, Mercury-Virgo, Jupiter-Cancer, Venus-Pisces, Saturn-Libra. When the reading marks a planet \'exalted\', this is the authority behind it.', hi: 'शास्त्रीय उच्च राशियाँ, जहाँ प्रत्येक ग्रह अपने सर्वोत्तम फल देता है: सूर्य-मेष, चन्द्र-वृषभ, मंगल-मकर, बुध-कन्या, गुरु-कर्क, शुक्र-मीन, शनि-तुला। जब फलादेश किसी ग्रह को \'उच्च\' दर्शाता है, तो इसी का प्रमाण है।', sa: 'शास्त्रीया उच्चराशयः, यत्र प्रत्येको ग्रहः स्वोत्तमफलानि ददाति — सूर्यो मेषे, चन्द्रो वृषभे, मंगलो मकरे, बुधः कन्यायां, गुरुः कर्कटे, शुक्रो मीने, शनिस्तुलायाम्। यदा फलादेशे कश्चिद् ग्रहः \'उच्चः\' इति निर्दिश्यते, तदा एतदेव प्रमाणम्।' },
  },
  {
    ref: 'BPHS 3.50', source: 'Bṛhat Parāśara Horā Śāstra, Ch. 3 — Grahaguṇasvarūpa',
    sourceUrl: 'https://sanskritdocuments.org/doc_z_misc_sociology_astrology/par0110.itx',
    topics: ['dignity', 'exaltation', 'debilitation'],
    devanagari: 'भागा दश त्रयोऽष्टाश्व्यस्तिथ्योऽक्षा भमिता नखाः । उच्चात् सप्तमभं नीचं तैरेवांशैः प्रकीर्तितम्',
    iast: 'bhāgā daśa trayo\'ṣṭāśvyastithyo\'kṣā bhamitā nakhāḥ | uccāt saptamabhaṃ nīcaṃ tairevāṃśaiḥ prakīrtitam',
    translation: { en: 'The deepest exaltation degrees are 10, 3, 28, 15, 5, 27 and 20 respectively; the sign seventh from the exaltation is the debilitation, at those very same degrees.', hi: 'परम उच्च के अंश क्रमशः 10, 3, 28, 15, 5, 27 और 20 हैं; उच्च से सातवीं राशि नीच होती है, उन्हीं अंशों पर।', sa: 'परमोच्चांशाः क्रमेण 10, 3, 28, 15, 5, 27, 20 च; उच्चात् सप्तमी राशिः नीचस्थानं, तेष्वेव अंशेषु।' },
    breakdown: { en: 'The exact peak-exaltation points (Sun 10 Aries, Moon 3 Taurus, Mars 28 Capricorn, Mercury 15 Virgo, Jupiter 5 Cancer, Venus 27 Pisces, Saturn 20 Libra). Debilitation (neecha) is the 7th sign at the same degree — the point of weakest results. This drives the dignity calculation.', hi: 'सटीक परम-उच्च बिंदु (सूर्य 10 मेष, चन्द्र 3 वृषभ, मंगल 28 मकर, बुध 15 कन्या, गुरु 5 कर्क, शुक्र 27 मीन, शनि 20 तुला)। नीच उसी अंश पर सातवीं राशि है — सबसे दुर्बल फल का बिंदु। यही बल-गणना (गरिमा) का आधार है।', sa: 'यथार्थपरमोच्चबिन्दवः (सूर्यो मेषे 10, चन्द्रो वृषभे 3, मंगलो मकरे 28, बुधः कन्यायां 15, गुरुः कर्कटे 5, शुक्रो मीने 27, शनिस्तुलायां 20)। नीचस्थानं तेष्वेव अंशेषु सप्तमी राशिः — दुर्बलतमफलस्य बिन्दुः। एतदेव ग्रहबलगणनायाः आधारः।' },
  },
]

/** Return shlokas whose topics intersect the given tags (order preserved). */
export function getShlokas(tags: string[]): Shloka[] {
  const set = new Set(tags)
  return SHLOKAS.filter(s => s.topics.some(t => set.has(t)))
}
