/**
 * Classical Jyotish planet interpretation drawer.
 * Sources: BPHS, Phaladeepika, Saravali, Jataka Parijata.
 */

// ─── Karakatva (planet general significations) ───────────────────────────────
export const PLANET_KARAKATVA: Record<string, string> = {
  Sun:     "Atma (soul), father, authority, vitality, government, ego, leadership, bones, eyes, heart.",
  Moon:    "Mind, mother, emotions, water, public life, nourishment, memory, blood, lungs.",
  Mars:    "Energy, courage, younger siblings, land, accidents, surgery, enemies, muscular system, blood.",
  Mercury: "Intellect, communication, commerce, mathematics, skin, nervous system, friends, discrimination.",
  Jupiter: "Wisdom, dharma, children, teachers, fortune, liver, fat, higher education, expansion.",
  Venus:   "Spouse, comforts, arts, vehicles, reproductive system, semen, luxury, beauty, diplomacy.",
  Saturn:  "Longevity, service, sorrow, delays, servants, bones, chronic illness, discipline, karma.",
  Rahu:    "Illusion, foreigners, ambition, sudden events, unconventional paths, obsession, material desires.",
  Ketu:    "Liberation, past-life karma, spiritual insight, detachment, accidents, wounds, psychic ability.",
}

// ─── Planet in House (BPHS / classical) ─────────────────────────────────────
export const PLANET_IN_HOUSE: Record<string, string[]> = {
  Sun: [
    "H1 — Strong, healthy, proud self. Leadership qualities. May be self-centered. Physical vitality is strong.",
    "H2 — Wealth through father or government. Good speech. Eye trouble possible. Family honour matters.",
    "H3 — Courageous, younger siblings benefit or suffer. Good for writing/media. Short journeys favoured.",
    "H4 — Domestic happiness fluctuates. Mother may be authoritative. Property through government possible.",
    "H5 — Intelligent, few children or delay in progeny. Creative power. Strong connection to speculation.",
    "H6 — Defeats enemies. Success in service/govt jobs. Health issues related to digestion or pitta.",
    "H7 — Spouse may be dominant or ego conflicts in partnership. Business with govt. Delayed marriage.",
    "H8 — Longevity challenged. Obstacles and hidden enmities. Chronic ailments. Occult interest possible.",
    "H9 — Fortunate, righteous, father a guide. Good for higher learning, long journeys, dharmic life.",
    "H10 — Powerful career, fame, high status. Success in politics or govt. Career front and centre.",
    "H11 — Gains through father, govt, men in authority. Elder siblings help. Fulfillment of desires.",
    "H12 — Expenditures, foreign travel, spiritual retreat. Losses through government or authority figures.",
  ],
  Moon: [
    "H1 — Sensitive, emotional, changeable personality. Attractive, popular. Strong bond with mother.",
    "H2 — Wealth fluctuates with Moon's phase. Good imagination, sweet speech. Family-oriented.",
    "H3 — Curious, restless mind. Frequent short travels. Younger siblings emotional or close.",
    "H4 — Best placement for Moon. Happy home, nurturing mother. Emotional security, property gains.",
    "H5 — Creative, intelligent, many children. Artistic flair. Emotional investments, speculation.",
    "H6 — Health worries, emotional anxiety. Service-oriented. Enemies through women. Digestive issues.",
    "H7 — Beautiful, emotional spouse. Partnership important for wellbeing. Popularity with public.",
    "H8 — Longevity of mother affected. Hidden emotions, psychic sensitivity. Inheritance possible.",
    "H9 — Pious, dharmic, fortunate mother. Love of pilgrimage and philosophy. Prosperous in foreign lands.",
    "H10 — Public career, fame, popularity. Works with masses or public. Emotional about status.",
    "H11 — Gains through women, public, mother. Elder siblings helpful. Many friends, desires fulfilled.",
    "H12 — Sleeping disorders, foreign residence. Spiritual inclinations. Expenditure on comforts.",
  ],
  Mars: [
    "H1 — Bold, energetic, aggressive. Leadership and initiative. Accident-prone. Lagna Mars = Manglik.",
    "H2 — Harsh speech, family conflicts, financial instability. Gains through boldness or siblings.",
    "H3 — Very brave, good for siblings (or conflict with them). Strong willpower. Short journeys auspicious.",
    "H4 — Domestic strife, property disputes, mother's health. Vehicles possible. Land dealings.",
    "H5 — Few children or conflicts with them. Speculative losses. Passionate intellect and boldness.",
    "H6 — Excellent — defeats all enemies. Strong in conflicts. Good for surgery, military, competitive fields.",
    "H7 — Marital conflicts, domineering spouse. Business disputes. Manglik effects strongest here.",
    "H8 — Short life indicated classically; modern interpretation: surgeries, occult, in-laws' wealth.",
    "H9 — Father's health or relationship challenged. Aggressive in dharma. Favours army, sports, law.",
    "H10 — Excellent for career — bold, achieving, leadership. Success in military, engineering, sports.",
    "H11 — Gains through courage and siblings. Elder siblings conflict. Good profits from land and effort.",
    "H12 — Expenditure through enemies. Foreign residence. Bed comforts. Secret enemies drain energy.",
  ],
  Mercury: [
    "H1 — Intelligent, communicative, youthful appearance. Witty, dual-natured. Analytical personality.",
    "H2 — Good for speech, writing, trade. Financial intellect. Eloquent and persuasive.",
    "H3 — Excellent — sharp mind, good for writing, teaching, communication arts. Siblings intelligent.",
    "H4 — Happy, educated, good home environment. Learning in comfort. Mother intelligent.",
    "H5 — High intelligence, good for children (especially first). Mathematical ability. Scholarly.",
    "H6 — Skilled at analysis and defeating opponents through wit. Service sector careers do well.",
    "H7 — Intelligent, communicative spouse. Business partnerships with intellect. Good for trade.",
    "H8 — Research ability, occult sciences. Longevity generally good. Inheritance through intellect.",
    "H9 — Philosophical, learned, good writing. Father may be scholar. Dharmic inclinations.",
    "H10 — Career in writing, teaching, commerce, IT. Intelligent approach to profession. Fame.",
    "H11 — Gains through intelligence and communication. Friends in intellectual circles. Desires fulfilled.",
    "H12 — Foreign trade profits. Expenditure on education. Spiritual learning abroad.",
  ],
  Jupiter: [
    "H1 — Wise, generous, righteous personality. Broad body. Teacher-like demeanour. Auspicious lagna.",
    "H2 — Wealthy, good family, eloquent. Philosophical speech. Benefits from father and teachers.",
    "H3 — Good for siblings but native may be less bold. Writing and teaching of philosophical subjects.",
    "H4 — Happy home, educated mother, property. Conveyances and comforts. Good for land.",
    "H5 — Excellent — highly intelligent, good children, creative. Dharmic inclinations. Speculative gains.",
    "H6 — Enemies are neutralised by native's grace. Health good. Helpful in service. Some legal issues.",
    "H7 — Wise, dharmic spouse. Excellent for marriage. Business partnerships fruitful. Gains from contracts.",
    "H8 — Longevity good. Spiritual transformation. In-laws wealthy. Occult wisdom. Hidden blessings.",
    "H9 — Best placement for Jupiter. Very fortunate, righteous, learned. Father is teacher/guru. Dharma.",
    "H10 — Excellent career — respected, successful, spiritual. Adviser, teacher, judge, priest-like roles.",
    "H11 — Gains from all sources. Elder siblings are helpful. Desires fulfilled. Philosophical social circle.",
    "H12 — Expenditure on dharmic causes. Foreign spirituality. Loss through generosity. Moksha inclination.",
  ],
  Venus: [
    "H1 — Attractive, charming, artistic personality. Love of comfort and beauty. Romantic nature.",
    "H2 — Wealthy through spouse or arts. Sweet speech, beautiful face. Gains from luxury goods.",
    "H3 — Artistic communication. Siblings bring comfort. Love of short pleasure journeys.",
    "H4 — Happy home, good vehicles, devoted mother. Comfort-loving. Property through spouse.",
    "H5 — Creative, romantic, good for artistic children. Speculation through pleasures. Charming intellect.",
    "H6 — Love complications, health through indulgence. Gains through healing arts, beauty industry.",
    "H7 — Excellent — beautiful, loving, compatible spouse. Happy marriage. Partnership brings wealth.",
    "H8 — Spouse's wealth comes to native. Hidden pleasures. Long life. In-laws wealthy. Occult arts.",
    "H9 — Fortunate through arts and beauty. Dharmic spouse. Travel for pleasure. Father artistic.",
    "H10 — Career in arts, beauty, media, diplomacy, fashion. Fame through creativity. Respected.",
    "H11 — Gains through arts, women, luxury goods. Fulfilled desires. Friends in elite circles.",
    "H12 — Foreign pleasures, bed comforts, spiritual devotion. Expenditure on luxuries. Foreign spouse.",
  ],
  Saturn: [
    "H1 — Serious, hardworking, delays in life. Thin or dark body. Chronic health issues early on. Longevity.",
    "H2 — Financial hardships, delayed wealth, family burdens. Speech may be harsh or limited.",
    "H3 — Strong discipline, service-oriented siblings. Slow but determined communication. Perseverance.",
    "H4 — Unhappy home, property disputes, mother's hardships. Old property gains late in life.",
    "H5 — Delayed or few children. Serious intellectual nature. Difficulty in speculation. Disciplined.",
    "H6 — Excellent — powerful defeat of enemies through persistence. Strong in service. Long-term success.",
    "H7 — Late marriage, serious or much-older spouse. Slow business. Karmic partnerships.",
    "H8 — Long life (Saturn's own nature). Chronic hidden ailments. In-laws burdens. Occult discipline.",
    "H9 — Father's hardships or detachment. Slow dharmic progress. Service to elders. Karma yoga.",
    "H10 — Excellent for career — disciplined, hardworking, rises slowly but surely. Political/administrative.",
    "H11 — Slow gains but persistent. Elder siblings may be burdensome. Gradual fulfillment of goals.",
    "H12 — Foreign residence, isolation, spiritual discipline. Service in institutions. Moksha possible.",
  ],
  Rahu: [
    "H1 — Unconventional personality, foreign influences on self. Ambitious, may deceive or be deceived.",
    "H2 — Unusual speech or eating habits. Foreign wealth. Family not conventional. Financial deception risk.",
    "H3 — Unusual communication style. Foreign siblings or connections. Bold but devious in effort.",
    "H4 — Disrupted home life, foreign property. Mother's health affected. Unconventional education.",
    "H5 — Unconventional children or no children. Unusual intellect. Speculation and speculation losses.",
    "H6 — Powerful — crushes enemies through unconventional means. Foreign diseases. Service abroad.",
    "H7 — Foreign or unusual spouse. Unconventional partnerships. Marital disruptions. Business abroad.",
    "H8 — Sudden events, accidents, hidden matters. Occult fascination. Longevity needs other support.",
    "H9 — Unorthodox dharma, challenges to father. Foreign spirituality. Guru may be unusual.",
    "H10 — Success through unconventional career. Foreign work. Ambitious career, sudden rise and fall.",
    "H11 — Gains through foreign sources, unusual friends. Elder sibling issues. Desires fulfilled unusually.",
    "H12 — Foreign residence, hidden expenditures. Spiritual gains through unconventional means.",
  ],
  Ketu: [
    "H1 — Spiritually inclined, detached personality. Mysterious appearance. Past-life wisdom shows.",
    "H2 — Detachment from family wealth and speech. Spiritual speech. Family karma to resolve.",
    "H3 — Psychic communication, detached from siblings. Intuitive writing. Unusual short journeys.",
    "H4 — Detachment from mother and home. Spiritual learning. Disrupted domestic happiness.",
    "H5 — Past-life intelligence, detachment from children. Spiritual creativity. Unusual progeny karma.",
    "H6 — Powerful — dissolves enemies and disease through karma. Healing and mystical abilities.",
    "H7 — Karmic spouse, past-life partnership. Detachment in marriage. Spiritual partnerships.",
    "H8 — Excellent for occult mastery. Past-life hidden knowledge. Longevity with caution.",
    "H9 — Past-life dharma. Detachment from father or guru. Spiritual liberation through service.",
    "H10 — Karmic career, spiritual work. Unexpected career changes. Recognition in past-life domains.",
    "H11 — Unexpected gains and losses. Elder siblings karmic. Unusual fulfillment of desires.",
    "H12 — Excellent — moksha. Past-life spiritual merit. Foreign spiritual residence. Liberation.",
  ],
}

