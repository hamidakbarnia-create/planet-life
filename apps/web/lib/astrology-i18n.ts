export type AstroLang = 'en' | 'ru' | 'fa' | 'ar';

const PLANETS: Record<string, Record<AstroLang, string>> = {
  Sun: { en: 'Sun', ru: 'Солнце', fa: 'خورشید', ar: 'الشمس' },
  Moon: { en: 'Moon', ru: 'Луна', fa: 'ماه', ar: 'القمر' },
  Mercury: { en: 'Mercury', ru: 'Меркурий', fa: 'عطارد', ar: 'عطارد' },
  Venus: { en: 'Venus', ru: 'Венера', fa: 'زهره', ar: 'الزهرة' },
  Mars: { en: 'Mars', ru: 'Марс', fa: 'مریخ', ar: 'المريخ' },
  Jupiter: { en: 'Jupiter', ru: 'Юпитер', fa: 'مشتری', ar: 'المشتري' },
  Saturn: { en: 'Saturn', ru: 'Сатурн', fa: 'زحل', ar: 'زحل' },
  Uranus: { en: 'Uranus', ru: 'Уран', fa: 'اورانوس', ar: 'أورانوس' },
  Neptune: { en: 'Neptune', ru: 'Нептун', fa: 'نپتون', ar: 'نبتون' },
  Pluto: { en: 'Pluto', ru: 'Плутон', fa: 'پلوتون', ar: 'بلوتو' },
  North_Node: { en: 'North Node', ru: 'Северный узел', fa: 'گره شمالی', ar: 'العقدة الشمالية' },
  Chiron: { en: 'Chiron', ru: 'Хирон', fa: 'کیرون', ar: 'كايرون' },
};

const ASPECTS: Record<string, Record<AstroLang, string>> = {
  conjunction: { en: 'conjunction', ru: 'соединение', fa: 'اقتران', ar: 'اقتران' },
  sextile: { en: 'sextile', ru: 'секстиль', fa: 'سدسی', ar: 'تسديس' },
  square: { en: 'square', ru: 'квадрат', fa: 'تربیع', ar: 'تربيع' },
  trine: { en: 'trine', ru: 'трин', fa: 'تثلیث', ar: 'تثليث' },
  quincunx: { en: 'quincunx', ru: 'квинкункс', fa: 'کوینکانکس', ar: 'كوينكونكس' },
  opposition: { en: 'opposition', ru: 'оппозиция', fa: 'مقابله', ar: 'مقابلة' },
};

const RATINGS: Record<string, Record<AstroLang, string>> = {
  'Highly Favorable': {
    en: 'Highly Favorable',
    ru: 'Очень благоприятно',
    fa: 'بسیار مساعد',
    ar: 'مواتٍ جداً',
  },
  Favorable: { en: 'Favorable', ru: 'Благоприятно', fa: 'مساعد', ar: 'مواتٍ' },
  'Mixed / Proceed with Awareness': {
    en: 'Mixed / Proceed with Awareness',
    ru: 'Смешанно / действуйте осознанно',
    fa: 'مختلط / با آگاهی پیش بروید',
    ar: 'مختلط / تقدم بوعي',
  },
  Challenging: { en: 'Challenging', ru: 'Сложно', fa: 'چالش‌برانگیز', ar: 'صعب' },
  Unfavorable: { en: 'Unfavorable', ru: 'Неблагоприятно', fa: 'نامساعد', ar: 'غير مواتٍ' },
};

const ACTIVITIES: Record<string, Record<AstroLang, string>> = {
  'Business Launch': {
    en: 'Business Launch',
    ru: 'Запуск бизнеса',
    fa: 'راه‌اندازی کسب‌وکار',
    ar: 'إطلاق مشروع',
  },
  Negotiation: { en: 'Negotiation', ru: 'Переговоры', fa: 'مذاکره', ar: 'مفاوضة' },
  Investment: { en: 'Investment', ru: 'Инвестиция', fa: 'سرمایه‌گذاری', ar: 'استثمار' },
  'Contract Signing': {
    en: 'Contract Signing',
    ru: 'Подписание контракта',
    fa: 'امضای قرارداد',
    ar: 'توقيع عقد',
  },
  Hiring: { en: 'Hiring', ru: 'Найм', fa: 'استخدام', ar: 'توظيف' },
  'Real Estate': { en: 'Real Estate', ru: 'Недвижимость', fa: 'املاک', ar: 'عقارات' },
  Travel: { en: 'Travel', ru: 'Путешествие', fa: 'سفر', ar: 'سفر' },
  'Creative Work': {
    en: 'Creative Work',
    ru: 'Творческая работа',
    fa: 'کار خلاقانه',
    ar: 'عمل إبداعي',
  },
  'Rest & Recovery': {
    en: 'Rest & Recovery',
    ru: 'Отдых и восстановление',
    fa: 'استراحت و بازیابی',
    ar: 'راحة وتعافٍ',
  },
  'Networking & PR': {
    en: 'Networking & PR',
    ru: 'Нетворкинг и PR',
    fa: 'شبکه‌سازی و روابط عمومی',
    ar: 'شبكات وعلاقات عامة',
  },
  'Finance Transaction': {
    en: 'Finance Transaction',
    ru: 'Финансовая операция',
    fa: 'تراکنش مالی',
    ar: 'معاملة مالية',
  },
};

