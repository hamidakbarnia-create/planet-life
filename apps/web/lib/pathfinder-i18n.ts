import type { AppLang, CalendarSystem } from './app-settings';
import type { PathfinderEffect, PathfinderReason } from './pathfinder-api';

// Localized planet + angle names so the Pathfinder body text (not just the
// section titles) renders fully translated. Reason sentences are composed from
// structured tokens returned by the backend (code + planet + angle), keeping
// English prose out of the API payload.
//
// NOTE: RU / FA / AR strings below should be reviewed by Julia for tone and
// astrological wording; the structure is correct but phrasing is a first pass.

const PLANET_NAMES: Record<AppLang, Record<string, string>> = {
  en: {
    sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
    jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune',
    pluto: 'Pluto', north_node: 'North Node',
  },
  ru: {
    sun: 'Солнце', moon: 'Луна', mercury: 'Меркурий', venus: 'Венера', mars: 'Марс',
    jupiter: 'Юпитер', saturn: 'Сатурн', uranus: 'Уран', neptune: 'Нептун',
    pluto: 'Плутон', north_node: 'Северный узел',
  },
  fa: {
    sun: 'خورشید', moon: 'ماه', mercury: 'عطارد', venus: 'زهره', mars: 'مریخ',
    jupiter: 'مشتری', saturn: 'زحل', uranus: 'اورانوس', neptune: 'نپتون',
    pluto: 'پلوتو', north_node: 'رأس گره شمالی',
  },
  ar: {
    sun: 'الشمس', moon: 'القمر', mercury: 'عطارد', venus: 'الزهرة', mars: 'المريخ',
    jupiter: 'المشتري', saturn: 'زحل', uranus: 'أورانوس', neptune: 'نبتون',
    pluto: 'بلوتو', north_node: 'العقدة الشمالية',
  },
};

const ANGLE_NAMES: Record<AppLang, Record<string, string>> = {
  en: { AC: 'Ascendant', DC: 'Descendant', MC: 'Midheaven', IC: 'Imum Coeli' },
  ru: { AC: 'Асцендент', DC: 'Десцендент', MC: 'Середина неба', IC: 'Надир' },
  fa: { AC: 'طالع', DC: 'نقطه غروب', MC: 'اوج آسمان', IC: 'عمق آسمان' },
  ar: { AC: 'الطالع', DC: 'الغارب', MC: 'وسط السماء', IC: 'وتد الأرض' },
};

