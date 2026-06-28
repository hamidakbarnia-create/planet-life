'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { HOME_LANGS } from '@/lib/home-i18n';
import { loadAppLang, saveAppLang } from '@/lib/calendar-preferences';
import type { AppLang } from '@/lib/app-settings';
import {
  fetchMarkets,
  fetchNews,
  fetchNewsQuery,
  fetchSky,
  fetchFigure,
  fetchCitySky,
  figureSignalToSky,
  citySignalToSky,
  type MarketQuote,
  type NewsItem,
  type SkySignal,
} from '@/lib/world-api';
import { skySignalParts, skySignalDetail, strengthFromOrb, orbText, toneColor } from '@/lib/world-i18n';

const LIVE_LABELS: Record<AppLang, { live: string; free: string; cosmic: string; context: string; noRead: string; loading: string; openFull: string; searchFigure: string; searchCity: string; close: string; fullRead: string; sources: string; searchPlaceholder: string; cityPlaceholder: string; searchBtn: string; searchHint: string; cityHint: string; foundFigure: string; missingFigure: string; foundCity: string; missingCity: string }> = {
  en: { live: 'LIVE', free: 'Free', cosmic: 'What the stars say', context: "What's happening", noRead: 'The sky is quiet on this theme right now.', loading: 'Reading the sky…', openFull: 'Open full reading', searchFigure: 'Search a figure', searchCity: 'Search a city', close: 'Close', fullRead: 'Full cosmic reading', sources: 'Live sources', searchPlaceholder: 'e.g. Trump, Musk, Ronaldo…', cityPlaceholder: 'e.g. Dubai, Istanbul, London…', searchBtn: 'Search', searchHint: 'Search any public figure to see live news + the current sky.', cityHint: 'Search any city to see property-market news + the current real-estate sky.', foundFigure: 'Reading current transits to this person\u2019s own chart.', missingFigure: 'No birth data on file for this name yet \u2014 showing live news with the global sky.', foundCity: 'Reading the sky over this city\u2019s local angles right now.', missingCity: 'Could not locate that city \u2014 showing live news with the global sky.' },
  ru: { live: 'LIVE', free: 'Бесплатно', cosmic: 'Что говорят звёзды', context: 'Что происходит', noRead: 'Небо сейчас спокойно по этой теме.', loading: 'Читаем небо…', openFull: 'Открыть полный разбор', searchFigure: 'Искать персону', searchCity: 'Искать город', close: 'Закрыть', fullRead: 'Полный космический разбор', sources: 'Живые источники', searchPlaceholder: 'напр. Трамп, Маск, Роналду…', cityPlaceholder: 'напр. Дубай, Стамбул, Лондон…', searchBtn: 'Найти', searchHint: 'Найдите любую публичную персону — живые новости + текущее небо.', cityHint: 'Найдите любой город — новости рынка недвижимости + текущее небо недвижимости.', foundFigure: 'Читаем текущие транзиты к натальной карте этого человека.', missingFigure: 'Данных о рождении для этого имени пока нет — показываем живые новости и общее небо.', foundCity: 'Читаем небо над локальными углами этого города прямо сейчас.', missingCity: 'Не удалось найти этот город — показываем живые новости и общее небо.' },
  fa: { live: 'زنده', free: 'رایگان', cosmic: 'ستارگان چه می‌گویند', context: 'چه خبر است', noRead: 'آسمان فعلاً در این موضوع آرام است.', loading: 'در حال خواندن آسمان…', openFull: 'باز کردن خوانش کامل', searchFigure: 'جستجوی شخص', searchCity: 'جستجوی شهر', close: 'بستن', fullRead: 'خوانش کامل کیهانی', sources: 'منابع زنده', searchPlaceholder: 'مثلاً ترامپ، ماسک، رونالدو…', cityPlaceholder: 'مثلاً دبی، استانبول، لندن…', searchBtn: 'جستجو', searchHint: 'هر شخصیت عمومی را جستجو کن تا خبرهای زنده و آسمان امروز را ببینی.', cityHint: 'هر شهر را جستجو کن تا خبرهای بازار ملک و آسمان امروزِ املاک را ببینی.', foundFigure: 'گذرهای کنونی روی چارت تولدِ همین شخص خوانده می‌شود.', missingFigure: 'هنوز دادهٔ تولدی برای این نام نداریم — خبرهای زنده همراه آسمان کلی نمایش داده می‌شود.', foundCity: 'آسمان روی زوایای محلیِ همین شهر همین حالا خوانده می‌شود.', missingCity: 'این شهر پیدا نشد — خبرهای زنده همراه آسمان کلی نمایش داده می‌شود.' },
  ar: { live: 'مباشر', free: 'مجاني', cosmic: 'ماذا تقول النجوم', context: 'ما الذي يجري', noRead: 'السماء هادئة في هذا الموضوع الآن.', loading: 'نقرأ السماء…', openFull: 'افتح القراءة الكاملة', searchFigure: 'ابحث عن شخصية', searchCity: 'ابحث عن مدينة', close: 'إغلاق', fullRead: 'قراءة كونية كاملة', sources: 'مصادر مباشرة', searchPlaceholder: 'مثل ترامب، ماسك، رونالدو…', cityPlaceholder: 'مثل دبي، إسطنبول، لندن…', searchBtn: 'بحث', searchHint: 'ابحث عن أي شخصية عامة لرؤية الأخبار الحيّة والسماء الحالية.', cityHint: 'ابحث عن أي مدينة لرؤية أخبار العقار والسماء الحالية للعقار.', foundFigure: 'نقرأ العبور الحالي إلى خريطة ميلاد هذا الشخص.', missingFigure: 'لا تتوفّر بيانات ميلاد لهذا الاسم بعد — نعرض الأخبار الحيّة مع السماء العامة.', foundCity: 'نقرأ السماء فوق الزوايا المحلية لهذه المدينة الآن.', missingCity: 'تعذّر تحديد هذه المدينة — نعرض الأخبار الحيّة مع السماء العامة.' },
};

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
        sub: 'Search any city or property market',
        tagline:
          'Search a city to see live property news and the Jupiter-Saturn cycle shaping the market.',
        tags: ['Buy', 'Hold', 'Sell', 'Relocate'],
      },
      figures: {
        title: 'Sky & Power',
        sub: 'Search any leader, founder, athlete or star',
        tagline:
          "Who's about to make the next move? Search a name to read the live news and the planets pressing on the world right now.",
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
        sub: 'Найдите любой город или рынок недвижимости',
        tagline:
          'Введите город — покажем живые новости недвижимости и цикл Юпитера-Сатурна, влияющий на рынок.',
        tags: ['Купить', 'Держать', 'Продать', 'Переезд'],
      },
      figures: {
        title: 'Небо и власть',
        sub: 'Найдите любого лидера, основателя, спортсмена или звезду',
        tagline:
          'Кто сделает следующий ход? Введите имя — покажем живые новости и планеты, давящие на мир прямо сейчас.',
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
      'هوش کیهانی دربارهٔ بازارها، رهبران جهان و شهرهایی که زندگی‌ات را شکل می‌دهند.',
    comingSoon: 'اسپرینت ۶',
    explore: 'پیش‌نمایش',
    sections: {
      markets: {
        title: 'نبض بازارها',
        sub: 'نفت · طلا · بیت‌کوین · فارکس · سهام',
        tagline:
          'وقتی مریخ در مقابلهٔ پلوتو قرار می‌گیرد، نفت نوسان می‌کند. هر ترانزیتی را که بازار را تکان داده رصد می‌کنیم و پنجرهٔ بعدی را نشان می‌دهیم.',
        tags: ['نفت', 'طلا', 'بیت‌کوین', 'دلار', 'سهام'],
      },
      geopolitics: {
        title: 'ژئوپلیتیک امروز',
        sub: 'چارت کشورها · شاخص تنش · پنجره‌های جنگ',
        tagline:
          'ایران، آمریکا، اسرائیل، روسیه، چین — هر کشور زایچهٔ تولد دارد. چرخهٔ فشار، گشایش و بازآغاز را می‌خوانیم.',
        tags: ['ایران', 'آمریکا', 'روسیه', 'خلیج', 'اروپا'],
      },
      realEstate: {
        title: 'اختربینی املاک',
        sub: 'هر شهر یا بازار ملک را جستجو کن',
        tagline:
          'یک شهر را جستجو کن تا خبرهای زندهٔ ملک و چرخهٔ مشتری و زحلِ اثرگذار بر بازار را ببینی.',
        tags: ['خرید', 'نگه‌داری', 'فروش', 'مهاجرت'],
      },
      figures: {
        title: 'آسمان و قدرت',
        sub: 'هر رهبر، بنیان‌گذار، ورزشکار یا ستاره را جستجو کن',
        tagline:
          'حرکت بعدی را چه کسی می‌زند؟ یک نام را جستجو کن تا خبرهای زنده و سیاراتی را که همین حالا بر جهان فشار می‌آورند ببینی.',
        tags: ['سیاستمدار', 'بنیان‌گذار', 'ورزشکار', 'ستاره'],
      },
      dailyBrief: {
        title: 'جهان در یک نگاه',
        sub: 'نگاه شصت‌ثانیه‌ای به کیهان امروز',
        tagline:
          'هر بامداد، یک یادداشت کوتاه: چه کسی تحت فشار است، کدام دارایی در حرکت است و ساعت طلایی بعدی کجاست.',
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
        sub: 'ابحث عن أي مدينة أو سوق عقاري',
        tagline:
          'ابحث عن مدينة لترى أخبار العقار الحيّة ودورة المشتري وزحل المؤثرة في السوق.',
        tags: ['شراء', 'احتفاظ', 'بيع', 'انتقال'],
      },
      figures: {
        title: 'السماء والسلطة',
        sub: 'ابحث عن أي زعيم أو مؤسّس أو رياضي أو نجم',
        tagline:
          'من سيتحرّك تالياً؟ ابحث عن اسم لترى الأخبار الحيّة والكواكب الضاغطة على العالم الآن.',
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
  // 'figures' ('Sky & Power') hidden for now — needs more depth before it feels real.
];

const SECTION_ACCENTS: Record<WorldKey, { glow: string; ring: string; tint: string }> = {
  dailyBrief: { glow: 'rgba(251,191,36,0.18)', ring: 'rgba(251,191,36,0.28)', tint: '#fbbf24' },
  markets: { glow: 'rgba(251,146,60,0.18)', ring: 'rgba(251,146,60,0.28)', tint: '#fdba74' },
  geopolitics: { glow: 'rgba(248,113,113,0.18)', ring: 'rgba(248,113,113,0.28)', tint: '#fca5a5' },
  realEstate: { glow: 'rgba(96,165,250,0.18)', ring: 'rgba(96,165,250,0.28)', tint: '#93c5fd' },
  figures: { glow: 'rgba(196,181,253,0.18)', ring: 'rgba(196,181,253,0.28)', tint: '#c4b5fd' },
};

// The hero of every card: the astrological conclusion. The chart aspect is
// shown small underneath as the basis. This is the product — not the news.
function CosmicRead({ lang, signals, label, emptyLabel, tint }: { lang: AppLang; signals: SkySignal[]; label: string; emptyLabel: string; tint: string }) {
  return (
    <div className="mb-4 rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="fi mb-2.5 text-[10px] uppercase tracking-[0.18em]" style={{ color: tint }}>✦ {label}</div>
      {!signals || signals.length === 0 ? (
        <p className="fi text-[12px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{emptyLabel}</p>
      ) : (
        <ul className="space-y-2.5">
          {signals.slice(0, 3).map((sig, i) => {
            const { conclusion, basis } = skySignalParts(lang, sig);
            return (
              <li key={i} className="flex gap-2.5">
                <span aria-hidden className="mt-[5px] h-2 w-2 shrink-0 rounded-full" style={{ background: toneColor(sig.tone) }} />
                <div>
                  <div className="fi text-[13px] leading-snug text-white/90">{conclusion}</div>
                  {basis && <div className="fi mt-0.5 text-[10px] tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>{basis}</div>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// Secondary context only — small, muted. We are not a news website.
function ContextRow({ label }: { label: string }) {
  return (
    <div className="fi mb-2 text-[10px] uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</div>
  );
}

function QuoteList({ quotes }: { quotes: MarketQuote[] }) {
  if (!quotes || quotes.length === 0) return null;
  return (
    <div className="mb-4 grid grid-cols-3 gap-1.5">
      {quotes.filter((q) => q.price != null).slice(0, 6).map((q) => {
        const up = (q.changePct ?? 0) >= 0;
        const c = q.changePct == null ? 'rgba(255,255,255,0.4)' : up ? '#86efac' : '#fca5a5';
        return (
          <div key={q.key} className="rounded-md px-2 py-1.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="fi text-[9px] tracking-wide truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{q.label}</div>
            <div className="fi text-[12px] font-semibold text-white/85">{q.price?.toLocaleString()}</div>
            {q.changePct != null && (
              <div className="fi text-[10px] font-medium" style={{ color: c }}>{up ? '+' : ''}{q.changePct}%</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function NewsList({ items }: { items: NewsItem[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-4 space-y-1">
      {items.slice(0, 3).map((n, i) => (
        <a key={i} href={n.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="fi block truncate text-[11px] leading-relaxed no-underline transition-colors hover:text-white/80" style={{ color: 'rgba(255,255,255,0.5)' }}>
          · {n.title}
        </a>
      ))}
    </div>
  );
}

// Full expanded reading for a section — every signal with its deeper meaning,
// plus all live context. Opened by clicking a card.
function SectionDetail({
  lang,
  title,
  tint,
  signals,
  quotes,
  news,
  labels,
  search,
  onClose,
}: {
  lang: AppLang;
  title: string;
  tint: string;
  signals: SkySignal[];
  quotes: MarketQuote[];
  news: NewsItem[];
  labels: (typeof LIVE_LABELS)[AppLang];
  search?: { query: string; setQuery: (v: string) => void; onSearch: () => void; loading: boolean; placeholder: string; hint: string; notice?: string };
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 md:p-8" style={{ background: 'rgba(6,8,16,0.78)', backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <div
        className="relative w-full max-w-2xl rounded-2xl p-6 md:p-8"
        style={{ background: 'linear-gradient(135deg, rgba(20,24,40,0.98), rgba(14,18,32,0.98))', border: `1px solid ${tint}55`, boxShadow: `0 0 60px ${tint}22` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="fi text-[10px] uppercase tracking-[0.2em]" style={{ color: tint }}>✦ {labels.fullRead}</div>
            <h2 className="fc mt-1 text-2xl md:text-3xl" style={{ color: tint, letterSpacing: '0.03em' }}>{title}</h2>
          </div>
          <button type="button" onClick={onClose} className="fi rounded-lg px-3 py-1.5 text-xs" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}>
            {labels.close}
          </button>
        </div>

        {search && (
          <div className="mb-5">
            <div className="flex gap-2">
              <input
                value={search.query}
                onChange={(e) => search.setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') search.onSearch(); }}
                placeholder={search.placeholder}
                className="fi flex-1 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}
              />
              <button type="button" onClick={search.onSearch} disabled={search.loading || search.query.trim().length < 2} className="fi rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-40" style={{ background: tint, color: '#101010' }}>
                {search.loading ? labels.loading : labels.searchBtn}
              </button>
            </div>
            <p className="fi mt-2 text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{search.hint}</p>
            {search.notice && (
              <p className="fi mt-1.5 text-[11px]" style={{ color: 'rgba(251,191,36,0.7)' }}>{search.notice}</p>
            )}
          </div>
        )}

        {signals.length === 0 ? (
          <p className="fi text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{labels.noRead}</p>
        ) : (
          <div className="space-y-4">
            {signals.map((sig, i) => {
              const { conclusion } = skySignalParts(lang, sig);
              return (
                <div key={i} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center gap-2.5">
                    <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: toneColor(sig.tone) }} />
                    <div className="fi text-[15px] font-semibold text-white/90">{conclusion}</div>
                  </div>
                  <p className="fi mt-2 text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{skySignalDetail(lang, sig)}</p>
                  {(strengthFromOrb(lang, sig.orb) || orbText(lang, sig.orb)) && (
                    <div className="fi mt-2 flex gap-2 text-[10px] uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {strengthFromOrb(lang, sig.orb) && <span className="rounded px-1.5 py-0.5" style={{ background: `${toneColor(sig.tone)}22`, color: toneColor(sig.tone) }}>{strengthFromOrb(lang, sig.orb)}</span>}
                      {orbText(lang, sig.orb) && <span>{orbText(lang, sig.orb)}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {quotes.filter((q) => q.price != null).length > 0 && (
          <div className="mt-6">
            <div className="fi mb-2 text-[10px] uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.3)' }}>{labels.context}</div>
            <QuoteList quotes={quotes} />
          </div>
        )}

        {news.length > 0 && (
          <div className="mt-4">
            <div className="fi mb-2 text-[10px] uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.3)' }}>{labels.sources}</div>
            <div className="space-y-2">
              {news.slice(0, 8).map((n, i) => (
                <a key={i} href={n.link} target="_blank" rel="noopener noreferrer" className="block rounded-lg px-3 py-2 no-underline transition-colors hover:bg-white/[0.06]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="fi text-[12px] leading-snug text-white/85">{n.title}</div>
                  {n.source && <div className="fi mt-0.5 text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{n.source}</div>}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorldPage() {
  const [lang, setLangState] = useState<AppLang>('en');
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [geoNews, setGeoNews] = useState<NewsItem[]>([]);
  const [marketNews, setMarketNews] = useState<NewsItem[]>([]);
  const [realEstateNews, setRealEstateNews] = useState<NewsItem[]>([]);
  const [sky, setSky] = useState<{ markets: SkySignal[]; geopolitics: SkySignal[] } | null>(null);
  const [liveLoading, setLiveLoading] = useState(true);
  const [openSection, setOpenSection] = useState<WorldKey | null>(null);
  const [figureQuery, setFigureQuery] = useState('');
  const [figureNews, setFigureNews] = useState<NewsItem[]>([]);
  const [figureLoading, setFigureLoading] = useState(false);
  const [figureSignals, setFigureSignals] = useState<SkySignal[] | null>(null);
  const [figureNotice, setFigureNotice] = useState<string>('');
  const [realEstateQuery, setRealEstateQuery] = useState('');
  const [realEstateLoading, setRealEstateLoading] = useState(false);
  const [realEstateSignals, setRealEstateSignals] = useState<SkySignal[] | null>(null);
  const [realEstateNotice, setRealEstateNotice] = useState<string>('');

  useEffect(() => {
    const stored = loadAppLang();
    if (stored === 'en' || stored === 'ru' || stored === 'fa' || stored === 'ar') {
      setLangState(stored);
    }
  }, []);

  const loadLive = useCallback(async (l: AppLang) => {
    setLiveLoading(true);
    const [m, g, mn, rn, s] = await Promise.allSettled([
      fetchMarkets(),
      fetchNews('geopolitics', l),
      fetchNews('markets', l),
      fetchNews('realEstate', l),
      fetchSky(),
    ]);
    if (m.status === 'fulfilled') setQuotes(m.value.quotes);
    if (g.status === 'fulfilled') setGeoNews(g.value);
    if (mn.status === 'fulfilled') setMarketNews(mn.value);
    if (rn.status === 'fulfilled') setRealEstateNews(rn.value);
    if (s.status === 'fulfilled') setSky(s.value.themes);
    setLiveLoading(false);
  }, []);

  useEffect(() => {
    loadLive(lang);
  }, [lang, loadLive]);

  const setLang = (l: AppLang) => {
    setLangState(l);
    saveAppLang(l);
  };

  const t = WORLD_LANGS[lang];
  const live = LIVE_LABELS[lang];
  const isLiveSection = (key: WorldKey) => key === 'markets' || key === 'geopolitics' || key === 'dailyBrief' || key === 'figures' || key === 'realEstate';
  const sectionData = (key: WorldKey): { signals: SkySignal[]; quotes: MarketQuote[]; news: NewsItem[] } => {
    if (key === 'markets') return { signals: sky?.markets ?? [], quotes, news: marketNews };
    if (key === 'geopolitics') return { signals: sky?.geopolitics ?? [], quotes: [], news: geoNews };
    if (key === 'figures') return { signals: figureSignals ?? sky?.geopolitics ?? [], quotes: [], news: figureNews };
    if (key === 'realEstate') return { signals: realEstateSignals ?? sky?.markets ?? [], quotes: [], news: realEstateNews };
    if (key === 'dailyBrief')
      return {
        signals: [...(sky?.geopolitics ?? []), ...(sky?.markets ?? [])],
        quotes,
        news: marketNews.length ? marketNews : geoNews,
      };
    return { signals: [], quotes: [], news: [] };
  };
  const searchFigure = async () => {
    const q = figureQuery.trim();
    if (q.length < 2) return;
    setFigureLoading(true);
    try {
      const [news, fig] = await Promise.all([fetchNewsQuery(q, lang), fetchFigure(q)]);
      setFigureNews(news);
      if (fig.found && fig.signals && fig.signals.length) {
        setFigureSignals(fig.signals.map(figureSignalToSky));
        setFigureNotice(live.foundFigure);
      } else {
        setFigureSignals(null);
        setFigureNotice(live.missingFigure);
      }
    } finally {
      setFigureLoading(false);
    }
  };
  const searchRealEstate = async () => {
    const q = realEstateQuery.trim();
    if (q.length < 2) return;
    setRealEstateLoading(true);
    try {
      const news = await fetchNewsQuery(`${q} real estate property market prices`, lang);
      setRealEstateNews(news);
      // Geocode the city, then read the live sky over its local angles.
      let placed = false;
      try {
        const geo = await fetch(`/api/cities?q=${encodeURIComponent(q)}&lang=${lang}`, { cache: 'no-store' });
        const list = geo.ok ? await geo.json() : [];
        if (Array.isArray(list) && list.length && typeof list[0].lat === 'number') {
          const city = await fetchCitySky(list[0].lat, list[0].lon);
          if (city && city.signals.length) {
            setRealEstateSignals(city.signals.map(citySignalToSky));
            setRealEstateNotice(live.foundCity);
            placed = true;
          }
        }
      } catch {
        /* fall back below */
      }
      if (!placed) {
        setRealEstateSignals(null);
        setRealEstateNotice(live.missingCity);
      }
    } finally {
      setRealEstateLoading(false);
    }
  };
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
              · {live.free} · {live.live} ·
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
                  onClick={isLiveSection(key) ? () => setOpenSection(key) : undefined}
                  className={`relative rounded-2xl p-6 overflow-hidden transition-all hover:scale-[1.01] ${
                    isHero ? 'md:col-span-2' : ''
                  } ${isLiveSection(key) ? 'cursor-pointer' : ''}`}
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
                      {isLiveSection(key) ? (
                        <span
                          className="fi inline-flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full"
                          style={{
                            background: 'rgba(74,222,128,0.1)',
                            border: '1px solid rgba(74,222,128,0.25)',
                            color: '#86efac',
                          }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#4ade80' }} />
                          {live.live}
                        </span>
                      ) : (
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
                      )}
                    </div>
                    <p
                      className="fi text-sm leading-relaxed mb-4"
                      style={{ color: 'rgba(255,255,255,0.7)' }}
                    >
                      {s.tagline}
                    </p>
                    {key === 'markets' && (
                      <>
                        <CosmicRead lang={lang} signals={sky?.markets ?? []} label={live.cosmic} emptyLabel={liveLoading ? live.loading : live.noRead} tint={accent.tint} />
                        <ContextRow label={live.context} />
                        <QuoteList quotes={quotes} />
                        <NewsList items={marketNews} />
                      </>
                    )}
                    {key === 'geopolitics' && (
                      <>
                        <CosmicRead lang={lang} signals={sky?.geopolitics ?? []} label={live.cosmic} emptyLabel={liveLoading ? live.loading : live.noRead} tint={accent.tint} />
                        <ContextRow label={live.context} />
                        <NewsList items={geoNews} />
                      </>
                    )}
                    {key === 'dailyBrief' && (
                      <>
                        <CosmicRead lang={lang} signals={[...(sky?.geopolitics ?? []), ...(sky?.markets ?? [])].slice(0, 3)} label={live.cosmic} emptyLabel={liveLoading ? live.loading : live.noRead} tint={accent.tint} />
                        <ContextRow label={live.context} />
                        <NewsList items={marketNews.length ? marketNews.slice(0, 2) : geoNews.slice(0, 2)} />
                      </>
                    )}
                    {key === 'realEstate' && (
                      <>
                        <CosmicRead lang={lang} signals={sky?.markets ?? []} label={live.cosmic} emptyLabel={liveLoading ? live.loading : live.noRead} tint={accent.tint} />
                        <ContextRow label={live.context} />
                        <NewsList items={realEstateNews} />
                      </>
                    )}
                    {key === 'figures' && (
                      <CosmicRead lang={lang} signals={sky?.geopolitics ?? []} label={live.cosmic} emptyLabel={liveLoading ? live.loading : live.noRead} tint={accent.tint} />
                    )}
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
                    {isLiveSection(key) && (
                      <div className="fi mt-4 inline-flex items-center gap-1 text-[12px] font-medium" style={{ color: accent.tint }}>
                        {key === 'figures' ? live.searchFigure : key === 'realEstate' ? live.searchCity : live.openFull} →
                      </div>
                    )}
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

        {openSection && (
          <SectionDetail
            lang={lang}
            title={t.sections[openSection].title}
            tint={SECTION_ACCENTS[openSection].tint}
            signals={sectionData(openSection).signals}
            quotes={sectionData(openSection).quotes}
            news={sectionData(openSection).news}
            labels={live}
            search={
              openSection === 'figures'
                ? {
                    query: figureQuery,
                    setQuery: setFigureQuery,
                    onSearch: searchFigure,
                    loading: figureLoading,
                    placeholder: live.searchPlaceholder,
                    hint: live.searchHint,
                    notice: figureNotice,
                  }
                : openSection === 'realEstate'
                  ? {
                      query: realEstateQuery,
                      setQuery: setRealEstateQuery,
                      onSearch: searchRealEstate,
                      loading: realEstateLoading,
                      placeholder: live.cityPlaceholder,
                      hint: live.cityHint,
                      notice: realEstateNotice,
                    }
                  : undefined
            }
            onClose={() => setOpenSection(null)}
          />
        )}
      </div>
    </AppShell>
  );
}
