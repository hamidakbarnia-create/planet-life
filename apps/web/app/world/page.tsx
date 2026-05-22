'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { HOME_LANGS } from '@/lib/home-i18n';
import { loadAppLang, saveAppLang } from '@/lib/calendar-preferences';
import type { AppLang } from '@/lib/app-settings';

// World tab — Macro-level public-facing content engine.
// This is the lead magnet section: markets, geopolitics, real estate,
// celebrity & politician charts. Sprint 6 will populate this with live
// data; this R0 stub presents the architecture as luxury preview cards
// so the user (and visitors) can already see the value proposition.

type WorldKey =
  | 'markets'
  | 'geopolitics'
  | 'realEstate'
  | 'figures'
  | 'dailyBrief';

const WORLD_LANGS: Record<
  AppLang,
  {
    title: string;
    subtitle: string;
    comingSoon: string;
    explore: string;
    sections: Record<
      WorldKey,
      { title: string; sub: string; tagline: string; tags: string[] }
    >;
  }
> = {
  en: {
    title: 'World',
    subtitle:
      'Cosmic intelligence on the markets, world leaders, and the cities that shape your life.',
    comingSoon: 'Sprint 6',
    explore: 'Preview',
    sections: {
      markets: {
        title: 'Markets Pulse',
        sub: 'Oil · Gold · Bitcoin · Forex · Equities',
        tagline:
          'When Mars opposes Pluto, oil swings. We track every transit that moved a market — and the next window.',
        tags: ['Oil', 'Gold', 'BTC', 'USD', 'Equities'],
      },
      geopolitics: {
        title: 'Geopolitics Today',
        sub: 'Country charts · Tension index · War windows',
        tagline:
          'Iran, USA, Israel, Russia, China — each nation has a natal chart. We map the cycles of pressure, breakthrough, and reset.',
        tags: ['Iran', 'USA', 'Russia', 'GCC', 'EU'],
      },
      realEstate: {
        title: 'Real Estate Astrology',
        sub: 'Dubai · Tehran · Riyadh · Istanbul · London',
        tagline:
          'When does Dubai property bottom? When does Istanbul peak? Jupiter and Saturn write the cycle — we read it.',
        tags: ['Buy', 'Hold', 'Sell', 'Relocate'],
      },
      figures: {
        title: 'Sky & Power',
        sub: 'Putin · Trump · MBS · Khamenei · Musk · Netanyahu',
        tagline:
          "Who's about to make the next move? Read the planets pressing on the world's most-watched birth charts.",
        tags: ['Politicians', 'Founders', 'Athletes', 'Stars'],
      },
      dailyBrief: {
        title: 'World Brief',
        sub: 'A 60-second cosmic snapshot of the day',
        tagline:
          'Every morning, one short note: who is under tension, what asset is in motion, where the next golden hour is.',
        tags: ['Daily', 'Free'],
      },
    },
  },
  ru: {
    title: 'Мир',
    subtitle:
      'Космическая разведка по рынкам, лидерам и городам, формирующим вашу жизнь.',
    comingSoon: 'Спринт 6',
    explore: 'Предпросмотр',
    sections: {
      markets: {
        title: 'Пульс рынков',
        sub: 'Нефть · Золото · Биткоин · Форекс · Акции',
        tagline:
          'Когда Марс в оппозиции к Плутону — нефть колеблется. Мы отслеживаем каждый транзит, который двигал рынки.',
        tags: ['Нефть', 'Золото', 'BTC', 'USD', 'Акции'],
      },
      geopolitics: {
        title: 'Геополитика дня',
        sub: 'Карты стран · Индекс напряжения · Окна войны',
        tagline:
          'У каждой страны — натальная карта. Мы читаем циклы давления, прорыва и перезагрузки.',
        tags: ['Иран', 'США', 'Россия', 'ОАЭ', 'ЕС'],
      },
      realEstate: {
        title: 'Астрология недвижимости',
        sub: 'Дубай · Тегеран · Эр-Рияд · Стамбул · Лондон',
        tagline:
          'Когда рынок Дубая на паузе, а у Стамбула идёт вверх. Циклы Юпитера и Сатурна дадут подсказку — мы помогаем это понять.',
        tags: ['Купить', 'Держать', 'Продать', 'Переезд'],
      },
      figures: {
        title: 'Небо и власть',
        sub: 'Путин · Трамп · MBS · Хаменеи · Маск · Нетаньяху',
        tagline:
          'Кто сделает следующий ход? Читаем планеты, давящие на самые наблюдаемые карты мира.',
        tags: ['Политики', 'Основатели', 'Атлеты', 'Звёзды'],
      },
      dailyBrief: {
        title: 'Мировой обзор',
        sub: 'Космический снимок дня за 60 секунд',
        tagline:
          'Каждое утро короткая заметка: кто под напряжением, какой актив в движении, где следующий золотой час.',
        tags: ['Ежедневно', 'Бесплатно'],
      },
    },
  },
  fa: {
    title: 'جهان',
    subtitle:
      'هوش کیهانی روی بازارها، رهبران جهان و شهرهایی که زندگی تو را شکل می‌دهند.',
    comingSoon: 'اسپرینت ۶',
    explore: 'پیش‌نمایش',
    sections: {
      markets: {
        title: 'نبض بازارها',
        sub: 'نفت · طلا · بیت‌کوین · فارکس · سهام',
        tagline:
          'وقتی مریخ مقابل پلوتو می‌شود، نفت تکان می‌خورد. هر ترانزیت که بازار را تکان داده، رصد می‌کنیم — و پنجره بعدی را می‌گوییم.',
        tags: ['نفت', 'طلا', 'بیت‌کوین', 'دلار', 'سهام'],
      },
      geopolitics: {
        title: 'ژئوپلیتیک امروز',
        sub: 'چارت کشورها · شاخص تنش · پنجره‌های جنگ',
        tagline:
          'ایران، آمریکا، اسرائیل، روسیه، چین — هر کشور چارت تولد دارد. چرخه فشار، گشایش و ریست را می‌خوانیم.',
        tags: ['ایران', 'آمریکا', 'روسیه', 'خلیج', 'اروپا'],
      },
      realEstate: {
        title: 'استرولوژی املاک',
        sub: 'دبی · تهران · ریاض · استانبول · لندن',
        tagline:
          'ملک دبی کِی به کف می‌رسد؟ استانبول کِی اوج می‌گیرد؟ ژوپیتر و زحل چرخه را می‌نویسند — ما می‌خوانیم.',
        tags: ['خرید', 'نگه‌داری', 'فروش', 'مهاجرت'],
      },
      figures: {
        title: 'آسمان و قدرت',
        sub: 'پوتین · ترامپ · بن‌سلمان · خامنه‌ای · ماسک · نتانیاهو',
        tagline:
          'حرکت بعدی از کیست؟ سیاراتی که روی پربیننده‌ترین چارت‌های دنیا فشار می‌آورند را می‌خوانیم.',
        tags: ['سیاستمدار', 'بنیان‌گذار', 'ورزشکار', 'ستاره'],
      },
      dailyBrief: {
        title: 'بریف جهان',
        sub: 'تصویر کیهانی روز در ۶۰ ثانیه',
        tagline:
          'هر صبح یک یادداشت کوتاه: کی زیر فشار است، کدام دارایی در حرکت است، پنجره طلایی بعدی کجاست.',
        tags: ['روزانه', 'رایگان'],
      },
    },
  },
  ar: {
    title: 'العالم',
    subtitle:
      'استخبارات كونية على الأسواق وقادة العالم والمدن التي تشكّل حياتك.',
    comingSoon: 'سبرنت ٦',
    explore: 'معاينة',
    sections: {
      markets: {
        title: 'نبض الأسواق',
        sub: 'النفط · الذهب · البيتكوين · العملات · الأسهم',
        tagline:
          'حين يقابل المرّيخ بلوتو، يتأرجح النفط. نتتبّع كل عبور حرّك السوق — والنافذة القادمة.',
        tags: ['النفط', 'الذهب', 'BTC', 'الدولار', 'الأسهم'],
      },
      geopolitics: {
        title: 'جيوسياسة اليوم',
        sub: 'خرائط الدول · مؤشر التوتر · نوافذ الحرب',
        tagline:
          'لكل دولة خريطة ميلاد. نقرأ دورات الضغط والاختراق وإعادة التشكّل.',
        tags: ['إيران', 'أمريكا', 'روسيا', 'الخليج', 'أوروبا'],
      },
      realEstate: {
        title: 'فلك العقار',
        sub: 'دبي · طهران · الرياض · إسطنبول · لندن',
        tagline:
          'متى يلامس عقار دبي القاع؟ متى تذروة إسطنبول؟ المشتري وزحل يكتبان الدورة — نحن نقرأها.',
        tags: ['شراء', 'احتفاظ', 'بيع', 'انتقال'],
      },
      figures: {
        title: 'السماء والسلطة',
        sub: 'بوتين · ترامب · MBS · خامنئي · ماسك · نتنياهو',
        tagline:
          'من سيتحرّك تالياً؟ نقرأ الكواكب الضاغطة على أكثر خرائط العالم متابعةً.',
        tags: ['سياسيون', 'مؤسّسون', 'رياضيون', 'نجوم'],
      },
      dailyBrief: {
        title: 'موجز العالم',
        sub: 'لقطة كونية لليوم في 60 ثانية',
        tagline:
          'كل صباح ملاحظة قصيرة: من تحت الضغط، أي أصل في حركة، وأين الساعة الذهبية القادمة.',
        tags: ['يومي', 'مجاني'],
      },
    },
  },
};