// ─── Planet in Sign (brief classical) ────────────────────────────────────────
export const PLANET_IN_SIGN: Record<string, Record<string, string>> = {
  Sun: {
    Aries: "Exalted at 10°. Full vitality, leadership, pioneering energy. Excellent for authority.",
    Taurus: "Sensual, materialistic Sun. Stubborn authority. Fixed values.",
    Gemini: "Intellectual, communicative. Split authority. Dual pursuits.",
    Cancer: "Emotional, sensitive soul. Authority through nurturing. Vulnerable ego.",
    Leo: "Own sign. Dignified, royal, creative. Natural leader and performer.",
    Virgo: "Analytical, service-oriented. Critical intellect. Health-focused authority.",
    Libra: "Debilitated at 10°. Ego struggles with fairness. Indecisive authority. Partnership-oriented.",
    Scorpio: "Intense, transformative soul. Hidden power. Investigative nature.",
    Sagittarius: "Righteous, philosophical, expansive. Fortunate and spiritually inclined.",
    Capricorn: "Disciplined, career-focused. Authority through hard work. Ambitious but cold.",
    Aquarius: "Humanitarian, unconventional authority. Scientific outlook. Reformative.",
    Pisces: "Sensitive, compassionate. Spiritual or idealistic soul. Boundaries unclear.",
  },
  Moon: {
    Aries: "Impulsive emotions, quick reactions. Independent, restless mind.",
    Taurus: "Exalted. Stable, sensual, content mind. Love of beauty and comfort. Steady emotions.",
    Gemini: "Curious, communicative, changeable emotions. Dual thinking.",
    Cancer: "Own sign. Nurturing, intuitive, empathetic. Strong bond with mother and home.",
    Leo: "Proud, generous emotions. Creative mind. Desires recognition and love.",
    Virgo: "Analytical, critical mind. Attention to health and details. Service-oriented emotions.",
    Libra: "Charming, balanced emotions. Love of harmony. Indecisive but diplomatic.",
    Scorpio: "Debilitated. Intense, secretive emotions. Jealousy, transformation through feeling.",
    Sagittarius: "Optimistic, philosophical mind. Love of travel and freedom.",
    Capricorn: "Disciplined, restrained emotions. Ambitious mind. Duty-bound feelings.",
    Aquarius: "Humanitarian feelings. Detached, intellectual emotions. Friend-oriented.",
    Pisces: "Dreamy, compassionate, psychic mind. Spiritual emotions. Boundary dissolution.",
  },
  Mars: {
    Aries: "Own sign. Bold, pioneering, energetic. Pure Martian fire. Leadership.",
    Taurus: "Fixed energy, persistent effort. Material fights. Stubborn in action.",
    Gemini: "Scattered energy. Sharp tongue. Multiple simultaneous efforts.",
    Cancer: "Debilitated. Energy turned inward emotionally. Family conflicts. Restless home.",
    Leo: "Dramatic, proud energy. Leadership battles. Courageous creativity.",
    Virgo: "Precise, analytical action. Service-oriented drive. Health-focused effort.",
    Libra: "Diplomatic conflict style. Energy through partnerships. Legal battles.",
    Scorpio: "Own sign. Intense, transformative power. Secret strength. Investigative.",
    Sagittarius: "Righteous fighter. Energy for dharma and truth. Philosophical battles.",
    Capricorn: "Exalted at 28°. Maximum Martian power — disciplined, strategic, achieving. Best placement.",
    Aquarius: "Humanitarian effort. Unconventional energy. Group action.",
    Pisces: "Diffused energy. Spiritual warrior. Action through compassion.",
  },
  Mercury: {
    Aries: "Quick, impulsive intellect. Sharp but impatient thinking.",
    Taurus: "Practical, methodical thinking. Financial intelligence.",
    Gemini: "Own sign. Brilliant communicator, versatile mind. Best Mercury placement.",
    Cancer: "Intuitive intelligence, emotional reasoning. Good memory.",
    Leo: "Creative intellect, dramatic expression. Proud of knowledge.",
    Virgo: "Exalted and own sign. Pinnacle of analytical and discriminative power. Perfectionist.",
    Libra: "Diplomatic, balanced thinking. Legal mind. Fair reasoning.",
    Scorpio: "Deep, investigative, secretive intellect. Research-oriented.",
    Sagittarius: "Philosophical, expansive thinking. May overlook details.",
    Capricorn: "Disciplined, practical, strategic intellect. Business mind.",
    Aquarius: "Scientific, humanitarian intellect. Inventive and unconventional.",
    Pisces: "Debilitated. Dreamy, impractical, compassionate intellect. Spiritual intuition.",
  },
  Jupiter: {
    Aries: "Expansive, pioneering wisdom. Leadership through dharma.",
    Taurus: "Exalted at 5°. Abundant, prosperity-giving. Wealth through dharma. Best placement.",
    Gemini: "Intellectual, communicative expansion. Teaching through writing.",
    Cancer: "Exalted at 5°. Highly auspicious — nurturing wisdom, emotional dharma. Very fortunate.",
    Leo: "Royal wisdom, generous leadership. Teaching through drama and authority.",
    Virgo: "Debilitated at 5°. Wisdom constrained by details. Teaching through service.",
    Libra: "Diplomatic wisdom, just expansion. Law and partnership dharma.",
    Scorpio: "Deep, transformative wisdom. Occult and research expansion.",
    Sagittarius: "Own sign. Highest dharmic expression. Philosophy, higher learning, spirituality.",
    Capricorn: "Debilitated at 5°. Wisdom constrained by ambition. Material over spiritual.",
    Aquarius: "Humanitarian wisdom, scientific dharma. Group expansion.",
    Pisces: "Own sign. Deeply spiritual, compassionate wisdom. Liberation-oriented.",
  },
  Venus: {
    Aries: "Passionate, impulsive love. Creative drive in relationships.",
    Taurus: "Own sign. Abundant pleasures, beauty, wealth. Sensual and content.",
    Gemini: "Intellectual, communicative love. Multiple aesthetic interests.",
    Cancer: "Emotional, nurturing love. Home comforts. Devoted but moody.",
    Leo: "Dramatic, proud love. Artistic and generous. Needs admiration.",
    Virgo: "Debilitated at 27°. Love constrained by criticism. Analytical relationships.",
    Libra: "Own sign. Excellent — harmonious, beautiful, diplomatic. Best for relationships.",
    Scorpio: "Intense, transformative love. Deep attachments. Hidden pleasures.",
    Sagittarius: "Philosophical, freedom-loving relationships. Spiritual beauty.",
    Capricorn: "Disciplined love, dutiful partnerships. Material comforts through effort.",
    Aquarius: "Unconventional relationships, humanitarian love. Group aesthetics.",
    Pisces: "Exalted at 27°. Highest devotion and love. Spiritual and artistic beauty. Selfless.",
  },
  Saturn: {
    Aries: "Debilitated at 20°. Frustrated discipline, conflicts with authority. Impulsive restrictions.",
    Taurus: "Practical, persistent discipline. Steady material building. Slow but sure wealth.",
    Gemini: "Disciplined communication, serious intellect. Slow but precise thinking.",
    Cancer: "Emotional restriction, mother's hardships. Disciplined home life.",
    Leo: "Authority struggles, ego discipline. Government service. Conflict with leaders.",
    Virgo: "Excellent — precise, analytical discipline. Hard work in service. Excellent karma yoga.",
    Libra: "Exalted at 20°. Excellent — balanced, just discipline. Political and administrative peak.",
    Scorpio: "Deep, transformative discipline. Chronic hidden issues. Occult persistence.",
    Sagittarius: "Dharmic discipline, philosophical restrictions. Service to religion/education.",
    Capricorn: "Own sign. Maximum Saturnine power — hardworking, disciplined, achieving.",
    Aquarius: "Own sign. Humanitarian discipline, scientific structure. Group service.",
    Pisces: "Spiritual discipline, isolated service. Moksha through karma.",
  },
  Rahu: {
    Aries: "Ambitious, pioneering obsessions. Unconventional leadership drives.",
    Taurus: "Material obsession, foreign wealth accumulation. Unconventional comforts.",
    Gemini: "Communication obsession, foreign connections in media. Multiple deceptions.",
    Cancer: "Emotional obsession, foreign home or mother. Unusual nourishment.",
    Leo: "Ambition for power and recognition. Unconventional authority. Eclipse of ego.",
    Virgo: "Perfectionist obsession, foreign service. Health through unusual means.",
    Libra: "Diplomatic obsession, foreign partnerships. Justice-seeking through unusual means.",
    Scorpio: "Deep obsession with secrets, occult. Transformative foreign connections.",
    Sagittarius: "Foreign philosophy, unconventional dharma. Guru from abroad.",
    Capricorn: "Ambitious obsession with career, foreign professional success.",
    Aquarius: "Exalted (some traditions). Humanitarian obsession. Unconventional groups.",
    Pisces: "Spiritual obsession, dissolution of boundaries. Foreign spiritual paths.",
  },
  Ketu: {
    Aries: "Detachment from self-initiative. Past-life warrior energy. Spiritual courage.",
    Taurus: "Detachment from material comforts. Past-life wealth karma. Simplicity.",
    Gemini: "Detachment from communication. Psychic intellect. Past-life knowledge.",
    Cancer: "Detachment from home and mother. Past-life nurturing karma.",
    Leo: "Detachment from ego and power. Past-life royalty. Spiritual humility.",
    Virgo: "Detachment from analysis and service. Past-life healing karma.",
    Libra: "Exalted (some traditions). Karmic partnerships. Spiritual justice.",
    Scorpio: "Exalted. Powerful moksha karaka. Past-life occult mastery. Liberation.",
    Sagittarius: "Detachment from dharma and teachers. Past-life philosophical wisdom.",
    Capricorn: "Detachment from career ambitions. Past-life discipline.",
    Aquarius: "Detachment from groups and ideals. Past-life humanitarian service.",
    Pisces: "Debilitated (some). Spiritual dissolution. Past-life moksha path. Boundary loss.",
  },
}