const FOCUS: Record<string, Record<AstroLang, string>> = {
  'visibility, momentum, and scalable growth': {
    en: 'visibility, momentum, and scalable growth',
    ru: 'видимость, импульс и масштабируемый рост',
    fa: 'دیده‌شدن، شتاب و رشد مقیاس‌پذیر',
    ar: 'الظهور والزخم والنمو القابل للتوسع',
  },
  'communication, rapport, and mutually beneficial terms': {
    en: 'communication, rapport, and mutually beneficial terms',
    ru: 'коммуникацию, взаимопонимание и взаимовыгодные условия',
    fa: 'ارتباط، اعتماد متقابل و شرایط سودمند',
    ar: 'التواصل والألفة والشروط المتبادلة المنفعة',
  },
  'capital allocation, risk/reward, and long-term yield': {
    en: 'capital allocation, risk/reward, and long-term yield',
    ru: 'распределение капитала, риск/доходность и долгосрочную отдачу',
    fa: 'تخصیص سرمایه، ریسک/بازده و سود بلندمدت',
    ar: 'تخصيص رأس المال والمخاطر/العائد والعائد طويل المدى',
  },
  'clarity of terms, enforceability, and good-faith commitment': {
    en: 'clarity of terms, enforceability, and good-faith commitment',
    ru: 'ясность условий, исполнимость и добросовестные обязательства',
    fa: 'وضوح شرایط، قابلیت اجرا و تعهد حسن‌نیت',
    ar: 'وضوح الشروط وقابلية التنفيذ والالتزام بحسن نية',
  },
  'fit, capability, and team cohesion': {
    en: 'fit, capability, and team cohesion',
    ru: 'соответствие, компетенции и сплочённость команды',
    fa: 'تناسب، توانایی و انسجام تیم',
    ar: 'الملاءمة والقدرة وتماسك الفريق',
  },
  'asset security, valuation, and structural soundness': {
    en: 'asset security, valuation, and structural soundness',
    ru: 'безопасность активов, оценку и структурную надёжность',
    fa: 'امنیت دارایی، ارزیابی و استحکام ساختاری',
    ar: 'أمان الأصول والتقييم والمتانة الهيكلية',
  },
  'logistics, opportunity abroad, and safe passage': {
    en: 'logistics, opportunity abroad, and safe passage',
    ru: 'логистику, возможности за рубежом и безопасный путь',
    fa: 'لجستیک، فرصت‌های خارجی و عبور امن',
    ar: 'اللوجستيات والفرص في الخارج والعبور الآمن',
  },
  'innovation, inspiration, and distinctive output': {
    en: 'innovation, inspiration, and distinctive output',
    ru: 'инновации, вдохновение и уникальный результат',
    fa: 'نوآوری، الهام و خروجی متمایز',
    ar: 'الابتكار والإلهام ومخرجات مميزة',
  },
  'restoration, boundaries, and sustainable pacing': {
    en: 'restoration, boundaries, and sustainable pacing',
    ru: 'восстановление, границы и устойчивый ритм',
    fa: 'بازیابی، مرزها و ریتم پایدار',
    ar: 'التعافي والحدود والإيقاع المستدام',
  },
  'reach, reputation, and strategic alliances': {
    en: 'reach, reputation, and strategic alliances',
    ru: 'охват, репутацию и стратегические альянсы',
    fa: 'دسترسی، شهرت و اتحادهای استراتژیک',
    ar: 'الوصول والسمعة والتحالفات الاستراتيجية',
  },
  'liquidity, timing, and transactional integrity': {
    en: 'liquidity, timing, and transactional integrity',
    ru: 'ликвидность, тайминг и целостность сделки',
    fa: 'نقدینگی، زمان‌بندی و یکپارچگی معامله',
    ar: 'السيولة والتوقيت وسلامة المعاملة',
  },
};