// Reason templates use {p} = planet name and {a} = angle name.
const REASON_TEMPLATES: Record<AppLang, Record<string, string>> = {
  en: {
    love_partner_support: '{p} on your {a} supports partnership and emotional opening.',
    love_intense: '{p} on your {a} intensifies relationship dynamics.',
    career_drive: '{p} on your {a} activates visibility, ambition, and public results.',
    career_unconventional: '{p} on your {a} brings an unconventional career direction.',
    home_supportive: '{p} on your {a} makes the city feel emotionally supportive.',
    home_intense: '{p} on your {a} can make home life feel intense or demanding.',
    wellbeing_vitality: '{p} on your {a} supports vitality and ease in the body.',
    wellbeing_pressure: '{p} on your {a} adds pressure to your energy and pacing.',
    spirituality_open: '{p} on your {a} opens intuition, meaning, and inner guidance.',
    community_people: '{p} on your {a} helps you meet useful or inspiring people.',
    wealth_support: '{p} on your {a} improves business, assets, or financial reliability.',
    wealth_boundaries: '{p} on your {a} calls for cleaner money boundaries.',
    love_house7: '{p} in your relocated 7th house supports partnership.',
    career_house10: '{p} in your relocated 10th house strengthens career focus.',
    wealth_money_houses: '{p} in your relocated money houses highlights resources.',
    home_house4: '{p} in your relocated 4th house supports roots and home.',
    wellbeing_house: '{p} in your relocated health houses supports daily wellbeing.',
    community_house11: '{p} in your relocated 11th house opens your network.',
    spirituality_house12: '{p} in your relocated 12th house deepens inner work.',
    sig_support: '{p} is well placed in your relocated house {n}, lifting this area in this city.',
    sig_quiet: '{p} sits in your relocated house {n}, so this area leans on your own initiative here.',
    sig_strain: '{p} in your relocated house {n} adds some friction to this area in this city.',
  },
  ru: {
    love_partner_support: '{p} на вашем {a} поддерживает партнёрство и эмоциональную открытость.',
    love_intense: '{p} на вашем {a} усиливает напряжение в отношениях.',
    career_drive: '{p} на вашем {a} активирует видимость, амбиции и публичные результаты.',
    career_unconventional: '{p} на вашем {a} даёт нестандартное направление в карьере.',
    home_supportive: '{p} на вашем {a} делает город эмоционально поддерживающим.',
    home_intense: '{p} на вашем {a} может сделать домашнюю жизнь напряжённой.',
    wellbeing_vitality: '{p} на вашем {a} поддерживает жизненный тонус и лёгкость в теле.',
    wellbeing_pressure: '{p} на вашем {a} добавляет нагрузку на энергию и ритм.',
    spirituality_open: '{p} на вашем {a} открывает интуицию и внутреннее руководство.',
    community_people: '{p} на вашем {a} помогает встречать полезных и вдохновляющих людей.',
    wealth_support: '{p} на вашем {a} улучшает бизнес, активы и финансовую надёжность.',
    wealth_boundaries: '{p} на вашем {a} требует более чётких границ в деньгах.',
    love_house7: '{p} в релокационном 7-м доме поддерживает партнёрство.',
    career_house10: '{p} в релокационном 10-м доме усиливает фокус на карьере.',
    wealth_money_houses: '{p} в денежных домах релокационной карты усиливает тему финансов и ресурсов.',
    home_house4: '{p} в релокационном 4-м доме поддерживает корни и дом.',
    wellbeing_house: '{p} в релокационных домах здоровья поддерживает самочувствие.',
    community_house11: '{p} в релокационном 11-м доме раскрывает вашу сеть контактов.',
    spirituality_house12: '{p} в релокационном 12-м доме углубляет внутреннюю работу.',
    sig_support: '{p} удачно расположен в релокационном доме {n}, усиливая эту сферу в этом городе.',
    sig_quiet: '{p} находится в релокационном доме {n}, поэтому здесь эта сфера больше зависит от ваших усилий.',
    sig_strain: '{p} в релокационном доме {n} добавляет напряжения этой сфере в этом городе.',
  },
  fa: {
    love_partner_support: '{p} روی {a} تو از رابطه و گشودگی عاطفی حمایت می‌کند.',
    love_intense: '{p} روی {a} تو پویایی رابطه را شدیدتر می‌کند.',
    career_drive: '{p} روی {a} تو دیده‌شدن، جاه‌طلبی و نتایج عمومی را فعال می‌کند.',
    career_unconventional: '{p} روی {a} تو مسیر شغلی غیرمتعارفی می‌آورد.',
    home_supportive: '{p} روی {a} تو حس می‌دهد که این شهر از نظر عاطفی حمایت‌گر است.',
    home_intense: '{p} روی {a} تو می‌تواند زندگی خانگی را پرفشار کند.',
    wellbeing_vitality: '{p} روی {a} تو از نشاط و آرامش بدن حمایت می‌کند.',
    wellbeing_pressure: '{p} روی {a} تو فشار بیشتری به انرژی و ریتم تو می‌آورد.',
    spirituality_open: '{p} روی {a} تو شهود، معنا و راهنمایی درونی را باز می‌کند.',
    community_people: '{p} روی {a} تو کمک می‌کند با آدم‌های مفید یا الهام‌بخش آشنا شوی.',
    wealth_support: '{p} روی {a} تو کسب‌وکار، دارایی یا اعتبار مالی را بهتر می‌کند.',
    wealth_boundaries: '{p} روی {a} تو نیاز به مرزهای مالی شفاف‌تر را نشان می‌دهد.',
    love_house7: '{p} در خانه هفتم جابه‌جا‌شده‌ات از رابطه حمایت می‌کند.',
    career_house10: '{p} در خانه دهم جابه‌جا‌شده‌ات تمرکز شغلی را تقویت می‌کند.',
    wealth_money_houses: '{p} در خانه‌های مالی جابه‌جا‌شده‌ات منابع را برجسته می‌کند.',
    home_house4: '{p} در خانه چهارم جابه‌جا‌شده‌ات از ریشه و خانه حمایت می‌کند.',
    wellbeing_house: '{p} در خانه‌های سلامتی جابه‌جا‌شده‌ات از حال خوب روزانه حمایت می‌کند.',
    community_house11: '{p} در خانه یازدهم جابه‌جا‌شده‌ات شبکه ارتباطی تو را باز می‌کند.',
    spirituality_house12: '{p} در خانه دوازدهم جابه‌جا‌شده‌ات کار درونی را عمیق‌تر می‌کند.',
    sig_support: '{p} در خانه {n} جابه‌جا‌شده‌ات خوب نشسته و این حوزه را در این شهر تقویت می‌کند.',
    sig_quiet: '{p} در خانه {n} جابه‌جا‌شده‌ات است، پس این حوزه اینجا بیشتر به تلاش خودت بستگی دارد.',
    sig_strain: '{p} در خانه {n} جابه‌جا‌شده‌ات کمی فشار به این حوزه در این شهر می‌آورد.',
  },
  ar: {
    love_partner_support: '{p} على {a} يدعم الشراكة والانفتاح العاطفي.',
    love_intense: '{p} على {a} يكثّف ديناميكيات العلاقة.',
    career_drive: '{p} على {a} ينشّط الظهور والطموح والنتائج العامة.',
    career_unconventional: '{p} على {a} يجلب اتجاهاً مهنياً غير تقليدي.',
    home_supportive: '{p} على {a} يجعل المدينة داعمة عاطفياً.',
    home_intense: '{p} على {a} قد يجعل حياة البيت مكثّفة أو متطلّبة.',
    wellbeing_vitality: '{p} على {a} يدعم الحيوية وراحة الجسد.',
    wellbeing_pressure: '{p} على {a} يضيف ضغطاً على طاقتك وإيقاعك.',
    spirituality_open: '{p} على {a} يفتح الحدس والمعنى والإرشاد الداخلي.',
    community_people: '{p} على {a} يساعدك على لقاء أشخاص مفيدين أو مُلهمين.',
    wealth_support: '{p} على {a} يحسّن العمل والأصول والموثوقية المالية.',
    wealth_boundaries: '{p} على {a} يستدعي حدوداً مالية أوضح.',
    love_house7: '{p} في بيتك السابع المنقول يدعم الشراكة.',
    career_house10: '{p} في بيتك العاشر المنقول يقوّي التركيز المهني.',
    wealth_money_houses: '{p} في بيوت المال المنقولة يبرز الموارد.',
    home_house4: '{p} في بيتك الرابع المنقول يدعم الجذور والبيت.',
    wellbeing_house: '{p} في بيوت الصحة المنقولة يدعم العافية اليومية.',
    community_house11: '{p} في بيتك الحادي عشر المنقول يفتح شبكتك.',
    spirituality_house12: '{p} في بيتك الثاني عشر المنقول يعمّق العمل الداخلي.',
    sig_support: '{p} في موضع جيد في بيتك المنقول {n}، ما يقوّي هذا المجال في هذه المدينة.',
    sig_quiet: '{p} في بيتك المنقول {n}، لذا يعتمد هذا المجال هنا على مبادرتك الشخصية أكثر.',
    sig_strain: '{p} في بيتك المنقول {n} يضيف بعض الضغط على هذا المجال في هذه المدينة.',
  },
};