// ─── Parashari aspect rules ───────────────────────────────────────────────────
const SPECIAL_ASPECTS: Record<string, number[]> = {
  Mars:    [4, 8],
  Jupiter: [5, 9],
  Saturn:  [3, 10],
  Rahu:    [5, 9],
  Ketu:    [5, 9],
}

export function getAspectedHouses(planet: string, fromHouse: number): number[] {
  const houses: number[] = [((fromHouse - 1 + 6) % 12) + 1] // 7th from house
  const extras = SPECIAL_ASPECTS[planet] || []
  for (const offset of extras) {
    houses.push(((fromHouse - 1 + offset - 1) % 12) + 1)
  }
  return [...new Set(houses)].sort((a, b) => a - b)
}

export function getPlanetsAspectingHouse(
  targetHouse: number,
  allPlanets: Record<string, { house: number }>
): string[] {
  const aspectingPlanets: string[] = []
  for (const [name, pd] of Object.entries(allPlanets)) {
    const aspected = getAspectedHouses(name, pd.house)
    if (aspected.includes(targetHouse)) {
      aspectingPlanets.push(name)
    }
  }
  return aspectingPlanets
}

// ─── Synthesis text ───────────────────────────────────────────────────────────
const HOUSE_DOMAIN: Record<number, string> = {
  1: "self, body, personality",
  2: "wealth, speech, family",
  3: "courage, siblings, communication",
  4: "home, mother, property",
  5: "intelligence, children, creativity",
  6: "enemies, health, service",
  7: "spouse, partnerships, business",
  8: "longevity, transformation, hidden matters",
  9: "fortune, father, dharma",
  10: "career, status, authority",
  11: "gains, elder siblings, desires",
  12: "loss, liberation, foreign",
}