function normalizePlanetKey(name: string): string {
  return name
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('_');
}

export function trPlanet(name: string, lang: AstroLang): string {
  const key = normalizePlanetKey(name);
  return PLANETS[key]?.[lang] ?? name;
}

export function trAspect(name: string, lang: AstroLang): string {
  return ASPECTS[name.toLowerCase()]?.[lang] ?? name;
}

function trFocus(focus: string, lang: AstroLang): string {
  return FOCUS[focus]?.[lang] ?? focus;
}

function trActivityLabel(label: string, lang: AstroLang): string {
  const exact = ACTIVITIES[label]?.[lang];
  if (exact) return exact;
  const lower = label.toLowerCase();
  for (const [key, map] of Object.entries(ACTIVITIES)) {
    if (key.toLowerCase() === lower) return map[lang];
  }
  return label;
}

export function translateRating(rating: string, lang: AstroLang): string {
  if (lang === 'en') return rating;
  return RATINGS[rating]?.[lang] ?? rating;
}

export function translateActivity(activity: string, lang: AstroLang): string {
  if (lang === 'en') return activity;
  return trActivityLabel(activity, lang);
}

/** "Transit Jupiter trine natal Sun (orb 1.2°)" */
export function translateTransitLine(text: string, lang: AstroLang): string {
  if (lang === 'en') return text;
  const m = text.match(
    /^Transit (\w+) (\w+) natal (\w+) \(orb ([\d.]+)°\)$/i
  );
  if (!m) return text;
  const [, transit, aspect, natal, orb] = m;
  const transitTr = trPlanet(transit, lang);
  const natalTr = trPlanet(natal, lang);
  const aspectTr = trAspect(aspect, lang);
  const templates: Record<AstroLang, string> = {
    en: `Transit ${transitTr} ${aspectTr} natal ${natalTr} (orb ${orb}°)`,
    ru: `Транзит ${transitTr} ${aspectTr} к натальному ${natalTr} (орб ${orb}°)`,
    fa: `ترانزیت ${transitTr} ${aspectTr} با تولدی ${natalTr} (اُرب ${orb}°)`,
    ar: `عبور ${transitTr} ${aspectTr} مع الميلادي ${natalTr} (مدار ${orb}°)`,
  };
  return templates[lang];
}

const THEME_FIXED: Record<string, Record<AstroLang, string>> = {
  'Supportive transits to natal rulers of this activity.': {
    en: 'Supportive transits to natal rulers of this activity.',
    ru: 'Поддерживающие транзиты к натальным управителям этой активности.',
    fa: 'ترانزیت‌های حمایتی نسبت به حاکمان تولدی این فعالیت.',
    ar: 'عبورات داعمة لحكام الميلاد لهذا النشاط.',
  },
  'Hard aspects suggest resistance, delays, or rework.': {
    en: 'Hard aspects suggest resistance, delays, or rework.',
    ru: 'Жёсткие аспекты указывают на сопротивление, задержки или переработку.',
    fa: 'جنبه‌های سخت نشان‌دهنده مقاومت، تأخیر یا بازنگری هستند.',
    ar: 'الجوانب الصعبة تشير إلى مقاومة أو تأخير أو إعادة عمل.',
  },
  'Overall sky favors initiative over hesitation.': {
    en: 'Overall sky favors initiative over hesitation.',
    ru: 'Небо в целом благоприятствует инициативе, а не промедлению.',
    fa: 'آسمان به‌طور کلی ابتکار را بر تردید ترجیح می‌دهد.',
    ar: 'السماء عموماً تفضل المبادرة على التردد.',
  },
  'Consolidate and plan; avoid overextension.': {
    en: 'Consolidate and plan; avoid overextension.',
    ru: 'Консолидируйтесь и планируйте; избегайте перенапряжения.',
    fa: 'تثبیت کنید و برنامه‌ریزی کنید؛ از کشش بیش از حد اجتناب کنید.',
    ar: 'وطّد وخطط؛ تجنب الإفراط في التمدد.',
  },
};

export function translateThemeLine(text: string, lang: AstroLang): string {
  if (lang === 'en') return text;
  if (THEME_FIXED[text]) return THEME_FIXED[text][lang];
  const focusMatch = text.match(/^Strategic focus: (.+)$/);
  if (focusMatch) {
    const focus = trFocus(focusMatch[1], lang);
    const prefixes: Record<AstroLang, string> = {
      en: 'Strategic focus',
      ru: 'Стратегический фокус',
      fa: 'تمرکز استراتژیک',
      ar: 'التركيز الاستراتيجي',
    };
    return `${prefixes[lang]}: ${focus}`;
  }
  return text;
}

