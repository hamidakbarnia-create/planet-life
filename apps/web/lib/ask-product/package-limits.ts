/**
 * Presentation-layer semantic localization for Decision Package
 * `explainability.limits` bodies.
 *
 * Maps exact canonical English strings emitted by shipped production runtimes
 * (timing_opt_semantics / visibility_semantics). Does not machine-translate
 * arbitrary engine prose and does not use substring replacement.
 *
 * Matching is strict trim-only: leading/trailing whitespace is ignored;
 * internal whitespace must match the canonical key exactly.
 */

import type { AppLang } from '@/lib/app-settings';

type LimitLocales = Record<AppLang, string>;

/**
 * Exact canonical → locale copy. Keys must match production emitters
 * character-for-character after trim (no internal whitespace collapsing).
 */
const CANONICAL_PACKAGE_LIMITS: Record<string, LimitLocales> = {
  // bus-product-launch FIND — ProductLaunchTimingOptFindSemantics
  'Relative symbolic launch-day timing only — not business or market intelligence.':
    {
      en: 'Relative symbolic launch-day timing only — not business or market intelligence.',
      fa: 'تنها زمان‌بندی نمادین روز لانچ — نه هوش تجاری یا بازاری.',
      ar: 'توقيت رمزي نسبي ليوم الإطلاق فقط — وليس ذكاء أعمال أو سوق.',
      ru: 'Только относительный символический тайминг дня запуска — не бизнес- или рыночная аналитика.',
    },
  'Does not predict launch success, revenue, adoption, Product Hunt rank, market demand, PR performance, or team readiness.':
    {
      en: 'Does not predict launch success, revenue, adoption, Product Hunt rank, market demand, PR performance, or team readiness.',
      fa: 'موفقیت لانچ، درآمد، پذیرش، رتبه Product Hunt، تقاضای بازار، عملکرد روابط‌عمومی یا آمادگی تیم را پیش‌بینی نمی‌کند.',
      ar: 'لا يتنبأ بنجاح الإطلاق أو الإيرادات أو التبني أو ترتيب Product Hunt أو طلب السوق أو أداء العلاقات العامة أو جاهزية الفريق.',
      ru: 'Не прогнозирует успех запуска, выручку, принятие, рейтинг Product Hunt, спрос, PR или готовность команды.',
    },
  'launch_object, launch_channel, and brand_or_company did not affect scores.':
    {
      en: 'launch_object, launch_channel, and brand_or_company did not affect scores.',
      fa: 'نوع محصول، کانال انتشار و برند یا شرکت بر امتیازها اثر نگذاشتند.',
      ar: 'نوع المنتج وقناة الإطلاق والعلامة التجارية أو الشركة لم تؤثر على الدرجات.',
      ru: 'Тип продукта, канал запуска и бренд или компания не влияли на оценки.',
    },
  'Hourly clock-time windows were not computed.': {
    en: 'Hourly clock-time windows were not computed.',
    fa: 'پنجره‌های ساعتی محاسبه نشدند.',
    ar: 'لم تُحسب نوافذ التوقيت بالساعة.',
    ru: 'Почасовые окна не вычислялись.',
  },
  'Avoid windows were not computed as a primary product.': {
    en: 'Avoid windows were not computed as a primary product.',
    fa: 'پنجره‌های اجتناب به‌عنوان محصول اصلی محاسبه نشدند.',
    ar: 'لم تُحسب نوافذ التجنب كمنتج أساسي.',
    ru: 'Окна избегания не вычислялись как основной продукт.',
  },
  'Tiny score gaps within the tie threshold do not create a unique winner.': {
    en: 'Tiny score gaps within the tie threshold do not create a unique winner.',
    fa: 'اختلاف‌های جزئی امتیاز درون آستانه تساوی برنده یکتا نمی‌سازند.',
    ar: 'الفجوات الطفيفة ضمن عتبة التعادل لا تنشئ فائزًا فريدًا.',
    ru: 'Небольшие разрывы в пределах порога ничьей не создают единственного победителя.',
  },
  'Results are relative within the selected range only.': {
    en: 'Results are relative within the selected range only.',
    fa: 'نتایج فقط نسبت به بازهٔ انتخاب‌شده نسبی‌اند.',
    ar: 'النتائج نسبية ضمن النطاق المحدد فقط.',
    ru: 'Результаты относительны только внутри выбранного диапазона.',
  },
  'Launch-day timing scan only — not market fit, revenue, or readiness.': {
    en: 'Launch-day timing scan only — not market fit, revenue, or readiness.',
    fa: 'فقط پایش زمان‌بندی روز لانچ — نه تناسب بازار، درآمد یا آمادگی.',
    ar: 'مسح توقيت يوم الإطلاق فقط — وليس ملاءمة السوق أو الإيرادات أو الجاهزية.',
    ru: 'Только сканирование тайминга дня запуска — не market fit, выручка или готовность.',
  },
  'No windows were generated because natal evidence was unavailable.': {
    en: 'No windows were generated because natal evidence was unavailable.',
    fa: 'چون شواهد تولد در دسترس نبود، پنجره‌ای تولید نشد.',
    ar: 'لم تُنشأ نوافذ لأن أدلة الميلاد غير متاحة.',
    ru: 'Окна не сформированы: натальные данные недоступны.',
  },

  // bus-product-launch EVALUATE — ProductLaunchTimingOptSemantics
  'This is launch-day timing evidence only, not business or market intelligence.':
    {
      en: 'This is launch-day timing evidence only, not business or market intelligence.',
      fa: 'این فقط شواهد زمان‌بندی روز لانچ است، نه هوش تجاری یا بازاری.',
      ar: 'هذا دليل توقيت يوم الإطلاق فقط، وليس ذكاء أعمال أو سوق.',
      ru: 'Это только доказательство тайминга дня запуска, не бизнес- или рыночная аналитика.',
    },
  'It does not assess market fit, revenue, demand, fundraising, or viability.': {
    en: 'It does not assess market fit, revenue, demand, fundraising, or viability.',
    fa: 'تناسب بازار، درآمد، تقاضا، جذب سرمایه یا دوام‌پذیری را ارزیابی نمی‌کند.',
    ar: 'لا يقيّم ملاءمة السوق أو الإيرادات أو الطلب أو جمع التمويل أو الجدوى.',
    ru: 'Не оценивает market fit, выручку, спрос, фандрайзинг или жизнеспособность.',
  },
  'launch_object, launch_channel, and brand_or_company did not affect the numeric score.':
    {
      en: 'launch_object, launch_channel, and brand_or_company did not affect the numeric score.',
      fa: 'نوع محصول، کانال انتشار و برند یا شرکت بر امتیاز عددی اثر نگذاشتند.',
      ar: 'نوع المنتج وقناة الإطلاق والعلامة التجارية أو الشركة لم تؤثر على الدرجة الرقمية.',
      ru: 'Тип продукта, канал запуска и бренд или компания не влияли на числовую оценку.',
    },
  'Birth location and launch location are distinct concepts.': {
    en: 'Birth location and launch location are distinct concepts.',
    fa: 'محل تولد و محل لانچ مفاهیم متمایزند.',
    ar: 'موقع الميلاد وموقع الإطلاق مفهومان متمايزان.',
    ru: 'Место рождения и место запуска — разные понятия.',
  },
  'Best clock-time window was not computed (date-level evidence only).': {
    en: 'Best clock-time window was not computed (date-level evidence only).',
    fa: 'بهترین پنجرهٔ ساعتی محاسبه نشد (فقط شواهد سطح تاریخ).',
    ar: 'لم تُحسب أفضل نافذة زمنية بالساعة (أدلة على مستوى التاريخ فقط).',
    ru: 'Лучшее часовое окно не вычислялось (только дневные доказательства).',
  },
  'Avoid windows were not computed.': {
    en: 'Avoid windows were not computed.',
    fa: 'پنجره‌های اجتناب محاسبه نشدند.',
    ar: 'لم تُحسب نوافذ التجنب.',
    ru: 'Окна избегания не вычислялись.',
  },
  'Alternative dates were not searched in EVALUATE; use FIND for range scan.': {
    en: 'Alternative dates were not searched in EVALUATE; use FIND for range scan.',
    fa: 'در EVALUATE تاریخ‌های جایگزین جستجو نشدند؛ برای پایش بازه از FIND استفاده کنید.',
    ar: 'لم تُبحث تواريخ بديلة في EVALUATE؛ استخدم FIND لمسح النطاق.',
    ru: 'В EVALUATE альтернативные даты не искались; для скана диапазона используйте FIND.',
  },
  'COMPARE mode is not implemented for this Decision Type in this release.': {
    en: 'COMPARE mode is not implemented for this Decision Type in this release.',
    fa: 'حالت COMPARE برای این نوع تصمیم در این نسخه پیاده‌سازی نشده است.',
    ar: 'وضع COMPARE غير منفّذ لهذا النوع من القرار في هذا الإصدار.',
    ru: 'Режим COMPARE для этого типа решения в этом релизе не реализован.',
  },

  // Shared EVALUATE insufficient / wedding+launch+interview
  'Package v1 requires a timing candidate even when timing is non-material.': {
    en: 'Package v1 requires a timing candidate even when timing is non-material.',
    fa: 'Package v1 حتی وقتی زمان‌بندی غیرمادی است به یک نامزد زمانی نیاز دارد.',
    ar: 'يتطلب Package v1 مرشح توقيت حتى عندما يكون التوقيت غير جوهري.',
    ru: 'Package v1 требует кандидата по таймингу даже при нематериальном тайминге.',
  },
  'No clock-time window, avoid window, or alternative search was performed.': {
    en: 'No clock-time window, avoid window, or alternative search was performed.',
    fa: 'هیچ پنجرهٔ ساعتی، پنجرهٔ اجتناب یا جستجوی جایگزین انجام نشد.',
    ar: 'لم يُنفَّذ نافذة زمنية بالساعة أو نافذة تجنب أو بحث بديل.',
    ru: 'Часовое окно, окно избегания или поиск альтернатив не выполнялись.',
  },

  // mar-wedding-date EVALUATE
  'This is ceremony-day union timing evidence, not full wedding intelligence.': {
    en: 'This is ceremony-day union timing evidence, not full wedding intelligence.',
    fa: 'این شواهد زمان‌بندی اتحاد در روز مراسم است، نه هوش کامل عروسی.',
    ar: 'هذا دليل توقيت الاتحاد في يوم الحفل، وليس ذكاء زفاف كاملًا.',
    ru: 'Это доказательство тайминга союза в день церемонии, не полная аналитика свадьбы.',
  },
  'ceremony_type, partner_name, and venue did not affect the numeric score.': {
    en: 'ceremony_type, partner_name, and venue did not affect the numeric score.',
    fa: 'نوع مراسم، نام شریک و محل برگزاری بر امتیاز عددی اثر نگذاشتند.',
    ar: 'نوع الحفل واسم الشريك ومكان الحفل لم تؤثر على الدرجة الرقمية.',
    ru: 'Тип церемонии, имя партнёра и площадка не влияли на числовую оценку.',
  },
  'Birth location and ceremony location are distinct concepts.': {
    en: 'Birth location and ceremony location are distinct concepts.',
    fa: 'محل تولد و محل مراسم مفاهیم متمایزند.',
    ar: 'موقع الميلاد وموقع الحفل مفهومان متمايزان.',
    ru: 'Место рождения и место церемонии — разные понятия.',
  },
  'Alternative dates were not searched.': {
    en: 'Alternative dates were not searched.',
    fa: 'تاریخ‌های جایگزین جستجو نشدند.',
    ar: 'لم تُبحث تواريخ بديلة.',
    ru: 'Альтернативные даты не искались.',
  },
  'This EVALUATE package assesses one date only; use COMPARE to rank candidates.':
    {
      en: 'This EVALUATE package assesses one date only; use COMPARE to rank candidates.',
      fa: 'این بستهٔ EVALUATE فقط یک تاریخ را می‌سنجد؛ برای رتبه‌بندی نامزدها از COMPARE استفاده کنید.',
      ar: 'تقيّم حزمة EVALUATE تاريخًا واحدًا فقط؛ استخدم COMPARE لترتيب المرشحين.',
      ru: 'Этот пакет EVALUATE оценивает одну дату; для ранжирования используйте COMPARE.',
    },

  // mar-wedding-date COMPARE
  'Ceremony timing comparison only — not relationship quality or wedding success.':
    {
      en: 'Ceremony timing comparison only — not relationship quality or wedding success.',
      fa: 'فقط مقایسهٔ زمان‌بندی مراسم — نه کیفیت رابطه یا موفقیت عروسی.',
      ar: 'مقارنة توقيت الحفل فقط — وليست جودة العلاقة أو نجاح الزفاف.',
      ru: 'Только сравнение тайминга церемонии — не качество отношений или успех свадьбы.',
    },
  'No clock-time window, avoid window, or FIND search was performed.': {
    en: 'No clock-time window, avoid window, or FIND search was performed.',
    fa: 'هیچ پنجرهٔ ساعتی، پنجرهٔ اجتناب یا جستجوی FIND انجام نشد.',
    ar: 'لم يُنفَّذ نافذة زمنية بالساعة أو نافذة تجنب أو بحث FIND.',
    ru: 'Часовое окно, окно избегания или поиск FIND не выполнялись.',
  },
  'Ceremony timing comparison only — not relationship quality, wedding success, legal advice, venue quality, budget success, or guaranteed outcome.':
    {
      en: 'Ceremony timing comparison only — not relationship quality, wedding success, legal advice, venue quality, budget success, or guaranteed outcome.',
      fa: 'فقط مقایسهٔ زمان‌بندی مراسم — نه کیفیت رابطه، موفقیت عروسی، مشاوره حقوقی، کیفیت محل، موفقیت بودجه یا نتیجهٔ تضمینی.',
      ar: 'مقارنة توقيت الحفل فقط — وليست جودة العلاقة أو نجاح الزفاف أو استشارة قانونية أو جودة المكان أو نجاح الميزانية أو نتيجة مضمونة.',
      ru: 'Только сравнение тайминга церемонии — не качество отношений, успех свадьбы, юрсовет, площадка, бюджет или гарантия исхода.',
    },
  'ceremony_type, partner_name, and venue did not affect the numeric scores.': {
    en: 'ceremony_type, partner_name, and venue did not affect the numeric scores.',
    fa: 'نوع مراسم، نام شریک و محل برگزاری بر امتیازهای عددی اثر نگذاشتند.',
    ar: 'نوع الحفل واسم الشريك ومكان الحفل لم تؤثر على الدرجات الرقمية.',
    ru: 'Тип церемонии, имя партнёра и площадка не влияли на числовые оценки.',
  },
  'Best clock-time windows were not computed (date-level evidence only).': {
    en: 'Best clock-time windows were not computed (date-level evidence only).',
    fa: 'بهترین پنجره‌های ساعتی محاسبه نشدند (فقط شواهد سطح تاریخ).',
    ar: 'لم تُحسب أفضل نوافذ زمنية بالساعة (أدلة على مستوى التاريخ فقط).',
    ru: 'Лучшие часовые окна не вычислялись (только дневные доказательства).',
  },
  'FIND / Window / Scan are not part of this comparison.': {
    en: 'FIND / Window / Scan are not part of this comparison.',
    fa: 'FIND / Window / Scan بخشی از این مقایسه نیستند.',
    ar: 'FIND / Window / Scan ليست جزءًا من هذه المقارنة.',
    ru: 'FIND / Window / Scan не входят в это сравнение.',
  },

  // car-interview EVALUATE
  'This is negotiation/communication timing evidence, not full interview intelligence.':
    {
      en: 'This is negotiation/communication timing evidence, not full interview intelligence.',
      fa: 'این شواهد زمان‌بندی مذاکره/ارتباط است، نه هوش کامل مصاحبه.',
      ar: 'هذا دليل توقيت التفاوض/التواصل، وليس ذكاء مقابلة كاملًا.',
      ru: 'Это доказательство тайминга переговоров/коммуникации, не полная аналитика интервью.',
    },
  'role, company, and interview_type did not affect the numeric score.': {
    en: 'role, company, and interview_type did not affect the numeric score.',
    fa: 'نقش شغلی، شرکت و نوع مصاحبه بر امتیاز عددی اثر نگذاشتند.',
    ar: 'الدور الوظيفي والشركة ونوع المقابلة لم تؤثر على الدرجة الرقمية.',
    ru: 'Роль, компания и тип интервью не влияли на числовую оценку.',
  },
  'Birth location and interview/event location are distinct; birth was not treated as interview city in Case evidence.':
    {
      en: 'Birth location and interview/event location are distinct; birth was not treated as interview city in Case evidence.',
      fa: 'محل تولد و محل مصاحبه/رویداد متمایزند؛ تولد به‌عنوان شهر مصاحبه در شواهد پرونده تلقی نشد.',
      ar: 'موقع الميلاد وموقع المقابلة/الحدث متمايزان؛ لم يُعامل الميلاد كمدينة مقابلة في أدلة الحالة.',
      ru: 'Место рождения и место интервью/события различны; рождение не считалось городом интервью в доказательствах кейса.',
    },

  // car-interview COMPARE
  'Interview-date communication timing comparison only — not hiring outcome or job offer.':
    {
      en: 'Interview-date communication timing comparison only — not hiring outcome or job offer.',
      fa: 'فقط مقایسهٔ زمان‌بندی ارتباط در تاریخ مصاحبه — نه نتیجهٔ استخدام یا پیشنهاد شغلی.',
      ar: 'مقارنة توقيت التواصل لتاريخ المقابلة فقط — وليست نتيجة توظيف أو عرض عمل.',
      ru: 'Только сравнение тайминга коммуникации на дату интервью — не исход найма или оффер.',
    },
  'Interview-date communication/visibility timing comparison only — not hiring outcome, job offer, salary, interview performance certainty, employer decision, or career success.':
    {
      en: 'Interview-date communication/visibility timing comparison only — not hiring outcome, job offer, salary, interview performance certainty, employer decision, or career success.',
      fa: 'فقط مقایسهٔ زمان‌بندی ارتباط/دیده‌شدن در تاریخ مصاحبه — نه نتیجهٔ استخدام، پیشنهاد شغلی، حقوق، قطعیت عملکرد مصاحبه، تصمیم کارفرما یا موفقیت شغلی.',
      ar: 'مقارنة توقيت التواصل/الظهور لتاريخ المقابلة فقط — وليست نتيجة توظيف أو عرض عمل أو راتب أو يقين أداء المقابلة أو قرار صاحب العمل أو نجاح مهني.',
      ru: 'Только сравнение тайминга коммуникации/видимости на дату интервью — не исход найма, оффер, зарплата, уверенность в результате интервью, решение работодателя или карьерный успех.',
    },
  'role, company, and interview_type did not affect the numeric scores.': {
    en: 'role, company, and interview_type did not affect the numeric scores.',
    fa: 'نقش شغلی، شرکت و نوع مصاحبه بر امتیازهای عددی اثر نگذاشتند.',
    ar: 'الدور الوظيفي والشركة ونوع المقابلة لم تؤثر على الدرجات الرقمية.',
    ru: 'Роль, компания и тип интервью не влияли на числовые оценки.',
  },

  // car-interview FIND — CarInterviewVisibilityFindSemantics
  'Interview-date communication/visibility timing scan only — not hiring outcome, job offer, salary, interview performance certainty, employer decision, or career success.':
    {
      en: 'Interview-date communication/visibility timing scan only — not hiring outcome, job offer, salary, interview performance certainty, employer decision, or career success.',
      fa: 'فقط پایش زمان‌بندی ارتباط/دیده‌شدن در بازهٔ مصاحبه — نه نتیجهٔ استخدام، پیشنهاد شغلی، حقوق، قطعیت عملکرد مصاحبه، تصمیم کارفرما یا موفقیت شغلی.',
      ar: 'مسح توقيت التواصل/الظهور لفترة المقابلة فقط — وليست نتيجة توظيف أو عرض عمل أو راتب أو يقين أداء المقابلة أو قرار صاحب العمل أو نجاح مهني.',
      ru: 'Только сканирование тайминга коммуникации/видимости для интервью — не исход найма, оффер, зарплата, уверенность в результате интервью, решение работодателя или карьерный успех.',
    },
  'Interview-date communication/visibility timing scan only — not hiring outcome or job offer.':
    {
      en: 'Interview-date communication/visibility timing scan only — not hiring outcome or job offer.',
      fa: 'فقط پایش زمان‌بندی ارتباط/دیده‌شدن در بازهٔ مصاحبه — نه نتیجهٔ استخدام یا پیشنهاد شغلی.',
      ar: 'مسح توقيت التواصل/الظهور لفترة المقابلة فقط — وليست نتيجة توظيف أو عرض عمل.',
      ru: 'Только сканирование тайминга коммуникации/видимости для интервью — не исход найма или оффер.',
    },
  'Role, company, and interview type did not affect the numeric scores.': {
    en: 'Role, company, and interview type did not affect the numeric scores.',
    fa: 'نقش شغلی، شرکت و نوع مصاحبه بر امتیازهای عددی اثر نگذاشتند.',
    ar: 'الدور الوظيفي والشركة ونوع المقابلة لم تؤثر على الدرجات الرقمية.',
    ru: 'Роль, компания и тип интервью не влияли на числовые оценки.',
  },

  // bus-investor-meeting EVALUATE
  'This is negotiation/communication timing evidence, not investment-outcome prediction.':
    {
      en: 'This is negotiation/communication timing evidence, not investment-outcome prediction.',
      fa: 'این شواهد زمان‌بندی مذاکره/ارتباط است، نه پیش‌بینی نتیجهٔ سرمایه‌گذاری.',
      ar: 'هذا دليل توقيت التفاوض/التواصل، وليس تنبؤًا بنتيجة استثمار.',
      ru: 'Это доказательство тайминга переговоров/коммуникации, не прогноз инвестиционного исхода.',
    },
  'No best clock-time window was computed.': {
    en: 'No best clock-time window was computed.',
    fa: 'بهترین پنجرهٔ ساعتی محاسبه نشد.',
    ar: 'لم تُحسب أفضل نافذة زمنية بالساعة.',
    ru: 'Лучшее часовое окно не вычислялось.',
  },
  'No clock-time window was computed.': {
    en: 'No clock-time window was computed.',
    fa: 'پنجرهٔ ساعتی محاسبه نشد.',
    ar: 'لم تُحسب نافذة زمنية بالساعة.',
    ru: 'Часовое окно не вычислялось.',
  },
  'No alternative dates were searched.': {
    en: 'No alternative dates were searched.',
    fa: 'تاریخ‌های جایگزین جستجو نشدند.',
    ar: 'لم تُبحث تواريخ بديلة.',
    ru: 'Альтернативные даты не искались.',
  },

  // bus-investor-meeting COMPARE
  'Investor-meeting communication/negotiation timing comparison only — not investment outcome or funding success.':
    {
      en: 'Investor-meeting communication/negotiation timing comparison only — not investment outcome or funding success.',
      fa: 'فقط مقایسهٔ زمان‌بندی ارتباط/مذاکره برای جلسه با سرمایه‌گذار — نه نتیجهٔ سرمایه‌گذاری یا موفقیت جذب سرمایه.',
      ar: 'مقارنة توقيت التواصل/التفاوض لاجتماع المستثمر فقط — وليست نتيجة استثمار أو نجاح تمويل.',
      ru: 'Только сравнение тайминга коммуникации/переговоров для встречи с инвестором — не исход инвестиции или успех привлечения капитала.',
    },
  'Investor-meeting communication/negotiation timing comparison only — not investment outcome, funding success, investor commitment, term sheet probability, amount raised, valuation, investor interest certainty, pitch performance certainty, business success, market demand, financial return, or fundraising success.':
    {
      en: 'Investor-meeting communication/negotiation timing comparison only — not investment outcome, funding success, investor commitment, term sheet probability, amount raised, valuation, investor interest certainty, pitch performance certainty, business success, market demand, financial return, or fundraising success.',
      fa: 'فقط مقایسهٔ زمان‌بندی ارتباط/مذاکره برای جلسه با سرمایه‌گذار — نه نتیجهٔ سرمایه‌گذاری، موفقیت جذب سرمایه، تعهد سرمایه‌گذار، احتمال ترم‌شیت، مبلغ جذب‌شده، ارزش‌گذاری، قطعیت علاقهٔ سرمایه‌گذار، قطعیت عملکرد پیچ، موفقیت کسب‌وکار، تقاضای بازار، بازده مالی یا موفقیت جذب سرمایه.',
      ar: 'مقارنة توقيت التواصل/التفاوض لاجتماع المستثمر فقط — وليست نتيجة استثمار أو نجاح تمويل أو التزام مستثمر أو احتمال ورقة شروط أو مبلغ مجمّع أو تقييم أو يقين اهتمام المستثمر أو يقين أداء العرض أو نجاح الأعمال أو طلب السوق أو عائد مالي أو نجاح جمع التمويل.',
      ru: 'Только сравнение тайминга коммуникации/переговоров для встречи с инвестором — не исход инвестиции, успех финансирования, обязательство инвестора, вероятность term sheet, сумма раунда, оценка, уверенность в интересе инвестора, уверенность в питче, успех бизнеса, спрос рынка, финансовая доходность или успех фандрайзинга.',
    },
  'meeting_goal, investor_name, and meeting_type did not affect the numeric scores.':
    {
      en: 'meeting_goal, investor_name, and meeting_type did not affect the numeric scores.',
      fa: 'هدف جلسه، نام سرمایه‌گذار و نوع جلسه بر امتیازهای عددی اثر نگذاشتند.',
      ar: 'هدف الاجتماع واسم المستثمر ونوع الاجتماع لم تؤثر على الدرجات الرقمية.',
      ru: 'Цель встречи, имя инвестора и тип встречи не влияли на числовые оценки.',
    },
};