// What each aspecting planet does to the planet it aspects
const ASPECT_EFFECT: Record<string, Record<string, string>> = {
  Sun: {
    Sun: "Sun's self-aspect strengthens authority and ego expression.",
    Moon: "Sun on Moon: authoritative pressure on mind — confidence possible, but emotional rigidity or father-mind conflicts.",
    Mars: "Sun on Mars: double fire — bold, aggressive energy amplified; leadership drive heightened but temper risk rises.",
    Mercury: "Sun on Mercury: intellect gains authority and directness; communication becomes confident but less flexible.",
    Jupiter: "Sun on Jupiter: dharma and wisdom gain royal support; excellent for leadership, spiritual authority, and fortune.",
    Venus: "Sun on Venus: creativity and comfort gain visibility; ego may clash with artistic sensitivity or relationships.",
    Saturn: "Sun on Saturn: discipline gains authority; conflicts between ego and duty; delays in self-expression possible.",
    Rahu: "Sun on Rahu: ambition amplified; unconventional authority; sudden rise through bold or foreign connections.",
    Ketu: "Sun on Ketu: ego dissolves spiritually; past-life authority resurfaces; detachment from power.",
  },
  Moon: {
    Sun: "Moon on Sun: emotional sensitivity infuses the soul; public appeal, but mood affects decisions.",
    Moon: "Moon's self-aspect deepens emotional receptivity and intuition.",
    Mars: "Moon on Mars: emotions fuel action; passionate but impulsive energy; mother-sibling themes intertwine.",
    Mercury: "Moon on Mercury: intuitive intelligence; emotional communication; good memory; imagination enriches intellect.",
    Jupiter: "Moon on Jupiter: nurturing wisdom; emotional abundance; mother's blessings; popular and well-loved.",
    Venus: "Moon on Venus: heightened sensitivity in love and arts; emotional comforts sought; strong aesthetic feelings.",
    Saturn: "Moon on Saturn: emotional restraint and discipline; melancholy possible; duty overrides feeling; longevity.",
    Rahu: "Moon on Rahu: emotional obsession; unusual mental states; foreign emotional pulls; imagination amplified.",
    Ketu: "Moon on Ketu: psychic sensitivity; past-life emotional patterns surface; detachment from material comforts.",
  },
  Mars: {
    Sun: "Mars on Sun: boldness and drive infuse the soul; leadership becomes aggressive; action-oriented authority.",
    Moon: "Mars on Moon: emotional restlessness; impulsive reactions; energy into home and mother themes.",
    Mars: "Mars self-aspect: double courage and aggression; extreme drive; accident-prone if uncontrolled.",
    Mercury: "Mars on Mercury: sharp, decisive intellect; argument tendency; engineering or technical communication excels.",
    Jupiter: "Mars on Jupiter: energetic dharma; ambitious wisdom; disputes in philosophy; over-confidence in beliefs.",
    Venus: "Mars on Venus: passionate desires; strong romantic drive; conflict between aggression and harmony in relationships.",
    Saturn: "Mars on Saturn: friction between action and restriction; hard work yields results slowly; mechanical skill.",
    Rahu: "Mars on Rahu: explosive, unconventional aggression; sudden violent or passionate events; foreign conflicts.",
    Ketu: "Mars on Ketu: karmic aggression; past-life warrior energy re-emerges; accidents with spiritual lessons.",
  },
  Mercury: {
    Sun: "Mercury on Sun: analytical intelligence refines authority; communication of self becomes more precise and logical.",
    Moon: "Mercury on Moon: analytical mind over emotions; clever intuition; memory and learning enhanced.",
    Mars: "Mercury on Mars: strategic, calculated action; debates and sharp arguments; technical problem-solving.",
    Mercury: "Mercury self-aspect: acute analytical and communicative ability.",
    Jupiter: "Mercury on Jupiter: philosophical intellect; teaching and writing abilities strengthened; scholarly dharma.",
    Venus: "Mercury on Venus: artistic intellect; charming communication; business acumen in creative fields.",
    Saturn: "Mercury on Saturn: disciplined, methodical thinking; slow but precise; engineering or law mind.",
    Rahu: "Mercury on Rahu: unconventional intellect; foreign communication; technology and innovation; possible deception.",
    Ketu: "Mercury on Ketu: psychic intellect; past-life knowledge surfaces; non-linear, intuitive reasoning.",
  },
  Jupiter: {
    Sun: "Jupiter on Sun: dharmic blessing on the soul; authority becomes righteous and generous; excellent for leadership.",
    Moon: "Jupiter on Moon: emotional wisdom and contentment; mother's blessings; philosophical and nurturing mind.",
    Mars: "Jupiter on Mars: righteous courage; action aligned with dharma; legal or philosophical battles won.",
    Mercury: "Jupiter on Mercury: expansive, philosophical intellect; excellent teacher or writer; wisdom in communication.",
    Jupiter: "Jupiter self-aspect: abundant wisdom and fortune; highly auspicious for all signified matters.",
    Venus: "Jupiter on Venus: dharmic love and relationships; spiritual beauty; marriage blessed with wisdom and prosperity.",
    Saturn: "Jupiter on Saturn: wisdom softens restriction; dharmic discipline; slow but spiritually rewarding work.",
    Rahu: "Jupiter on Rahu: wisdom moderates obsession; dharmic guidance on unconventional paths; foreign wisdom.",
    Ketu: "Jupiter on Ketu: spiritual wisdom; past-life dharma blossoms; liberation through teaching and knowledge.",
  },
  Venus: {
    Sun: "Venus on Sun: charm and beauty influence the soul; artistic authority; comfortable ego; diplomatic leadership.",
    Moon: "Venus on Moon: emotional love and beauty; strong aesthetic sensitivity; romantic and nurturing feelings.",
    Mars: "Venus on Mars: passionate action; desire drives energy; romance intersects with aggression; creative drive.",
    Mercury: "Venus on Mercury: charming, artistic communication; diplomatic intellect; business in beauty or arts.",
    Jupiter: "Venus on Jupiter: prosperous, harmonious dharma; beautiful wisdom; excellent for marriage and fortune.",
    Venus: "Venus self-aspect: heightened beauty, pleasure, and relationship focus.",
    Saturn: "Venus on Saturn: disciplined love; delayed but lasting relationships; practical approach to comfort.",
    Rahu: "Venus on Rahu: obsessive desires; unconventional or foreign relationships; unusual pleasures.",
    Ketu: "Venus on Ketu: karmic relationships; past-life love resurfaces; spiritual over material beauty.",
  },
  Saturn: {
    Sun: "Saturn on Sun: authority restrained by karma; delays in father-related matters; disciplined soul; slow rise.",
    Moon: "Saturn on Moon: emotional restriction; serious mind; duty above feeling; melancholy; longevity focus.",
    Mars: "Saturn on Mars: frustration between action and restraint; persistent effort; mechanical skill developed slowly.",
    Mercury: "Saturn on Mercury: disciplined, precise intellect; slow learning but deep mastery; legal or scientific mind.",
    Jupiter: "Saturn on Jupiter: wisdom disciplined by karma; slow dharmic progress; service-oriented philosophy.",
    Venus: "Saturn on Venus: delayed or serious relationships; practical love; discipline in pleasures; karmic partnerships.",
    Saturn: "Saturn self-aspect: extreme discipline and restriction; karmic delays amplified; long-term perseverance.",
    Rahu: "Saturn on Rahu: karmic pressure on obsessions; unconventional discipline; foreign restrictions.",
    Ketu: "Saturn on Ketu: double karmic energy; extreme detachment; spiritual discipline; past-life restrictions surface.",
  },
  Rahu: {
    Sun: "Rahu on Sun: ego amplified unconventionally; foreign or unusual authority; ambition over-rides dharma.",
    Moon: "Rahu on Moon: obsessive mind; foreign emotional pulls; unusual or amplified imagination; mental restlessness.",
    Mars: "Rahu on Mars: explosive, unconventional aggression; foreign conflicts; sudden and forceful action.",
    Mercury: "Rahu on Mercury: unconventional intellect; foreign communication; technology fascination; possible deception.",
    Jupiter: "Rahu on Jupiter: foreign or unusual wisdom; non-traditional dharma; amplified ambition for knowledge.",
    Venus: "Rahu on Venus: obsessive desires; foreign or unusual relationships; amplified sensual indulgence.",
    Saturn: "Rahu on Saturn: double restriction with unconventional twist; foreign karmic debts; unusual discipline.",
    Rahu: "Rahu self-aspect: obsession and illusion doubled.",
    Ketu: "Rahu-Ketu opposition: axis tension between desire and detachment; karmic life themes.",
  },
  Ketu: {
    Sun: "Ketu on Sun: ego dissolves; past-life authority; spiritual leadership; detachment from recognition.",
    Moon: "Ketu on Moon: psychic mind; past-life emotional patterns; detachment from nurturing; intuitive gifts.",
    Mars: "Ketu on Mars: karmic aggression; sudden accidents; past-life warrior; action without expectation.",
    Mercury: "Ketu on Mercury: intuitive intellect over analytical; past-life knowledge; non-linear communication.",
    Jupiter: "Ketu on Jupiter: past-life wisdom applied; detachment from teachers; spiritual over material dharma.",
    Venus: "Ketu on Venus: karmic relationships; past-life love; detachment from pleasures; spiritual beauty.",
    Saturn: "Ketu on Saturn: double karmic energy; extreme detachment; intense spiritual discipline.",
    Rahu: "Ketu-Rahu opposition: karmic axis activated; tension between past detachment and future desire.",
    Ketu: "Ketu self-aspect: deep past-life karma; intense spiritual detachment.",
  },
}