type VerdictLead = { positive: string; challenging: string; mixed: string; neutral: string };

// {area} = localized area name.
const VERDICT_LEADS: Record<AppLang, VerdictLead> = {
  en: {
    positive: '{area} is supported in this location.',
    challenging: '{area} needs more care in this location.',
    mixed: '{area} is mixed in this location.',
    neutral: '{area} is neutral here. This city does not strongly pull your chart toward this area.',
  },
  ru: {
    positive: '{area}: эта локация вас поддерживает.',
    challenging: '{area}: здесь нужно больше внимания.',
    mixed: '{area}: здесь эффект неоднозначный.',
    neutral: '{area}: эта сфера в данном городе выражена слабо, поэтому результат больше зависит от времени и ваших решений.',
  },
  fa: {
    positive: '{area} در این مکان حمایت می‌شود.',
    challenging: '{area} در این مکان به مراقبت بیشتری نیاز دارد.',
    mixed: '{area} در این مکان ترکیبی است.',
    neutral: '{area} اینجا خنثی است. این شهر چارت تو را به‌شدت به این حوزه نمی‌کشد.',
  },
  ar: {
    positive: '{area} مدعومة في هذا الموقع.',
    challenging: '{area} تحتاج إلى عناية أكبر في هذا الموقع.',
    mixed: '{area} مختلطة في هذا الموقع.',
    neutral: '{area} محايدة هنا. هذه المدينة لا تجذب خريطتك بقوة نحو هذا المجال.',
  },
};