export function translateTimingNote(text: string, lang: AstroLang): string {
  if (lang === 'en') return text;
  const retroMatch = text.match(
    /^Primary rulers retrograde: (.+) — review, revise, or delay\.$/
  );
  if (retroMatch) {
    const planets = retroMatch[1].split(', ').map((p) => trPlanet(p, lang)).join(', ');
    const templates: Record<AstroLang, string> = {
      en: text,
      ru: `Основные управители в ретрограде: ${planets} — пересмотрите, исправьте или отложите.`,
      fa: `حاکمان اصلی رتروگراد: ${planets} — بازبینی، اصلاح یا تأخیر.`,
      ar: `الحكام الأساسيون راجعون: ${planets} — راجع أو عدّل أو أجل.`,
    };
    return templates[lang];
  }
  const fixed: Record<string, Record<AstroLang, string>> = {
    'Retrograde load reduces forward momentum; double-check communications and contracts.': {
      en: 'Retrograde load reduces forward momentum; double-check communications and contracts.',
      ru: 'Ретроградная нагрузка снижает импульс; перепроверьте коммуникации и контракты.',
      fa: 'بار رتروگراد شتاب را کم می‌کند؛ ارتباطات و قراردادها را دوباره بررسی کنید.',
      ar: 'عبء الرجوع يقلل الزخم؛ تحقق مرة أخرى من التواصل والعقود.',
    },
    'No major retrograde friction on primary rulers; standard due diligence applies.': {
      en: 'No major retrograde friction on primary rulers; standard due diligence applies.',
      ru: 'Нет серьёзного ретроградного трения у основных управителей; применяется стандартная осмотрительность.',
      fa: 'اصطکاک رتروگراد عمده‌ای روی حاکمان اصلی نیست؛ دقت استاندارد کافی است.',
      ar: 'لا احتكاك رجعي كبير على الحكام الأساسيين؛ تنطبق العناية الواجبة المعتادة.',
    },
  };
  return fixed[text]?.[lang] ?? text;
}