export function buildSynthesis(
  planet: string, sign: string, house: number,
  aspectedHouses: number[], aspectedBy: string[], retrograde: boolean, status: string
): string {
  const domain = HOUSE_DOMAIN[house] || `house ${house}`
  const aspHouseText = aspectedHouses.map(h => `H${h} (${HOUSE_DOMAIN[h] || h})`).join(', ')

  let lines: string[] = []

  // Core placement
  lines.push(`${planet} in ${sign} (H${house}) brings its energy of ${PLANET_KARAKATVA[planet]?.split(',')[0]?.toLowerCase() || 'its significations'} to the domain of ${domain}.`)

  // Status modifier
  if (status === 'exalted') lines.push(`Being exalted, ${planet}'s qualities are amplified — results are more pronounced and generally beneficial.`)
  else if (status === 'debilitated') lines.push(`Being debilitated, ${planet} struggles to express its best qualities — classical remedies and effort are recommended.`)
  else if (status === 'own_sign') lines.push(`In its own sign, ${planet} is comfortable and powerful — it gives results freely.`)

  // Retrograde
  if (retrograde) lines.push(`Retrograde ${planet} internalises its energy, revisits past karma, and may act in an unconventional or delayed manner.`)

  // Aspects cast
  if (aspectedHouses.length > 0) {
    lines.push(`It casts its aspect on ${aspHouseText} — influencing those life areas with ${planet}'s significations.`)
  }

  // Aspects received — specific modification per aspecting planet
  if (aspectedBy.length > 0) {
    const effects = aspectedBy.map(asp => {
      const effect = ASPECT_EFFECT[asp]?.[planet]
      return effect ? `${asp}: ${effect}` : `${asp} aspects and modifies ${planet}'s expression.`
    })
    lines.push(`Aspected by: ${effects.join(' | ')}`)
  }

  return lines.join(' ')
}