const SECTION_ORDER: WorldKey[] = [
  'dailyBrief',
  'markets',
  'geopolitics',
  'realEstate',
  'figures',
];

const SECTION_ACCENTS: Record<WorldKey, { glow: string; ring: string; tint: string }> = {
  dailyBrief: { glow: 'rgba(251,191,36,0.18)', ring: 'rgba(251,191,36,0.28)', tint: '#fbbf24' },
  markets: { glow: 'rgba(74,222,128,0.18)', ring: 'rgba(74,222,128,0.28)', tint: '#86efac' },
  geopolitics: { glow: 'rgba(248,113,113,0.18)', ring: 'rgba(248,113,113,0.28)', tint: '#fca5a5' },
  realEstate: { glow: 'rgba(96,165,250,0.18)', ring: 'rgba(96,165,250,0.28)', tint: '#93c5fd' },
  figures: { glow: 'rgba(196,181,253,0.18)', ring: 'rgba(196,181,253,0.28)', tint: '#c4b5fd' },
};

export default function WorldPage() {
  const [lang, setLangState] = useState<AppLang>('en');

  useEffect(() => {
    const stored = loadAppLang();
    if (stored === 'en' || stored === 'ru' || stored === 'fa' || stored === 'ar') {
      setLangState(stored);
    }
  }, []);

  const setLang = (l: AppLang) => {
    setLangState(l);
    saveAppLang(l);
  };

  const t = WORLD_LANGS[lang];
  const dir = HOME_LANGS[lang].dir;
  const fontFamily = lang === 'fa' ? 'Vazirmatn, sans-serif' : 'Inter, sans-serif';

  return (
    <AppShell
      lang={lang}
      setLang={setLang}
      dir={dir}
      navLabels={HOME_LANGS[lang].nav}
      fontFamily={fontFamily}
    >
      <div className="relative min-h-[calc(100vh-60px)] overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(251,191,36,0.05), transparent 60%), radial-gradient(ellipse 60% 40% at 80% 30%, rgba(96,165,250,0.04), transparent 60%), radial-gradient(ellipse 60% 40% at 20% 70%, rgba(196,181,253,0.04), transparent 60%)',
          }}
        />

        <div className="relative max-w-5xl mx-auto px-6 py-10">
          <div className="text-center mb-10">
            <div
              className="fc text-[11px] tracking-[0.3em] mb-3"
              style={{ color: 'rgba(251,191,36,0.6)' }}
            >
              · {t.comingSoon} ·
            </div>
            <h1
              className="fc text-4xl md:text-5xl mb-3"
              style={{ color: '#fbbf24', letterSpacing: '0.05em' }}
            >
              {t.title}
            </h1>
            <p
              className="fi text-sm md:text-base max-w-2xl mx-auto leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.55)' }}
            >
              {t.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SECTION_ORDER.map((key) => {
              const s = t.sections[key];
              const accent = SECTION_ACCENTS[key];
              const isHero = key === 'dailyBrief';
              return (
                <div
                  key={key}
                  className={`relative rounded-2xl p-6 overflow-hidden transition-all hover:scale-[1.01] ${
                    isHero ? 'md:col-span-2' : ''
                  }`}
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(20,24,40,0.7), rgba(14,18,32,0.7))',
                    border: `1px solid ${accent.ring}`,
                    boxShadow: `0 0 40px ${accent.glow}, inset 0 0 0 1px rgba(255,255,255,0.02)`,
                  }}
                >
                  <div
                    aria-hidden
                    className="absolute inset-0 pointer-events-none opacity-50"
                    style={{
                      background: `radial-gradient(circle at 100% 0%, ${accent.glow}, transparent 60%)`,
                    }}
                  />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h2
                          className="fc text-xl md:text-2xl mb-1"
                          style={{ color: accent.tint, letterSpacing: '0.04em' }}
                        >
                          {s.title}
                        </h2>
                        <div
                          className="fi text-[11px] tracking-wide"
                          style={{ color: 'rgba(255,255,255,0.4)' }}
                        >
                          {s.sub}
                        </div>
                      </div>
                      <span
                        className="fi text-[10px] px-2 py-1 rounded-full"
                        style={{
                          background: 'rgba(251,191,36,0.08)',
                          border: '1px solid rgba(251,191,36,0.15)',
                          color: 'rgba(251,191,36,0.7)',
                        }}
                      >
                        {t.explore}
                      </span>
                    </div>
                    <p
                      className="fi text-sm leading-relaxed mb-4"
                      style={{ color: 'rgba(255,255,255,0.7)' }}
                    >
                      {s.tagline}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {s.tags.map((tag) => (
                        <span
                          key={tag}
                          className="fi text-[11px] px-2.5 py-1 rounded-md"
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.6)',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/home"
              className="fi text-sm no-underline px-5 py-2.5 rounded-lg inline-block transition-all"
              style={{
                color: 'rgba(255,255,255,0.55)',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              ← {lang === 'fa' ? 'بازگشت به امروز' : lang === 'ar' ? 'العودة إلى اليوم' : lang === 'ru' ? 'Назад к сегодня' : 'Back to Today'}
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