const PERIOD_LABELS: Record<AppLang, { favorable: string; balanced: string; challenging: string }> = {
  en: { favorable: 'Favorable', balanced: 'Balanced', challenging: 'Challenging' },
  ru: { favorable: 'Благоприятно', balanced: 'Сбалансированно', challenging: 'Сложно' },
  fa: { favorable: 'مساعد', balanced: 'متعادل', challenging: 'چالش‌برانگیز' },
  ar: { favorable: 'مواتٍ', balanced: 'متوازن', challenging: 'صعب' },
};

const DATE_LOCALES: Record<AppLang, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  fa: 'fa-IR',
  ar: 'ar',
};

// Maps our calendar choice to a BCP-47 calendar extension. Gregorian is the
// shared default; Shamsi = Persian (Solar Hijri); Ghamari = Umm al-Qura Hijri.
const CALENDAR_EXT: Record<CalendarSystem, string> = {
  gregorian: 'gregory',
  shamsi: 'persian',
  hijri: 'islamic-umalqura',
};

function planetName(lang: AppLang, planet: string): string {
  return PLANET_NAMES[lang][planet] ?? PLANET_NAMES.en[planet] ?? planet;
}

function angleName(lang: AppLang, angle: string | null): string {
  if (!angle) return '';
  return ANGLE_NAMES[lang][angle] ?? ANGLE_NAMES.en[angle] ?? angle;
}

function localizeNumber(lang: AppLang, n: number): string {
  try {
    return new Intl.NumberFormat(DATE_LOCALES[lang] ?? DATE_LOCALES.en, {
      useGrouping: false,
    }).format(n);
  } catch {
    return String(n);
  }
}

export function composeReason(lang: AppLang, reason: PathfinderReason): string {
  const tpl = REASON_TEMPLATES[lang][reason.code] ?? REASON_TEMPLATES.en[reason.code];
  if (!tpl) return '';
  return tpl
    .replace('{p}', planetName(lang, reason.planet))
    .replace('{a}', angleName(lang, reason.angle))
    .replace('{n}', reason.house != null ? localizeNumber(lang, reason.house) : '');
}

export function composeEffectLead(lang: AppLang, effect: PathfinderEffect, areaLabel: string): string {
  const leads = VERDICT_LEADS[lang];
  if (!effect.reasons || effect.reasons.length === 0) {
    return leads.neutral.replace('{area}', areaLabel);
  }
  return (leads[effect.verdict] ?? leads.mixed).replace('{area}', areaLabel);
}

export function composeReasons(lang: AppLang, effect: PathfinderEffect): string[] {
  return (effect.reasons ?? [])
    .map((r) => composeReason(lang, r))
    .filter((s): s is string => Boolean(s))
    .slice(0, 3);
}

export function composeEffectSummary(lang: AppLang, effect: PathfinderEffect, areaLabel: string): string {
  const lead = composeEffectLead(lang, effect, areaLabel);
  const reasons = composeReasons(lang, effect);
  return reasons.length ? `${lead} ${reasons[0]}` : lead;
}

export function periodLabel(lang: AppLang, score: number): string {
  const l = PERIOD_LABELS[lang] ?? PERIOD_LABELS.en;
  if (score >= 65) return l.favorable;
  if (score <= 42) return l.challenging;
  return l.balanced;
}

export function formatPathfinderDate(
  lang: AppLang,
  isoDate: string,
  calendar: CalendarSystem = 'gregorian'
): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  const date = new Date(Date.UTC(year, month - 1, day));
  const baseLocale = DATE_LOCALES[lang] ?? DATE_LOCALES.en;
  const locale = `${baseLocale}-u-ca-${CALENDAR_EXT[calendar] ?? CALENDAR_EXT.gregorian}`;
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatPathfinderDateRange(
  lang: AppLang,
  start: string,
  end: string,
  calendar: CalendarSystem = 'gregorian'
): string {
  return `${formatPathfinderDate(lang, start, calendar)} - ${formatPathfinderDate(lang, end, calendar)}`;
}

export function pathfinderPlanetName(lang: AppLang, planet: string): string {
  return planetName(lang, planet);
}

export function pathfinderAngleName(lang: AppLang, angle: string | null): string {
  return angleName(lang, angle);
}
