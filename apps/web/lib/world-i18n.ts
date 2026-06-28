import type { AppLang } from './app-settings';
import type { SkySignal } from './world-api';

// Localized composition for the mundane-sky overlay. The backend sends tokens
// (planets, aspect, sign, topic) and the frontend builds the sentence so RU/FA/
// AR read natively instead of getting English prose.

const PLANET: Record<AppLang, Record<string, string>> = {
  en: { sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto' },
  ru: { sun: 'Солнце', moon: 'Луна', mercury: 'Меркурий', venus: 'Венера', mars: 'Марс', jupiter: 'Юпитер', saturn: 'Сатурн', uranus: 'Уран', neptune: 'Нептун', pluto: 'Плутон' },
  fa: { sun: 'خورشید', moon: 'ماه', mercury: 'عطارد', venus: 'زهره', mars: 'مریخ', jupiter: 'مشتری', saturn: 'زحل', uranus: 'اورانوس', neptune: 'نپتون', pluto: 'پلوتو' },
  ar: { sun: 'الشمس', moon: 'القمر', mercury: 'عطارد', venus: 'الزهرة', mars: 'المريخ', jupiter: 'المشتري', saturn: 'زحل', uranus: 'أورانوس', neptune: 'نبتون', pluto: 'بلوتو' },
};

// Names for the four chart angles (used by the per-city local-sky read).
const ANGLE_NAME: Record<AppLang, Record<string, string>> = {
  en: { AC: 'Ascendant', DC: 'Descendant', MC: 'Midheaven', IC: 'Nadir' },
  ru: { AC: 'Асцендент', DC: 'Десцендент', MC: 'Середину неба', IC: 'Надир' },
  fa: { AC: 'طالع', DC: 'غارب', MC: 'اوج آسمان', IC: 'ته آسمان' },
  ar: { AC: 'الطالع', DC: 'الغارب', MC: 'وسط السماء', IC: 'وتد الأرض' },
};

// Qualifiers so figure reads say "transiting X to natal Y" instead of a flat aspect.
const TRANSIT_WORD: Record<AppLang, string> = { en: 'transiting', ru: 'транзитный', fa: 'گذرِ', ar: 'عبور' };
const NATAL_WORD: Record<AppLang, string> = { en: 'natal', ru: 'натальной', fa: 'زادروزی', ar: 'المولدي' };
const ON_WORD: Record<AppLang, string> = { en: 'on the', ru: 'на', fa: 'روی', ar: 'على' };

const ASPECT: Record<AppLang, Record<string, string>> = {
  en: { conjunction: 'conjunct', sextile: 'sextile', square: 'square', trine: 'trine', opposition: 'opposite' },
  ru: { conjunction: 'соединение', sextile: 'секстиль', square: 'квадрат', trine: 'тригон', opposition: 'оппозиция' },
  fa: { conjunction: 'مقارنه با', sextile: 'تسدیس با', square: 'تربیع با', trine: 'تثلیث با', opposition: 'مقابله با' },
  ar: { conjunction: 'مقارنة', sextile: 'تسديس', square: 'تربيع', trine: 'تثليث', opposition: 'مقابلة' },
};

const SIGN: Record<AppLang, Record<string, string>> = {
  en: { Aries: 'Aries', Taurus: 'Taurus', Gemini: 'Gemini', Cancer: 'Cancer', Leo: 'Leo', Virgo: 'Virgo', Libra: 'Libra', Scorpio: 'Scorpio', Sagittarius: 'Sagittarius', Capricorn: 'Capricorn', Aquarius: 'Aquarius', Pisces: 'Pisces' },
  ru: { Aries: 'Овне', Taurus: 'Тельце', Gemini: 'Близнецах', Cancer: 'Раке', Leo: 'Льве', Virgo: 'Деве', Libra: 'Весах', Scorpio: 'Скорпионе', Sagittarius: 'Стрельце', Capricorn: 'Козероге', Aquarius: 'Водолее', Pisces: 'Рыбах' },
  fa: { Aries: 'حمل', Taurus: 'ثور', Gemini: 'جوزا', Cancer: 'سرطان', Leo: 'اسد', Virgo: 'سنبله', Libra: 'میزان', Scorpio: 'عقرب', Sagittarius: 'قوس', Capricorn: 'جدی', Aquarius: 'دلو', Pisces: 'حوت' },
  ar: { Aries: 'الحمل', Taurus: 'الثور', Gemini: 'الجوزاء', Cancer: 'السرطان', Leo: 'الأسد', Virgo: 'العذراء', Libra: 'الميزان', Scorpio: 'العقرب', Sagittarius: 'القوس', Capricorn: 'الجدي', Aquarius: 'الدلو', Pisces: 'الحوت' },
};

const TOPIC: Record<AppLang, Record<string, string>> = {
  en: {
    economic_cycle: 'expansion-vs-contraction cycle in the economy',
    tech_breakout: 'breakout energy in tech, growth and crypto',
    structural_change: 'pressure to restructure markets and institutions',
    old_vs_new_order: 'tension between the old order and a new one',
    oil_volatility: 'sharp moves in oil and commodities',
    power_struggle: 'escalation and power struggle',
    sudden_shock: 'risk of sudden market shocks',
    sudden_strike: 'risk of sudden strikes or flashpoints',
    military_pressure: 'military pressure and hard conflict',
    regime_power: 'confrontation over power and regimes',
    debt_pressure: 'pressure on debt, banks and resources',
    power_focus: 'intense focus on power and control',
    currency_luxury: 'movement in currencies and luxury assets',
    speculation: 'speculation, hype and unclear pricing',
    power_restructure: 'long restructuring of power and institutions',
    supply_shock: 'disruption to supply, energy and tech',
    hard_limits: 'hard limits, austerity and accountability',
    discipline_tests: 'tests of discipline, limits and responsibility',
    growth_luck: 'growth, opportunity and good fortune',
    power_transformation: 'deep transformation and shifts of power',
    disruption_change: 'sudden change, breakthroughs and surprises',
    vision_or_fog: 'inspiration or confusion, blurred boundaries',
    drive_conflict: 'drive, heat and the risk of conflict',
    home_sentiment: 'mood and sentiment around home and property',
  },
  ru: {
    economic_cycle: 'цикл расширения и сжатия в экономике',
    tech_breakout: 'прорывная энергия в технологиях, росте и крипте',
    structural_change: 'давление на перестройку рынков и институтов',
    old_vs_new_order: 'напряжение между старым и новым порядком',
    oil_volatility: 'резкие движения в нефти и сырье',
    power_struggle: 'эскалация и борьба за власть',
    sudden_shock: 'риск внезапных рыночных шоков',
    sudden_strike: 'риск внезапных ударов и горячих точек',
    military_pressure: 'военное давление и жёсткий конфликт',
    regime_power: 'противостояние из-за власти и режимов',
    debt_pressure: 'давление на долги, банки и ресурсы',
    power_focus: 'острый фокус на власти и контроле',
    currency_luxury: 'движение валют и люксовых активов',
    speculation: 'спекуляции, ажиотаж и туман в ценах',
    power_restructure: 'долгая перестройка власти и институтов',
    supply_shock: 'сбои в поставках, энергетике и технологиях',
    hard_limits: 'жёсткие лимиты, экономия и спрос с ответственных',
    discipline_tests: 'проверки дисциплины, границ и ответственности',
    growth_luck: 'рост, возможности и удача',
    power_transformation: 'глубокая трансформация и сдвиги власти',
    disruption_change: 'внезапные перемены, прорывы и сюрпризы',
    vision_or_fog: 'вдохновение или туман, размытые границы',
    drive_conflict: 'энергия, накал и риск конфликта',
    home_sentiment: 'настроение вокруг дома и недвижимости',
  },
  fa: {
    economic_cycle: 'چرخه رونق و رکود در اقتصاد',
    tech_breakout: 'انرژی جهش در فناوری، رشد و کریپتو',
    structural_change: 'فشار برای بازآرایی بازارها و نهادها',
    old_vs_new_order: 'تنش میان نظم کهنه و نظم نو',
    oil_volatility: 'نوسان شدید نفت و کالاها',
    power_struggle: 'تشدید و کشمکش قدرت',
    sudden_shock: 'خطر شوک‌های ناگهانی بازار',
    sudden_strike: 'خطر حملات ناگهانی و نقاط بحرانی',
    military_pressure: 'فشار نظامی و درگیری سخت',
    regime_power: 'رویارویی بر سر قدرت و حکومت‌ها',
    debt_pressure: 'فشار بر بدهی، بانک‌ها و منابع',
    power_focus: 'تمرکز شدید بر قدرت و کنترل',
    currency_luxury: 'حرکت ارزها و دارایی‌های لوکس',
    speculation: 'سفته‌بازی، هیجان و قیمت‌گذاری مبهم',
    power_restructure: 'بازسازی بنیادین و طولانی‌مدتِ قدرت و ساختارها',
    supply_shock: 'اختلال در زنجیرهٔ تأمین، انرژی و فناوری',
    hard_limits: 'مرزهای سخت‌گیرانه، ریاضت و مسئولیت‌پذیری',
    discipline_tests: 'آزمونِ نظم، محدودیت و مسئولیت‌پذیری',
    growth_luck: 'رشد، فرصت و بختِ خوب',
    power_transformation: 'دگرگونی عمیق و جابه‌جایی قدرت',
    disruption_change: 'تغییر ناگهانی، جهش و غافلگیری',
    vision_or_fog: 'الهام یا ابهام و مرزهای محو',
    drive_conflict: 'انرژی، تنش و خطر درگیری',
    home_sentiment: 'حال‌وهوای پیرامون خانه و ملک',
  },
  ar: {
    economic_cycle: 'دورة توسّع وانكماش في الاقتصاد',
    tech_breakout: 'طاقة اختراق في التقنية والنمو والعملات الرقمية',
    structural_change: 'ضغط لإعادة هيكلة الأسواق والمؤسسات',
    old_vs_new_order: 'توتر بين النظام القديم ونظام جديد',
    oil_volatility: 'تحركات حادّة في النفط والسلع',
    power_struggle: 'تصعيد وصراع على السلطة',
    sudden_shock: 'خطر صدمات سوقية مفاجئة',
    sudden_strike: 'خطر ضربات مفاجئة وبؤر توتر',
    military_pressure: 'ضغط عسكري وصراع حادّ',
    regime_power: 'مواجهة على السلطة والأنظمة',
    debt_pressure: 'ضغط على الديون والبنوك والموارد',
    power_focus: 'تركيز حادّ على السلطة والسيطرة',
    currency_luxury: 'حركة في العملات والأصول الفاخرة',
    speculation: 'مضاربة وضجيج وتسعير غامض',
    power_restructure: 'إعادة هيكلة طويلة للسلطة والمؤسسات',
    supply_shock: 'اضطراب في الإمداد والطاقة والتقنية',
    hard_limits: 'حدود صارمة وتقشّف ومساءلة',
    discipline_tests: 'اختبارات للانضباط والحدود والمسؤولية',
    growth_luck: 'نمو وفرص وحظ جيد',
    power_transformation: 'تحوّل عميق وتبدّلات في السلطة',
    disruption_change: 'تغيّر مفاجئ واختراقات ومفاجآت',
    vision_or_fog: 'إلهام أو ضباب وحدود غير واضحة',
    drive_conflict: 'اندفاع وحرارة وخطر صراع',
    home_sentiment: 'مزاج حول المنزل والعقار',
  },
};

const IN_WORD: Record<AppLang, string> = { en: 'in', ru: 'в', fa: 'در', ar: 'في' };

// What each aspect "does" — used to build the deeper explanation in detail view.
const ASPECT_MEANING: Record<AppLang, Record<string, string>> = {
  en: {
    conjunction: 'fuses these forces into one intense theme',
    sextile: 'opens an easy, supportive channel between them',
    square: 'creates friction and pressure that forces action',
    trine: 'lets their energy flow smoothly and constructively',
    opposition: 'pulls them into tension and open confrontation',
  },
  ru: {
    conjunction: 'сливает эти силы в одну напряжённую тему',
    sextile: 'открывает лёгкий, поддерживающий канал между ними',
    square: 'создаёт трение и давление, толкающее к действию',
    trine: 'даёт их энергии течь плавно и конструктивно',
    opposition: 'разводит их в напряжение и открытое противостояние',
  },
  fa: {
    conjunction: 'این نیروها را در یک تم شدید یکی می‌کند',
    sextile: 'کانالی آسان و حمایتی میانشان باز می‌کند',
    square: 'اصطکاک و فشاری می‌سازد که به کنش وادار می‌کند',
    trine: 'انرژی‌شان را روان و سازنده جاری می‌کند',
    opposition: 'آن‌ها را به تنش و رویارویی آشکار می‌کشد',
  },
  ar: {
    conjunction: 'يدمج هذه القوى في موضوع واحد مكثّف',
    sextile: 'يفتح قناة سهلة وداعمة بينها',
    square: 'يخلق احتكاكاً وضغطاً يدفع إلى الفعل',
    trine: 'يجعل طاقتها تتدفّق بسلاسة وبشكل بنّاء',
    opposition: 'يجرّها إلى توتر ومواجهة مفتوحة',
  },
};

const TONE_FRAMING: Record<AppLang, Record<string, string>> = {
  en: {
    tension: 'Expect a pressured, volatile phase:',
    supportive: 'This favours steady, constructive movement:',
    context: 'A slow backdrop colours the whole period:',
  },
  ru: {
    tension: 'Ждите напряжённую, волатильную фазу:',
    supportive: 'Это благоприятствует устойчивому, конструктивному движению:',
    context: 'Медленный, долгосрочный фон влияет на весь период:',
  },
  fa: {
    tension: 'منتظر دوره‌ای پرفشار و پرنوسان باش:',
    supportive: 'این به حرکت پایدار و سازنده کمک می‌کند:',
    context: 'یک روند کند و بلندمدت بر کل این دوره اثر می‌گذارد:',
  },
  ar: {
    tension: 'توقّع مرحلة ضاغطة ومتقلّبة:',
    supportive: 'هذا يرجّح حركة ثابتة وبنّاءة:',
    context: 'خلفية بطيئة وطويلة الأمد تؤثّر في الفترة كلها:',
  },
};

const STRENGTH_LABEL: Record<AppLang, { exact: string; tight: string; wide: string; orb: string; retro: string }> = {
  en: { exact: 'Exact now', tight: 'Tight', wide: 'Forming', orb: 'orb', retro: 'retrograde' },
  ru: { exact: 'Точный сейчас', tight: 'Тесный', wide: 'Формируется', orb: 'орбис', retro: 'ретроград' },
  fa: { exact: 'دقیق همین حالا', tight: 'تنگ', wide: 'در حال شکل‌گیری', orb: 'اوربیس', retro: 'رجعی' },
  ar: { exact: 'دقيق الآن', tight: 'ضيّق', wide: 'يتشكّل', orb: 'أورب', retro: 'رجعي' },
};

export function strengthFromOrb(lang: AppLang, orb: number | undefined): string {
  const s = STRENGTH_LABEL[lang] ?? STRENGTH_LABEL.en;
  if (orb == null) return '';
  if (orb <= 1) return s.exact;
  if (orb <= 2.5) return s.tight;
  return s.wide;
}

export function orbText(lang: AppLang, orb: number | undefined): string {
  if (orb == null) return '';
  const s = STRENGTH_LABEL[lang] ?? STRENGTH_LABEL.en;
  return `${s.orb} ${orb}°`;
}

// The fuller explanation shown in the expanded section view.
export function skySignalDetail(lang: AppLang, signal: SkySignal): string {
  const { conclusion, basis } = skySignalParts(lang, signal);
  const framing = (TONE_FRAMING[lang] ?? TONE_FRAMING.en)[signal.tone] ?? '';
  if (signal.kind === 'aspect' && signal.aspect) {
    const meaning = (ASPECT_MEANING[lang] ?? ASPECT_MEANING.en)[signal.aspect] ?? '';
    return `${basis} ${meaning}. ${framing} ${conclusion}.`;
  }
  const retro = signal.retrograde ? ` (${(STRENGTH_LABEL[lang] ?? STRENGTH_LABEL.en).retro})` : '';
  return `${basis}${retro}. ${framing} ${conclusion}.`;
}

// The astrological CONCLUSION (the topic phrase) is the product; the planetary
// "basis" is the small evidence caption underneath. We are not a news site —
// the read is the hero, the chart aspect is the proof.
export function skySignalParts(lang: AppLang, signal: SkySignal): { conclusion: string; basis: string } {
  const planets = PLANET[lang] ?? PLANET.en;
  const topics = TOPIC[lang] ?? TOPIC.en;
  const conclusion = topics[signal.topic] ?? TOPIC.en[signal.topic] ?? signal.topic;

  if (signal.kind === 'aspect' && signal.p1 && signal.p2 && signal.aspect) {
    const asp = (ASPECT[lang] ?? ASPECT.en)[signal.aspect] ?? signal.aspect;
    const p1 = planets[signal.p1] ?? signal.p1;
    const p2 = planets[signal.p2] ?? signal.p2;
    // Figure reads are transit-to-natal: spell that out so it's clearly personal.
    if (signal.theme === 'figures') {
      const t = TRANSIT_WORD[lang] ?? TRANSIT_WORD.en;
      const n = NATAL_WORD[lang] ?? NATAL_WORD.en;
      return { conclusion, basis: `${t} ${p1} ${asp} ${n} ${p2}` };
    }
    return { conclusion, basis: `${p1} ${asp} ${p2}` };
  }
  if (signal.kind === 'placement' && signal.planet && signal.sign) {
    const p = planets[signal.planet] ?? signal.planet;
    const sign = (SIGN[lang] ?? SIGN.en)[signal.sign] ?? signal.sign;
    return { conclusion, basis: `${p} ${IN_WORD[lang] ?? 'in'} ${sign}` };
  }
  if (signal.kind === 'angular' && signal.planet && signal.angle) {
    const p = planets[signal.planet] ?? signal.planet;
    const angle = (ANGLE_NAME[lang] ?? ANGLE_NAME.en)[signal.angle] ?? signal.angle;
    return { conclusion, basis: `${p} ${ON_WORD[lang] ?? 'on the'} ${angle}` };
  }
  return { conclusion, basis: '' };
}

export function composeSkySignal(lang: AppLang, signal: SkySignal): string {
  const { conclusion, basis } = skySignalParts(lang, signal);
  return basis ? `${conclusion} · ${basis}` : conclusion;
}

export function toneColor(tone: string): string {
  if (tone === 'tension') return '#fca5a5';
  if (tone === 'supportive') return '#86efac';
  return 'rgba(255,255,255,0.5)';
}
