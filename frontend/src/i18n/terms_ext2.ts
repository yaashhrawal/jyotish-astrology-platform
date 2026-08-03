/**
 * i18n extension 2 — nav restructure + auth-first onboarding (Phase B/C).
 * Keys = exact English source string. Merged into ALL_DICTS in terms.ts.
 */
import type { Dict } from './terms_ext'

export const EXT2: Dict = {
  // ── Header sections / nav ──────────────────────────────────────────
  'Kundli':        { en: 'Kundli',        hi: 'कुंडली',        sa: 'कुण्डली' },
  'Business':      { en: 'Business',      hi: 'व्यवसाय',       sa: 'व्यवसायः' },
  'Language':      { en: 'Language',      hi: 'भाषा',          sa: 'भाषा' },
  'Guest':         { en: 'Guest',         hi: 'अतिथि',         sa: 'अतिथिः' },
  'Astrologer':    { en: 'Astrologer',    hi: 'ज्योतिषी',      sa: 'ज्योतिषी' },
  'Seeker':        { en: 'Seeker',        hi: 'जिज्ञासु',      sa: 'जिज्ञासुः' },
  'Hide form':     { en: 'Hide form',     hi: 'फ़ॉर्म छिपाएँ',  sa: 'प्रपत्रं गोपयतु' },
  'Hide':          { en: 'Hide',          hi: 'छिपाएँ',        sa: 'गोपयतु' },
  '+ New Chart':   { en: '+ New Chart',   hi: '+ नई कुंडली',   sa: '+ नवकुण्डली' },

  // ── Auth page ──────────────────────────────────────────────────────
  'Sign In':                 { en: 'Sign In',         hi: 'साइन इन',        sa: 'प्रवेशः' },
  'Create Account':          { en: 'Create Account',  hi: 'खाता बनाएँ',     sa: 'खातं रचयतु' },
  'Who are you?':            { en: 'Who are you?',    hi: 'आप कौन हैं?',    sa: 'भवान् कः?' },
  'Continue':                { en: 'Continue',        hi: 'आगे बढ़ें',       sa: 'अग्रे गच्छतु' },
  'Back':                    { en: 'Back',            hi: 'पीछे',           sa: 'पृष्ठतः' },
  'Please wait':             { en: 'Please wait',     hi: 'कृपया प्रतीक्षा करें', sa: 'कृपया प्रतीक्षताम्' },
  'Please fill all fields':  { en: 'Please fill all fields', hi: 'कृपया सभी फ़ील्ड भरें', sa: 'कृपया सर्वाणि क्षेत्राणि पूरयतु' },
  'Invalid credentials':     { en: 'Invalid credentials', hi: 'अमान्य विवरण', sa: 'अमान्यविवरणम्' },
  'Error occurred':          { en: 'Error occurred',  hi: 'त्रुटि हुई',      sa: 'दोषः अभवत्' },
  'No account':              { en: 'No account',      hi: 'खाता नहीं है? पंजीकरण करें', sa: 'खातं नास्ति? पञ्जीकरोतु' },
  'Have account':            { en: 'Have account',    hi: 'पहले से खाता है? साइन इन करें', sa: 'खातम् अस्ति? प्रविशतु' },
  'Professional astrologer': { en: 'Professional astrologer', hi: 'पेशेवर ज्योतिषी', sa: 'व्यावसायिकज्योतिषी' },
  'Exploring my own chart':  { en: 'Exploring my own chart',  hi: 'अपनी कुंडली देखना', sa: 'स्वकुण्डलीदर्शनम्' },
  'Manage clients, recommend gems, run my practice': { en: 'Manage clients, recommend gems, run my practice', hi: 'ग्राहक प्रबंधन, रत्न अनुशंसा, अभ्यास संचालन', sa: 'ग्राहकप्रबन्धनं रत्नसंस्तुतिः अभ्यासः च' },
  'Read my kundli, dashas, matching & remedies': { en: 'Read my kundli, dashas, matching & remedies', hi: 'अपनी कुंडली, दशा, मिलान व उपाय पढ़ें', sa: 'स्वकुण्डली दशा मेलनम् उपायाः च' },
  'Skip — just calculate a chart': { en: 'Skip — just calculate a chart', hi: 'छोड़ें — केवल कुंडली बनाएँ', sa: 'त्यजतु — केवलं कुण्डलीं गणयतु' },
  'Sub-arcsecond planetary positions · 16 divisional charts · classical interpretation.': { en: 'Sub-arcsecond planetary positions · 16 divisional charts · classical interpretation.', hi: 'अति-सूक्ष्म ग्रह स्थिति · १६ वर्ग · शास्त्रीय व्याख्या', sa: 'सूक्ष्मग्रहस्थितिः · षोडशवर्गाः · शास्त्रीयव्याख्या' },
  'Gem Remedies':  { en: 'Gem Remedies',  hi: 'रत्न उपाय',      sa: 'रत्नोपायाः' },

  // ── Auth extras (Google, guest, save-prompt) ───────────────────────
  'Log in':                     { en: 'Log in',           hi: 'लॉग इन',          sa: 'प्रवेशः' },
  'Continue with Google':       { en: 'Continue with Google', hi: 'Google से जारी रखें', sa: 'Google द्वारा प्रवेशः' },
  'or':                         { en: 'or',               hi: 'अथवा',            sa: 'अथवा' },
  'Continue as guest':          { en: 'Continue as guest', hi: 'अतिथि के रूप में जारी रखें', sa: 'अतिथिरूपेण अग्रे' },
  'Google sign-in coming soon': { en: 'Google sign-in coming soon', hi: 'Google साइन-इन शीघ्र आ रहा है', sa: 'Google प्रवेशः शीघ्रम् आगमिष्यति' },
  'Save this chart?':           { en: 'Save this chart?', hi: 'इस कुंडली को सहेजें?', sa: 'इमां कुण्डलीं रक्षतु?' },
  'Log in or create a free account to save charts, manage clients and unlock all features.': { en: 'Log in or create a free account to save charts, manage clients and unlock all features.', hi: 'कुंडली सहेजने, ग्राहक प्रबंधन व सभी सुविधाएँ अनलॉक करने हेतु लॉग इन करें या निःशुल्क खाता बनाएँ।', sa: 'कुण्डलीरक्षणाय ग्राहकप्रबन्धनाय सर्वसुविधाभ्यः च प्रविशतु निःशुल्कं खातं वा रचयतु।' },
  'Log in / Create account':    { en: 'Log in / Create account', hi: 'लॉग इन / खाता बनाएँ', sa: 'प्रवेशः / खातरचना' },
  'Maybe later':                { en: 'Maybe later',      hi: 'बाद में',         sa: 'पश्चात्' },

  // ── Divisional Charts Board ────────────────────────────────────────
  'Divisional Charts':          { en: 'Divisional Charts', hi: 'वर्ग कुंडलियाँ', sa: 'वर्गकुण्डल्यः' },
  'Add Chart':                  { en: 'Add Chart',        hi: 'कुंडली जोड़ें',   sa: 'कुण्डलीं योजयतु' },
  'Add Divisional Charts':      { en: 'Add Divisional Charts', hi: 'वर्ग कुंडलियाँ जोड़ें', sa: 'वर्गकुण्डल्यः योजयतु' },
  'Select the vargas to place on the board.': { en: 'Select the vargas to place on the board.', hi: 'बोर्ड पर दिखाने हेतु वर्ग चुनें।', sa: 'फलके स्थापयितुं वर्गान् चिनोतु।' },
  'Add to board':               { en: 'Add to board',     hi: 'बोर्ड में जोड़ें', sa: 'फलके योजयतु' },
  'col':                        { en: 'col',              hi: 'स्तंभ',           sa: 'स्तम्भः' },
  'Presets':                    { en: 'Presets',          hi: 'सेट',             sa: 'समुच्चयाः' },
  'Marriage':                   { en: 'Marriage',         hi: 'विवाह',           sa: 'विवाहः' },
  'Career':                     { en: 'Career',           hi: 'करियर',           sa: 'वृत्तिः' },
  'Progeny':                    { en: 'Progeny',          hi: 'संतान',           sa: 'सन्ततिः' },
  'Shodashavarga':              { en: 'Shodashavarga',    hi: 'षोडशवर्ग',        sa: 'षोडशवर्गः' },
  'LAGNA':                      { en: 'LAGNA',            hi: 'लग्न',            sa: 'लग्नम्' },
  'Remove':                     { en: 'Remove',           hi: 'हटाएँ',           sa: 'अपनयतु' },
  'selected':                   { en: 'selected',         hi: 'चयनित',           sa: 'चयनितम्' },
  'till':                        { en: 'till',             hi: 'तक',              sa: 'यावत्' },
  'Unlock your practice':        { en: 'Unlock your practice', hi: 'अपना व्यवसाय अनलॉक करें', sa: 'स्वव्यवसायम् उद्घाटयतु' },
  'Clients, invoices, branded PDF reports, client portal & prediction tracker. Free for 30 days.': { en: 'Clients, invoices, branded PDF reports, client portal & prediction tracker. Free for 30 days.', hi: 'ग्राहक, बिल, ब्रांडेड PDF रिपोर्ट, क्लाइंट पोर्टल व भविष्यवाणी ट्रैकर। 30 दिन निःशुल्क।', sa: 'ग्राहकाः बिलानि प्रतिवेदनानि ग्राहकद्वारं भविष्यवाणीलेखनं च। त्रिंशद्दिनानि निःशुल्कम्।' },
  'All calculations & gem earnings stay free.': { en: 'All calculations & gem earnings stay free.', hi: 'सभी गणनाएँ व रत्न आय निःशुल्क रहती हैं।', sa: 'सर्वाः गणनाः रत्नायः च निःशुल्काः।' },
  'Start 30-day free trial':     { en: 'Start 30-day free trial', hi: '30-दिन निःशुल्क परीक्षण शुरू करें', sa: 'त्रिंशद्दिन-निःशुल्कपरीक्षणम् आरभताम्' },

  // ── Shloka citations ───────────────────────────────────────────────
  'Shloka':           { en: 'Shloka',           hi: 'श्लोक',            sa: 'श्लोकः' },
  'Classical Source': { en: 'Classical Source', hi: 'शास्त्रीय स्रोत',  sa: 'शास्त्रीयस्रोतः' },
  'Translation':      { en: 'Translation',      hi: 'अनुवाद',           sa: 'अनुवादः' },
  'Breakdown':        { en: 'Breakdown',        hi: 'विवेचन',           sa: 'विवेचनम्' },

  // ── Interpretation panel ───────────────────────────────────────────
  'Interpretation':   { en: 'Interpretation',   hi: 'फलादेश',          sa: 'फलादेशः' },
  'Reading':          { en: 'Reading',          hi: 'वाचन',            sa: 'वाचनम्' },
  'Factors':          { en: 'Factors',          hi: 'कारक',            sa: 'कारकाणि' },
  'Judge in':         { en: 'Judge in',         hi: 'किसमें देखें',     sa: 'कुत्र विचार्यम्' },
  'Tension':          { en: 'Tension',          hi: 'विरोध',           sa: 'विरोधः' },
  'Calculate a chart first.': { en: 'Calculate a chart first.', hi: 'पहले कुंडली बनाएँ।', sa: 'प्रथमं कुण्डलीं गणयतु।' },
  'Rule-based · deterministic · every prediction cites its classical source. ★ = planet in the active daśā.': { en: 'Rule-based · deterministic · every prediction cites its classical source. ★ = planet in the active daśā.', hi: 'नियम-आधारित · सुनिश्चित · प्रत्येक कथन शास्त्रीय स्रोत उद्धृत करता है। ★ = सक्रिय दशा का ग्रह।', sa: 'नियमाधारितम् · निश्चितम् · प्रत्येकं कथनं शास्त्रीयस्रोतम् उद्धरति। ★ = सक्रियदशायाः ग्रहः।' },
  'Dasha Predictions': { en: 'Dasha Predictions', hi: 'दशा फलादेश', sa: 'दशाफलादेशः' },
  'Running now':        { en: 'Running now',        hi: 'अभी चल रही',      sa: 'अधुना प्रवर्तमाना' },
  'sub':               { en: 'sub',                hi: 'उप',             sa: 'अन्तर्' },
  'Mahādaśā timeline': { en: 'Mahādaśā timeline',  hi: 'महादशा समयरेखा', sa: 'महादशाकालक्रमः' },
  'now':               { en: 'now',                hi: 'अभी',            sa: 'अधुना' },
  'Rule-based · deterministic · every prediction cites its classical source.': { en: 'Rule-based · deterministic · every prediction cites its classical source.', hi: 'नियम-आधारित · सुनिश्चित · प्रत्येक कथन शास्त्रीय स्रोत उद्धृत करता है।', sa: 'नियमाधारितम् · निश्चितम् · प्रत्येकं कथनं शास्त्रीयस्रोतम् उद्धरति।' },
}