/** True when `text` is an exact known canonical package limit (trim-only). */
export function isCanonicalPackageLimit(text: string): boolean {
  return text.trim() in CANONICAL_PACKAGE_LIMITS;
}

/**
 * Localize one package limit body.
 * - Known canonical (exact match after trim) → locale copy
 * - Unknown + EN → original English (honest passthrough)
 * - Unknown + FA/AR/RU → `null` (omit; do not pretend it was localized)
 */
export function localizePackageLimit(
  lang: AppLang,
  text: string
): string | null {
  const key = text.trim();
  if (!key) return null;
  const mapped = CANONICAL_PACKAGE_LIMITS[key];
  if (mapped) return mapped[lang] ?? mapped.en;
  if (lang === 'en') return key;
  return null;
}

/**
 * Localize and cap package limit lists for Result presentation.
 * Drops unrecognized bodies for non-EN locales (same honesty pattern as
 * ask-product free-form English omission).
 */
export function localizePackageLimits(
  lang: AppLang,
  limits: readonly string[],
  max: number
): string[] {
  const out: string[] = [];
  for (const raw of limits) {
    if (out.length >= max) break;
    const localized = localizePackageLimit(lang, raw);
    if (localized) out.push(localized);
  }
  return out;
}

/** Canonical English bodies covered by the presentation map (for tests). */
export const CANONICAL_PACKAGE_LIMIT_KEYS = Object.freeze(
  Object.keys(CANONICAL_PACKAGE_LIMITS)
);