// ─── Drawer component ─────────────────────────────────────────────────────────
import { useEffect, useRef } from 'react'
import { useLang } from '../contexts/LanguageContext'
import ShlokaCard from './ShlokaCard'

const PLANET_COLORS: Record<string, string> = {
  Sun: '#D97706', Moon: '#0891B2', Mars: '#DC2626', Mercury: '#16A34A',
  Jupiter: '#D97706', Venus: '#7C3AED', Saturn: '#2563EB', Rahu: '#57534E', Ketu: '#A8A29E',
}

export interface PlanetData {
  sign: string; house: number; degree: number; retrograde?: boolean
  status?: string; nakshatra?: string; nakshatra_lord?: string; pada?: number
}

interface Props {
  planet: string | null
  planetData: PlanetData | null
  allPlanets: Record<string, { house: number }>
  onClose: () => void
}

export default function PlanetInterpretationDrawer({ planet, planetData, allPlanets, onClose }: Props) {
  const { t } = useLang()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    if (planet) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [planet, onClose])

  if (!planet || !planetData) return null

  const { sign, house, degree, retrograde = false, status = 'neutral', nakshatra, nakshatra_lord, pada } = planetData
  const aspectedHouses = getAspectedHouses(planet, house)
  const aspectedBy = getPlanetsAspectingHouse(house, allPlanets).filter(p => p !== planet)
  const houseText = PLANET_IN_HOUSE[planet]?.[house - 1] || ''
  const signText = PLANET_IN_SIGN[planet]?.[sign] || ''
  const synthesis = buildSynthesis(planet, sign, house, aspectedHouses, aspectedBy, retrograde, status)
  const color = PLANET_COLORS[planet] || 'var(--accent)'

  const Section = ({ title, text }: { title: string; text: string }) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase',
        letterSpacing: '.08em', marginBottom: '5px' }}>{title}</div>
      <div style={{ fontSize: '13px', lineHeight: '1.65', color: 'var(--text2)' }}>{text}</div>
    </div>
  )

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: '420px',
      background: 'var(--surface)', borderLeft: '1px solid var(--border)',
      boxShadow: '-8px 0 32px rgba(0,0,0,0.15)', zIndex: 200,
      display: 'flex', flexDirection: 'column', overflowY: 'auto',
    }} ref={ref}>

      {/* Header */}
      <div style={{
        padding: '20px 24px', borderBottom: '1px solid var(--border)',
        background: color + '0C', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, display: 'block' }} />
            <h2 style={{ fontSize: '20px', fontWeight: '800', color, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(planet)}</h2>
            {retrograde && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
              background: 'var(--red-bg)', color: 'var(--red)', fontWeight: '600' }}>℞ Retrograde</span>}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
            {sign} · {degree.toFixed(2)}° · <strong style={{ color }}>H{house}</strong>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '3px' }}>
            {nakshatra} Pada {pada} · Lord: {nakshatra_lord}
          </div>
          {status && status !== 'neutral' && (
            <span style={{
              marginTop: '8px', display: 'inline-block', fontSize: '11px', padding: '2px 10px',
              borderRadius: '20px', fontWeight: '600',
              background: status === 'exalted' ? 'var(--green-bg)' : status === 'debilitated' ? 'var(--red-bg)' : 'var(--accent-bg)',
              color: status === 'exalted' ? 'var(--green)' : status === 'debilitated' ? 'var(--red)' : 'var(--accent)',
            }}>{status === 'exalted' ? '↑ Exalted' : status === 'debilitated' ? '↓ Debilitated' : '◈ Own Sign'}</span>
          )}
        </div>
        <button onClick={onClose} style={{
          border: 'none', background: 'transparent', cursor: 'pointer',
          fontSize: '18px', color: 'var(--text3)', padding: '4px',
        }}>✕</button>
      </div>

      {/* Content */}
      <div style={{ padding: '20px 24px', flex: 1 }}>

        {/* Synthesis */}
        <div style={{
          background: color + '08', border: `1px solid ${color}30`,
          borderRadius: '8px', padding: '14px 16px', marginBottom: '20px',
        }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color, textTransform: 'uppercase',
            letterSpacing: '.08em', marginBottom: '6px' }}>{t('Classical Interpretation')}</div>
          <div style={{ fontSize: '13px', lineHeight: '1.7', color: 'var(--text)' }}>{synthesis}</div>
        </div>

        {/* Planet karakatva */}
        <Section title={`${t(planet)} — ${t('Natural Significations')}`} text={t(PLANET_KARAKATVA[planet] || '')} />

        {/* Planet in sign */}
        {signText && <Section title={`${t('In')} ${t(sign)}`} text={t(signText)} />}

        {/* Planet in house */}
        {houseText && <Section title={`${t('In House')} ${house}`} text={t(houseText).replace(/^H\d+\s*—\s*/, '')} />}

        {/* Aspects cast */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase',
            letterSpacing: '.08em', marginBottom: '8px' }}>{t('Aspects Cast By')} <span style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(planet)}</span></div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {aspectedHouses.map(h => (
              <span key={h} style={{
                padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                background: 'var(--accent-bg)', color: 'var(--accent)',
              }}>H{h} — {HOUSE_DOMAIN[h]}</span>
            ))}
          </div>
        </div>

        {/* Aspects received */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase',
            letterSpacing: '.08em', marginBottom: '8px' }}>{t('Planets Aspecting')} <span style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{t(planet)}</span> (H{house})</div>
          {aspectedBy.length > 0 ? (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {aspectedBy.map(p => (
                <span key={p} style={{
                  padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                  background: (PLANET_COLORS[p] || '#666') + '18',
                  color: PLANET_COLORS[p] || 'var(--text)',
                  fontFamily: "'Noto Sans Devanagari', sans-serif",
                }}>{t(p)}</span>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{t('No planets aspect this house')}</span>
          )}
        </div>

        {/* Conjunctions */}
        {(() => {
          const conj = Object.entries(allPlanets)
            .filter(([n, pd]) => n !== planet && pd.house === house)
            .map(([n]) => n)
          return conj.length > 0 ? (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase',
                letterSpacing: '.08em', marginBottom: '8px' }}>{t('Conjunct Planets')}</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {conj.map(p => (
                  <span key={p} style={{
                    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                    background: (PLANET_COLORS[p] || '#666') + '18',
                    color: PLANET_COLORS[p] || 'var(--text)',
                    fontFamily: "'Noto Sans Devanagari', sans-serif",
                  }}>{t(p)}</span>
                ))}
              </div>
            </div>
          ) : null
        })()}

        <ShlokaCard accent={color} topics={['karaka', 'guna']} />

      </div>

      <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border)', flexShrink: 0,
        fontSize: '11px', color: 'var(--text4)', lineHeight: '1.5' }}>
        {t('Sources')}: BPHS, Phaladeepika, Saravali, Jataka Parijata. {t('Classical Parashari tradition.')}</div>
    </div>
  )
}