export function translateRecommendation(text: string, lang: AstroLang): string {
  if (lang === 'en') return text;

  const patterns: Array<{
    re: RegExp;
    build: (m: RegExpMatchArray, lang: AstroLang) => string;
  }> = [
    {
      re: /^Strong window for (.+): transits support (.+)\. Move decisively while monitoring details\.$/,
      build: (m, l) => {
        const act = trActivityLabel(m[1], l);
        const focus = trFocus(m[2], l);
        return {
          en: `Strong window for ${act}: transits support ${focus}. Move decisively while monitoring details.`,
          ru: `Сильное окно для ${act}: транзиты поддерживают ${focus}. Действуйте решительно, следя за деталями.`,
          fa: `پنجره قوی برای ${act}: ترانزیت‌ها از ${focus} حمایت می‌کنند. با اطمینان پیش بروید و جزئیات را رصد کنید.`,
          ar: `نافذة قوية لـ${act}: العبورات تدعم ${focus}. تحرك بحزم مع مراقبة التفاصيل.`,
        }[l] ?? m[0] ?? '';
      },
    },
    {
      re: /^Good conditions for (.+)\. Favor core priorities around (.+); keep contingency plans light\.$/,
      build: (m, l) => {
        const act = trActivityLabel(m[1], l);
        const focus = trFocus(m[2], l);
        const translated = {
          en: `Good conditions for ${act}. Favor core priorities around ${focus}; keep contingency plans light.`,
          ru: `Хорошие условия для ${act}. Отдайте приоритет ${focus}; держите резервные планы простыми.`,
          fa: `شرایط خوب برای ${act}. اولویت را به ${focus} بدهید؛ برنامه‌های اضطراری را سبک نگه دارید.`,
          ar: `ظروف جيدة لـ${act}. أعطِ الأولوية لـ${focus}؛ اجعل خطط الطوارئ بسيطة.`,
        }[l];
        return translated ?? m[0] ?? '';
      },
    },
    {
      re: /^Neutral-to-mixed timing\. Viable for (.+) if (.+) is well-prepared; avoid unnecessary risk\.$/,
      build: (m, l) => {
        const act = trActivityLabel(m[1], l);
        const focus = trFocus(m[2], l);
        const translated = {
          en: `Neutral-to-mixed timing. Viable for ${act} if ${focus} is well-prepared; avoid unnecessary risk.`,
          ru: `Нейтральное или смешанное время. Подходит для ${act}, если ${focus} хорошо подготовлены; избегайте лишнего риска.`,
          fa: `زمان‌بندی خنثی تا مختلط. برای ${act} مناسب است اگر ${focus} خوب آماده باشد؛ از ریسک غیرضروری اجتناب کنید.`,
          ar: `توقيت محايد إلى مختلط. مجدٍ لـ${act} إذا كان ${focus} جيد الإعداد؛ تجنب المخاطر غير الضرورية.`,
        }[l];
        return translated ?? m[0] ?? '';
      },
    },
    {
      re: /^Friction in the sky\. Delay or restructure (.+) unless urgent; shore up (.+) before committing\.$/,
      build: (m, l) => {
        const act = trActivityLabel(m[1], l);
        const focus = trFocus(m[2], l);
        const translated = {
          en: `Friction in the sky. Delay or restructure ${act} unless urgent; shore up ${focus} before committing.`,
          ru: `Трение в небесах. Отложите или пересмотрите ${act}, если это не срочно; укрепите ${focus} перед обязательствами.`,
          fa: `اصطکاک در آسمان. ${act} را به تعویق بیندازید یا بازسازی کنید مگر فوری باشد؛ قبل از تعهد ${focus} را تقویت کنید.`,
          ar: `احتكاك في السماء. أجل أو أعد هيكلة ${act} ما لم يكن عاجلاً؛ عزز ${focus} قبل الالتزام.`,
        }[l];
        return translated ?? m[0] ?? '';
      },
    },
    {
      re: /^Poor strategic timing for (.+)\. Defer major moves; focus on research and stabilization instead of (.+)\.$/,
      build: (m, l) => {
        const act = trActivityLabel(m[1], l);
        const focus = trFocus(m[2], l);
        const translated = {
          en: `Poor strategic timing for ${act}. Defer major moves; focus on research and stabilization instead of ${focus}.`,
          ru: `Слабое стратегическое время для ${act}. Отложите крупные шаги; сосредоточьтесь на исследовании и стабилизации вместо ${focus}.`,
          fa: `زمان‌بندی استراتژیک ضعیف برای ${act}. حرکت‌های بزرگ را به تعویق بیندازید؛ به جای ${focus} روی تحقیق و تثبیت تمرکز کنید.`,
          ar: `توقيت استراتيجي ضعيف لـ${act}. أجل الخطوات الكبرى؛ ركز على البحث والاستقرار بدلاً من ${focus}.`,
        }[l];
        return translated ?? m[0] ?? '';
      },
    },
  ];

  for (const { re, build } of patterns) {
    const m = text.match(re);
    if (m) return build(m, lang);
  }
  return text;
}

export function translateStringList(
  items: string[],
  lang: AstroLang,
  kind: 'transit' | 'theme' | 'timing'
): string[] {
  const fn =
    kind === 'transit'
      ? translateTransitLine
      : kind === 'theme'
        ? translateThemeLine
        : translateTimingNote;
  return items.map((item) => fn(item, lang));
}

import type { ScoreBreakdown } from './score-breakdown';

export interface AnalysisPayload {
  executive: {
    score: number;
    rating: string;
    activity: string;
    recommendation: string;
    summary?: string;
  };
  strategic: {
    opportunity_factors?: string[];
    risk_factors?: string[];
    key_themes?: string[];
    timing_notes?: string[];
  };
  /** Normalized score decomposition — populated by analyze API adapter. */
  scoreBreakdown?: ScoreBreakdown | null;
}

export function translateAnalysis(
  data: AnalysisPayload,
  lang: AstroLang
): AnalysisPayload {
  if (lang === 'en') return data;

  const ex = { ...data.executive };
  ex.rating = translateRating(ex.rating, lang);
  ex.activity = translateActivity(ex.activity, lang);
  ex.recommendation = translateRecommendation(ex.recommendation, lang);

  const st = { ...data.strategic };
  if (st.opportunity_factors?.length) {
    st.opportunity_factors = translateStringList(
      st.opportunity_factors,
      lang,
      'transit'
    );
  }
  if (st.risk_factors?.length) {
    st.risk_factors = translateStringList(st.risk_factors, lang, 'transit');
  }
  if (st.key_themes?.length) {
    st.key_themes = translateStringList(st.key_themes, lang, 'theme');
  }
  if (st.timing_notes?.length) {
    st.timing_notes = translateStringList(st.timing_notes, lang, 'timing');
  }

  return { executive: ex, strategic: st, scoreBreakdown: data.scoreBreakdown };
}
