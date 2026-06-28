'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PeopleHomeRow } from '@/components/PeopleHomeRow';

type Lang = 'en' | 'ru' | 'fa' | 'ar';

const LANG_OPTIONS: Lang[] = ['en', 'ru', 'fa', 'ar'];

const LANDING: Record<
  Lang,
  {
    dir: 'ltr' | 'rtl';
    nav: { features: string; how: string; profile: string; cta: string };
    eyebrow: string;
    headlineA: string;
    headlineHighlight: string;
    sub: string;
    analyzeBtn: string;
    profileBtn: string;
    domainsTitle: string;
    domains: { icon: string; title: string; desc: string }[];
    howTitle: string;
    steps: { step: string; title: string; desc: string }[];
    ctaTitle: string;
    ctaSub: string;
    ctaBtn: string;
    footer: string;
  }
> = {
  en: {
    dir: 'ltr',
    nav: { features: 'Features', how: 'How it works', profile: 'Profile', cta: 'Get Started' },
    eyebrow: 'Astrological Intelligence Platform',
    headlineA: 'Make better decisions with',
    headlineHighlight: 'planetary timing',
    sub:
      'Planet Life analyzes your natal chart against current transits to score your business, financial, and real estate decisions from 0 to 100.',
    analyzeBtn: 'Analyze now',
    profileBtn: 'My Profile',
    domainsTitle: 'Three domains. One blueprint.',
    domains: [
      { icon: '🏢', title: 'Business', desc: 'Launch timing, negotiations, hiring, networking and creative work.' },
      { icon: '💰', title: 'Finance', desc: 'Investment windows, contract signing, financial transactions.' },
      { icon: '🏠', title: 'Real Estate', desc: 'Property acquisition, valuations, structural soundness timing.' },
    ],
    howTitle: 'How it works',
    steps: [
      { step: '01', title: 'Enter your birth data', desc: 'Date, time, and location of birth.' },
      { step: '02', title: 'Choose your action', desc: 'Business launch, investment, real estate purchase, and more.' },
      { step: '03', title: 'Get your score', desc: 'Receive a 0–100 score with opportunities, risks, and recommendations.' },
    ],
    ctaTitle: 'Ready to align with the cosmos?',
    ctaSub: 'Start your first analysis in 30 seconds.',
    ctaBtn: 'Go to home',
    footer: 'Planet Life © 2026',
  },
  ru: {
    dir: 'ltr',
    nav: { features: 'Возможности', how: 'Как это работает', profile: 'Профиль', cta: 'Начать' },
    eyebrow: 'Платформа астрологического анализа',
    headlineA: 'Принимайте лучшие решения с помощью',
    headlineHighlight: 'планетарного тайминга',
    sub:
      'Planet Life анализирует вашу натальную карту с текущими транзитами и оценивает ваши решения в бизнесе, финансах и недвижимости по шкале от 0 до 100.',
    analyzeBtn: 'Анализировать',
    profileBtn: 'Мой профиль',
    domainsTitle: 'Три сферы. Один план.',
    domains: [
      { icon: '🏢', title: 'Бизнес', desc: 'Запуск, переговоры, найм, нетворкинг и творчество.' },
      { icon: '💰', title: 'Финансы', desc: 'Окна для инвестиций, подписания контрактов и сделок.' },
      { icon: '🏠', title: 'Недвижимость', desc: 'Покупка объектов, оценка, проверка надёжности.' },
    ],
    howTitle: 'Как это работает',
    steps: [
      { step: '01', title: 'Введите данные рождения', desc: 'Дата, время и место рождения.' },
      { step: '02', title: 'Выберите действие', desc: 'Запуск бизнеса, инвестиция, покупка недвижимости и другое.' },
      { step: '03', title: 'Получите оценку', desc: 'Балл 0–100 с возможностями, рисками и рекомендациями.' },
    ],
    ctaTitle: 'Готовы сонастроиться с космосом?',
    ctaSub: 'Первый анализ за 30 секунд.',
    ctaBtn: 'На главную',
    footer: 'Planet Life © 2026',
  },
  fa: {
    dir: 'rtl',
    nav: { features: 'ویژگی‌ها', how: 'چگونه کار می‌کند', profile: 'پروفایل', cta: 'شروع' },
    eyebrow: 'پلتفرم هوش نجومی',
    headlineA: 'تصمیم‌های بهتر بگیر با',
    headlineHighlight: 'تایمینگ سیاره‌ای',
    sub:
      'Planet Life چارت تولد شما را با ترانزیت‌های فعلی تحلیل می‌کند و تصمیم‌های کاری، مالی و املاکتان را از ۰ تا ۱۰۰ امتیازدهی می‌کند.',
    analyzeBtn: 'تحلیل کن',
    profileBtn: 'پروفایل من',
    domainsTitle: 'سه حوزه. یک نقشه.',
    domains: [
      { icon: '🏢', title: 'کسب‌وکار', desc: 'تایمینگ راه‌اندازی، مذاکره، استخدام، شبکه‌سازی و کار خلاقانه.' },
      { icon: '💰', title: 'مالی', desc: 'پنجره‌های سرمایه‌گذاری، امضای قرارداد، تراکنش مالی.' },
      { icon: '🏠', title: 'املاک', desc: 'خرید ملک، ارزش‌گذاری، تایمینگ سلامت ساختار.' },
    ],
    howTitle: 'چگونه کار می‌کند',
    steps: [
      { step: '۰۱', title: 'اطلاعات تولد را وارد کن', desc: 'تاریخ، ساعت و محل تولد.' },
      { step: '۰۲', title: 'اقدامت را انتخاب کن', desc: 'راه‌اندازی کسب‌وکار، سرمایه‌گذاری، خرید ملک و بیشتر.' },
      { step: '۰۳', title: 'امتیاز بگیر', desc: 'امتیاز ۰ تا ۱۰۰ همراه با فرصت‌ها، ریسک‌ها و پیشنهادها.' },
    ],
    ctaTitle: 'آماده‌ای با کیهان هم‌راستا بشی؟',
    ctaSub: 'اولین تحلیل را در ۳۰ ثانیه شروع کن.',
    ctaBtn: 'برو به خانه',
    footer: 'Planet Life © 2026',
  },
  ar: {
    dir: 'rtl',
    nav: { features: 'الميزات', how: 'كيف يعمل', profile: 'الملف', cta: 'ابدأ الآن' },
    eyebrow: 'منصة الذكاء الفلكي',
    headlineA: 'اتخذي قرارات أفضل عبر',
    headlineHighlight: 'التوقيت الكوكبي',
    sub:
      'يحلل Planet Life خريطة ميلادك مع العبور الفلكي الحالي ويقيّم قراراتك في الأعمال والمال والعقار من 0 إلى 100.',
    analyzeBtn: 'حلّل الآن',
    profileBtn: 'ملفي',
    domainsTitle: 'ثلاثة مجالات. مخطط واحد.',
    domains: [
      { icon: '🏢', title: 'الأعمال', desc: 'توقيت الإطلاق والمفاوضات والتوظيف والتواصل والأعمال الإبداعية.' },
      { icon: '💰', title: 'المال', desc: 'نوافذ الاستثمار وتوقيع العقود والمعاملات المالية.' },
      { icon: '🏠', title: 'العقارات', desc: 'شراء العقارات والتقييم وتوقيت السلامة الإنشائية.' },
    ],
    howTitle: 'كيف يعمل',
    steps: [
      { step: '٠١', title: 'أدخلي بيانات ميلادك', desc: 'تاريخ ووقت ومكان الميلاد.' },
      { step: '٠٢', title: 'اختاري إجراءك', desc: 'إطلاق عمل، استثمار، شراء عقار وغيرها.' },
      { step: '٠٣', title: 'احصلي على درجتك', desc: 'درجة من 0 إلى 100 مع الفرص والمخاطر والتوصيات.' },
    ],
    ctaTitle: 'مستعدة للانسجام مع الكون؟',
    ctaSub: 'ابدئي أول تحليل خلال 30 ثانية.',
    ctaBtn: 'إلى الصفحة الرئيسية',
    footer: 'Planet Life © 2026',
  },
};

function resolveLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem('planet-life-lang');
  if (stored === 'ru' || stored === 'fa' || stored === 'ar' || stored === 'en') {
    return stored;
  }
  return 'en';
}

export default function Home() {
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    setLang(resolveLang());
    const onStorage = () => setLang(resolveLang());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const changeLang = (nextLang: Lang) => {
    localStorage.setItem('planet-life-lang', nextLang);
    setLang(nextLang);
  };

  const t = LANDING[lang];
  const fontFamily =
    lang === 'fa'
      ? "'Vazirmatn', sans-serif"
      : lang === 'ar'
        ? "'Cairo', 'Vazirmatn', sans-serif"
        : 'Inter, sans-serif';

  return (
    <main
      dir={t.dir}
      lang={lang}
      style={{ fontFamily }}
      className="min-h-screen bg-[#0A0E1A] text-white"
    >
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <circle cx="15" cy="15" r="13" stroke="#fbbf24" strokeWidth="0.5" opacity="0.4" />
            <circle cx="15" cy="15" r="7" stroke="#fbbf24" strokeWidth="0.5" opacity="0.6" />
            <circle cx="15" cy="15" r="2.5" fill="#fbbf24" />
          </svg>
          <span style={{ fontFamily: 'serif', color: '#fbbf24', fontSize: '15px', letterSpacing: '0.15em' }}>
            Planet Life
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm text-white/60">
          <a href="#features" className="hover:text-white transition">
            {t.nav.features}
          </a>
          <a href="#how" className="hover:text-white transition">
            {t.nav.how}
          </a>
          <Link href="/profile" className="hover:text-white transition">
            {t.nav.profile}
          </Link>
          <Link
            href="/home"
            className="bg-amber-500 text-black px-4 py-2 rounded-lg font-medium hover:bg-amber-400 transition"
          >
            {t.nav.cta}
          </Link>
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
            {LANG_OPTIONS.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => changeLang(code)}
                className="rounded-full px-2.5 py-1 text-[11px] font-medium uppercase transition"
                style={{
                  background: lang === code ? 'rgba(251,191,36,0.95)' : 'transparent',
                  color: lang === code ? '#0A0E1A' : 'rgba(255,255,255,0.55)',
                }}
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <section className="flex flex-col items-center justify-center text-center px-6 py-32">
        <div className="text-sm text-amber-400 font-medium mb-4 tracking-widest uppercase">
          {t.eyebrow}
        </div>
        <h1 className="text-5xl font-semibold max-w-3xl leading-tight mb-6">
          {t.headlineA} <span className="text-amber-400">{t.headlineHighlight}</span>
        </h1>
        <p className="text-white/50 max-w-xl text-lg mb-10">{t.sub}</p>
        <div className="flex gap-4">
          <Link
            href="/home"
            className="bg-amber-500 text-black px-6 py-3 rounded-lg font-medium hover:bg-amber-400 transition text-sm"
          >
            {t.analyzeBtn}
          </Link>
          <Link
            href="/profile"
            className="border border-white/20 px-6 py-3 rounded-lg text-sm hover:border-white/40 transition"
          >
            {t.profileBtn}
          </Link>
        </div>
      </section>

      <PeopleHomeRow lang={lang} />

      <section id="features" className="px-8 py-20 max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold text-center mb-12">{t.domainsTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {t.domains.map((f) => (
            <div
              key={f.title}
              className="border border-white/10 rounded-xl p-6 hover:border-amber-500/30 transition"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <div className="font-medium mb-2">{f.title}</div>
              <div className="text-white/50 text-sm leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="px-8 py-20 max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-semibold mb-12">{t.howTitle}</h2>
        <div className="flex flex-col gap-8">
          {t.steps.map((s) => (
            <div key={s.step} className="flex items-start gap-6 text-left">
              <div className="text-amber-400 font-semibold text-lg min-w-[2rem]">{s.step}</div>
              <div>
                <div className="font-medium mb-1">{s.title}</div>
                <div className="text-white/50 text-sm">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="text-center py-20 px-6">
        <h2 className="text-3xl font-semibold mb-4">{t.ctaTitle}</h2>
        <p className="text-white/50 mb-8">{t.ctaSub}</p>
        <Link
          href="/home"
          className="bg-amber-500 text-black px-8 py-3 rounded-lg font-medium hover:bg-amber-400 transition"
        >
          {t.ctaBtn}
        </Link>
      </section>

      <footer className="border-t border-white/10 px-8 py-6 text-center text-white/30 text-sm">
        {t.footer}
      </footer>
    </main>
  );
}
