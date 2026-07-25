'use client';

import { useEffect, useState } from 'react';
import { useQueuedEffect } from '@/lib/use-queued-effect';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { localeFontFamily } from '@/lib/brand-theme';
import { HOME_LANGS } from '@/lib/home-i18n';
import { loadAppLang, saveAppLang } from '@/lib/calendar-preferences';
import type { AppLang } from '@/lib/app-settings';
import { loadBirthProfile } from '@/lib/birth-profile';
import { fetchNatalChart, type ChartPlanetBody } from '@/lib/chart-api';
import { loadTier, type MembershipTier } from '@/lib/membership';
import {
  fetchVaultBestCountriesReading,
  fetchVaultBusinessGeographyReading,
  fetchVaultDateOutfitReading,
  fetchVaultCheatingRadarReading,
  fetchVaultCompatibilityReading,
  fetchVaultPartnerProfileReading,
  fetchVaultCommunicationRiskReading,
  fetchVaultTrustPatternsReading,
  fetchVaultGhostDaysReading,
  fetchVaultHotAttractionDaysReading,
  fetchVaultLiveReelTimeReading,
  fetchVaultMarsReading,
  fetchVaultMoneyAskDaysReading,
  fetchVaultTodaysColorReading,
  fetchVaultTodaysPerfumeReading,
  fetchVaultYesDayReading,
  type VaultReadingLayer,
} from '@/lib/vault-reading';

const READING_UI: Record<
  AppLang,
  {
    liveLabel: string;
    executive: string;
    strategic: string;
    technical: string;
    loading: string;
    needProfile: string;
    goProfile: string;
    apiError: string;
  }
> = {
  en: {
    liveLabel: 'Your reading',
    executive: 'In one line',
    strategic: 'Strategy',
    technical: 'Chart facts',
    loading: 'Reading your chart…',
    needProfile:
      'Save your birth date, time and city in Profile — then this reading is built from your chart.',
    goProfile: 'Go to Profile',
    apiError: 'Could not reach METIORO. Is the API running on port 8000?',
  },
  fa: {
    liveLabel: 'خوانش تو',
    executive: 'یک خط',
    strategic: 'استراتژی',
    technical: 'حقایق چارت',
    loading: 'در حال خواندن چارت…',
    needProfile:
      'تاریخ، ساعت و شهر تولد رو در پروفایل ذخیره کن — بعد این خوانش از چارتت ساخته می‌شه.',
    goProfile: 'رفتن به پروفایل',
    apiError: 'به سرور وصل نشد. API روی پورت ۸۰۰۰ روشن هست؟',
  },
  ru: {
    liveLabel: 'Ваш разбор',
    executive: 'Одной строкой',
    strategic: 'Стратегия',
    technical: 'Факты карты',
    loading: 'Читаем карту…',
    needProfile:
      'Сохраните дату, время и город в Профиле — тогда разбор строится по вашей карте.',
    goProfile: 'В профиль',
    apiError: 'Нет связи с API. Запущен ли сервер на порту 8000?',
  },
  ar: {
    liveLabel: 'قراءتكِ',
    executive: 'سطر واحد',
    strategic: 'استراتيجية',
    technical: 'حقائق الخريطة',
    loading: 'نقرأ خريطتكِ…',
    needProfile:
      'احفظي تاريخ الميلاد والوقت والمدينة في الملف — ثم يُبنى هذا التحليل من خريطتكِ.',
    goProfile: 'إلى الملف',
    apiError: 'تعذّر الاتصال. هل يعمل الخادم على المنفذ 8000؟',
  },
};

const PREVIEW_LOCK_LANGS: Record<
  AppLang,
  {
    sampleLabel: string;
    teaser: string;
    unlock: string;
    premium: string;
    expand: string;
    collapse: string;
    unlockedBadge: string;
    unlockedNote: string;
    comingSoon: string;
  }
> = {
  en: {
    sampleLabel: 'Sample reading',
    teaser:
      'A live, personal reading flows here once Premium is on — pulled from your birth chart, today’s sky, and your cycle rhythm.',
    unlock: 'Unlock full reading',
    premium: 'Coming Soon',
    expand: 'Open',
    collapse: 'Close',
    unlockedBadge: 'Unlocked',
    unlockedNote: 'Unlocked with your membership — your live personal reading activates as each tool ships.',
    comingSoon: 'Coming Soon',
  },
  ru: {
    sampleLabel: 'Пример разбора',
    teaser:
      'Здесь появится живой персональный разбор после активации Премиум — из карты рождения, неба дня и ритма цикла.',
    unlock: 'Открыть полный разбор',
    premium: 'Скоро',
    expand: 'Открыть',
    collapse: 'Закрыть',
    unlockedBadge: 'Открыто',
    unlockedNote: 'Открыто по подписке — живой персональный разбор появится по мере выхода инструментов.',
    comingSoon: 'Скоро',
  },
  fa: {
    sampleLabel: 'نمونه خوانش',
    teaser:
      'با فعال شدن پریمیوم اینجا یه خوانش زنده و شخصی می‌بینی — از چارت تولدت، آسمان امروز و ریتم چرخه‌ات.',
    unlock: 'باز کردن خوانش کامل',
    premium: 'به‌زودی',
    expand: 'باز کن',
    collapse: 'ببند',
    unlockedBadge: 'باز شد',
    unlockedNote: 'با اشتراکت باز شد — خوانش زنده‌ی شخصی با آماده‌شدن هر ابزار فعال می‌شه.',
    comingSoon: 'به‌زودی',
  },
  ar: {
    sampleLabel: 'قراءة تجريبية',
    teaser:
      'ستظهر قراءة شخصية حيّة هنا عند تفعيل البريميوم — من خريطة ميلادك وسماء اليوم وإيقاع دورتك.',
    unlock: 'افتحي القراءة الكاملة',
    premium: 'قريباً',
    expand: 'افتح',
    collapse: 'إغلاق',
    unlockedBadge: 'مفتوح',
    unlockedNote: 'مفتوح باشتراكك — تُفعّل قراءتك الشخصية الحيّة مع إطلاق كل أداة.',
    comingSoon: 'قريباً',
  },
};

type VaultSectionKey =
  | 'sensuality'
  | 'cycle'
  | 'provider'
  | 'shadow'
  | 'look'
  | 'power'
  | 'lounge';

/** Vault item index → live API key (same order as section.items). */
const LIVE_ITEM_API: Partial<Record<VaultSectionKey, string[]>> = {
  sensuality: ['mars'],
  // Power Calendar: Heat · Money · Ghost · Yes
  power: ['hot', 'money', 'ghost', 'yes'],
  // Style Timing: Color · Perfume · Post Time · Date Outfit
  look: ['color', 'perfume', 'reel', 'outfit'],
  // The Provider: Business Geography · Best Countries · Partner Profile · Compatibility
  provider: ['jupiter', 'countries', 'partner', 'compatibility'],
  // Shadow Room: Cheating Radar · Trust Patterns · Communication Risk · …
  shadow: ['radar', 'trust', 'communication', ''],
};

const LIVE_READING_KEYS = new Set([
  'mars',
  'ghost',
  'hot',
  'money',
  'yes',
  'color',
  'perfume',
  'reel',
  'outfit',
  'countries',
  'jupiter',
  'partner',
  'compatibility',
  'radar',
  'trust',
  'communication',
]);

const VALID: VaultSectionKey[] = [
  'sensuality',
  'cycle',
  'provider',
  'shadow',
  'look',
  'power',
  'lounge',
];

const SECTION_LANGS: Record<
  AppLang,
  Record<
    VaultSectionKey,
    {
      title: string;
      sub: string;
      intro: string;
      items: { label: string; hint: string }[];
      coming: string;
    }
  > & {
    back: string;
    vaultHome: string;
    previewNote: string;
  }
> = {
  en: {
    back: '← Back to Vault',
    vaultHome: 'The Vault',
    previewNote: 'Preview mode — full tools unlock with Premium.',
    sensuality: {
      title: 'Sensuality',
      sub: 'Desire · Fantasy · Magnetism',
      intro:
        'Read the geometry of your desire, fantasy, and magnetism — and when your appeal peaks today.',
      items: [
        { label: 'My Desire', hint: 'What kind of men you are drawn to' },
        { label: 'Deep Fantasies', hint: 'Hidden hunger and shadow desire' },
        { label: 'Hidden Magnetism', hint: 'Seduction you don’t announce' },
        { label: 'Sex Appeal Today', hint: 'Peak hours for attraction' },
      ],
      coming: 'Coming soon — connects to your birth profile.',
    },
    cycle: {
      title: 'Body & Cycle',
      sub: 'Period · Ovulation · Hormones',
      intro:
        'Sync your cycle to the sky. Know your peak, dip, and fertile window — day by day.',
      items: [
        { label: 'Period Sync', hint: 'Sky rhythm vs your cycle' },
        { label: 'Ovulation Peak', hint: 'Peak desire and fertility window' },
        { label: 'Hormone Calendar', hint: 'Weekly energy rhythm' },
        { label: 'PMS Warning', hint: 'Days to protect your energy' },
      ],
      coming: 'Coming soon — cycle tracking with sky rhythm.',
    },
    provider: {
      title: 'The Provider',
      sub: 'Wealth · Love Map',
      intro:
        'Where on Earth your fortune rises. What partner your chart calls. Your luckiest places.',
      items: [
        { label: 'Wealth Partner', hint: 'Future partner profile and money' },
        { label: 'Love Lines Map', hint: 'Best countries and nationalities' },
        { label: 'Partner Profile', hint: 'Ideal traits and compatibility patterns' },
        { label: 'Compatibility', hint: 'Emotional, chemistry, and stability scores' },
      ],
      coming: 'Coming soon — place maps and partner timing.',
    },
    shadow: {
      title: 'Shadow Room',
      sub: 'Honesty · Loyalty · Truth',
      intro:
        'Patterns of secrecy and trust in any chart. We show signals — never verdicts.',
      items: [
        { label: 'Cheating Radar', hint: 'Signals to verify — never verdicts' },
        { label: 'Trust Patterns', hint: 'Building, pressure, repair — not verdicts' },
        { label: 'Communication Risk', hint: 'Clarity, reactivity, escalation — not verdicts' },
        { label: 'Safe Secret Timing', hint: 'Low-exposure days' },
      ],
      coming: 'Coming soon — timing tools. Educational only.',
    },
    look: {
      title: 'Style Timing',
      sub: 'Color · Scent · Style',
      intro:
        'What to wear, smell, and post today so you hit maximum attraction in real life and on camera.',
      items: [
        { label: "Today's Color", hint: 'Dress code for today' },
        { label: "Today's Perfume", hint: 'Soft vs deep scent notes' },
        { label: 'Best Post Time', hint: 'Best hour to post' },
        { label: 'Date Outfit', hint: 'What pulls him tonight' },
      ],
      coming: 'Coming soon — daily dress code.',
    },
    power: {
      title: 'Power Calendar',
      sub: 'Sex · Money · Distance · Yes-days',
      intro:
        'Heat days, money days, distance days, and yes-days — the rhythm of attraction mapped.',
      items: [
        { label: 'Heat Days', hint: 'Peak chemistry windows' },
        { label: 'Money Days', hint: 'Best days to ask' },
        { label: 'Ghost Days', hint: 'Strategic distance' },
        { label: 'Yes Day', hint: 'Big asks and proposals' },
      ],
      coming: 'Coming soon — personal power calendar.',
    },
    lounge: {
      title: 'Pink Lounge',
      sub: 'Verified · Anonymous · Private',
      intro:
        'A room only verified members enter. Aliases only. End-to-end encrypted.',
      items: [
        { label: 'Secret Circles', hint: 'Topic rooms by theme' },
        { label: 'Ask Julia (anon)', hint: 'One question, no name' },
        { label: 'Verified Queens', hint: 'Badge after light check' },
        { label: 'Leave No Trace', hint: 'One-tap wipe' },
      ],
      coming: 'Coming soon — chat and verification.',
    },
  },
  ru: {
    back: '← Назад в Хранилище',
    vaultHome: 'Хранилище',
    previewNote: 'Режим превью — полные инструменты с Премиум.',
    sensuality: {
      title: 'Чувственность',
      sub: 'Желание · Фантазия · Магнетизм',
      intro: 'Геометрия желания, фантазии и магнетизма — и часы пика притяжения.',
      items: [
        { label: 'Моё желание', hint: 'К каким мужчинам тянет' },
        { label: 'Глубокие фантазии', hint: 'Скрытый голод и тень желания' },
        { label: 'Скрытый магнетизм', hint: 'Соблазн без объявления' },
        { label: 'Притяжение сегодня', hint: 'Пиковые часы' },
      ],
      coming: 'Скоро — связь с картой рождения.',
    },
    cycle: {
      title: 'Тело и цикл',
      sub: 'Цикл · Овуляция · Гормоны',
      intro: 'Синхронизация цикла с небом — день за днём.',
      items: [
        { label: 'Синхрон с циклом', hint: 'Ритм неба и цикл' },
        { label: 'Пик овуляции', hint: 'Окно желания' },
        { label: 'Календарь гормонов', hint: 'Ритм недели' },
        { label: 'Предупреждение ПМС', hint: 'Дни беречь силы' },
      ],
      coming: 'Скоро — трекер и ритм неба.',
    },
    provider: {
      title: 'Покровитель',
      sub: 'Богатство · Карта любви',
      intro: 'Где растёт богатство и какой партнёр зовёт карта.',
      items: [
        { label: 'Партнёр и богатство', hint: 'Партнёр и деньги' },
        { label: 'Карта любви', hint: 'Страны и национальности' },
        { label: 'Профиль партнёра', hint: 'Черты и паттерны совместимости' },
        { label: 'Совместимость', hint: 'Эмоции, химия и стабильность' },
      ],
      coming: 'Скоро — карты мест и тайминг партнёра.',
    },
    shadow: {
      title: 'Теневая комната',
      sub: 'Честность · Верность',
      intro: 'Сигналы скрытности и доверия — не приговоры.',
      items: [
        { label: 'Радар верности', hint: 'Риски месяца' },
        { label: 'Паттерны доверия', hint: 'Строительство, давление, ремонт — не приговоры' },
        { label: 'Риск общения', hint: 'Ясность, реактивность, эскалация — не приговоры' },
        { label: 'Безопасные дни', hint: 'Низкая видимость' },
      ],
      coming: 'Скоро — тайминг. Только обучение.',
    },
    look: {
      title: 'Стиль и тайминг',
      sub: 'Цвет · Аромат · Стиль',
      intro: 'Что надеть и когда постить для максимального эффекта.',
      items: [
        { label: 'Цвет дня', hint: 'Код стиля на сегодня' },
        { label: 'Аромат дня', hint: 'Мягкие и глубокие ноты' },
        { label: 'Время лайва', hint: 'Лучший час' },
        { label: 'Образ на свидание', hint: 'Вечером' },
      ],
      coming: 'Скоро — ежедневный код стиля.',
    },
    power: {
      title: 'Календарь силы',
      sub: 'Секс · Деньги · Дистанция',
      intro: 'Горячие дни, дни денег, дни тишины и дни «да».',
      items: [
        { label: 'Горячие дни', hint: 'Окна жара' },
        { label: 'Дни денег', hint: 'Лучшие дни спросить' },
        { label: 'Дни тишины', hint: 'Дистанция' },
        { label: 'День «да»', hint: 'Большие просьбы' },
      ],
      coming: 'Скоро — персональный календарь силы.',
    },
    lounge: {
      title: 'Pink Lounge',
      sub: 'Проверено · Анонимно',
      intro: 'Комната только для верифицированных. Псевдонимы. Шифрование.',
      items: [
        { label: 'Секретные круги', hint: 'По темам' },
        { label: 'Спросить Юлию', hint: 'Без имени' },
        { label: 'Verified Queens', hint: 'После проверки' },
        { label: 'Без следа', hint: 'Стереть одним касанием' },
      ],
      coming: 'Скоро — чат и проверка.',
    },
  },
  fa: {
    back: '→ بازگشت به محرمانه',
    vaultHome: 'محرمانه',
    previewNote: 'حالت پیش‌نمایش — ابزار کامل با پریمیوم.',
    sensuality: {
      title: 'شهوت و جذابیت',
      sub: 'میل · فانتزی · مگنتیسم',
      intro: 'هندسه میل، فانتزی و مگنتیسم — و ساعت‌های اوج جذابیت امروز.',
      items: [
        { label: 'میل من', hint: 'کشش به چه نوع مردانی' },
        { label: 'فانتزی‌های عمیق', hint: 'گرسنگی پنهان و سایه میل' },
        { label: 'مگنتیسم پنهان', hint: 'جذبی که اعلام نمی‌کنی' },
        { label: 'جذابیت امروز', hint: 'ساعات اوج' },
      ],
      coming: 'به‌زودی — اتصال به پروفایل تولد.',
    },
    cycle: {
      title: 'بدن و چرخه',
      sub: 'پریود · تخمک‌گذاری · هورمون',
      intro: 'هم‌گام‌سازی چرخه با آسمان — روز به روز.',
      items: [
        { label: 'هم‌گام پریود', hint: 'ریتم آسمان و چرخه' },
        { label: 'اوج تخمک‌گذاری', hint: 'پنجره شهوت' },
        { label: 'تقویم هورمون', hint: 'ریتم هفتگی' },
        { label: 'هشدار PMS', hint: 'روزهای محافظت انرژی' },
      ],
      coming: 'به‌زودی — ترکر با ریتم آسمان.',
    },
    provider: {
      title: 'حامی (همسر آینده)',
      sub: 'ثروت · نقشه عشق',
      intro: 'جایی که ثروت اوج می‌گیرد و نوع شریک در چارت.',
      items: [
        { label: 'شریک و ثروت', hint: 'شریک و پول' },
        { label: 'نقشه عشق', hint: 'کشور و ملیت' },
        { label: 'پروفایل شریک', hint: 'ویژگی ایده‌آل و الگوهای هم‌خوانی' },
        { label: 'هم‌خوانی', hint: 'عاطفی، شیمی و ثبات' },
      ],
      coming: 'به‌زودی — نقشه مکان و تایمینگ شریک.',
    },
    shadow: {
      title: 'اتاق سایه',
      sub: 'صداقت · وفاداری',
      intro: 'نشانه‌های پنهان‌کاری و اعتماد — نه حکم.',
      items: [
        { label: 'رادار خیانت', hint: 'پنجره ریسک' },
        { label: 'الگوهای اعتماد', hint: 'ساخت، فشار، ترمیم — نه حکم' },
        { label: 'ریسک ارتباط', hint: 'وضوح، واکنش، تشدید — نه حکم' },
        { label: 'روزهای امن', hint: 'لو نرفتن' },
      ],
      coming: 'به‌زودی — تایمینگ. فقط آموزشی.',
    },
    look: {
      title: 'زمان‌بندی استایل',
      sub: 'رنگ · عطر · استایل',
      intro: 'امروز چه بپوشی و کی پست بذاری برای بیشترین جذابیت.',
      items: [
        { label: 'رنگ امروز', hint: 'کد لباس امروز' },
        { label: 'عطر امروز', hint: 'نت‌های نرم در برابر عمیق' },
        { label: 'ساعت لایو', hint: 'بهترین پست' },
        { label: 'استایل قرار', hint: 'امشب' },
      ],
      coming: 'به‌زودی — کد لباس روزانه.',
    },
    power: {
      title: 'تقویم قدرت',
      sub: 'سکس · پول · دوری · بله',
      intro: 'روزهای داغ، روز پول، روز سکوت و روز «بله».',
      items: [
        { label: 'روزهای داغ', hint: 'پنجره‌های حرارت' },
        { label: 'روز پول', hint: 'بهترین روز درخواست' },
        { label: 'روز غیبت', hint: 'دوری استراتژیک' },
        { label: 'روز بله', hint: 'درخواست بزرگ' },
      ],
      coming: 'به‌زودی — تقویم قدرت شخصی.',
    },
    lounge: {
      title: 'لانژ صورتی',
      sub: 'تأییدشده · ناشناس',
      intro: 'اتاق فقط برای اعضای تأییدشده. نام مستعار. رمزنگاری.',
      items: [
        { label: 'حلقه‌های سکرت', hint: 'بر اساس موضوع' },
        { label: 'سوال از جولیا', hint: 'بدون نام' },
        { label: 'ملکه تأییدشده', hint: 'بعد از چک سبک' },
        { label: 'بدون ردپا', hint: 'پاک‌سازی یک کلیک' },
      ],
      coming: 'به‌زودی — چت و تأیید.',
    },
  },
  ar: {
    back: '← العودة إلى الخزانة',
    vaultHome: 'الخزانة',
    previewNote: 'وضع المعاينة — الأدوات الكاملة مع البريميوم.',
    sensuality: {
      title: 'الحسّية',
      sub: 'رغبة · خيال · جاذبية',
      intro: 'هندسة الرغبة والخيال والجاذبية — وساعات الذروة اليوم.',
      items: [
        { label: 'رغبتي', hint: 'نوع الرجال الذين تجذبينهم' },
        { label: 'خيالات عميقة', hint: 'جوع خفي ورغبة ظلّية' },
        { label: 'جاذبية خفية', hint: 'إغراء بلا إعلان' },
        { label: 'جاذبية اليوم', hint: 'ساعات الذروة' },
      ],
      coming: 'قريباً — ربط بملف الميلاد.',
    },
    cycle: {
      title: 'الجسد والدورة',
      sub: 'الدورة · الإباضة',
      intro: 'مزامنة الدورة مع السماء — يوماً بيوم.',
      items: [
        { label: 'مزامنة الدورة', hint: 'إيقاع السماء والدورة' },
        { label: 'ذروة الإباضة', hint: 'نافذة الرغبة' },
        { label: 'تقويم الهرمون', hint: 'إيقاع الأسبوع' },
        { label: 'تحذير PMS', hint: 'أيام حماية الطاقة' },
      ],
      coming: 'قريباً — تتبّع مع إيقاع السماء.',
    },
    provider: {
      title: 'العائل',
      sub: 'ثروة · خريطة الحب',
      intro: 'أين يرتفع حظّك ونوع الشريك في خريطتك.',
      items: [
        { label: 'الشريك والثروة', hint: 'الشريك والمال' },
        { label: 'خريطة الحب', hint: 'البلدان' },
        { label: 'ملف الشريك', hint: 'سمات مثالية وأنماط توافق' },
        { label: 'التوافق', hint: 'عاطفي وكيمياء واستقرار' },
      ],
      coming: 'قريباً — خرائط الأماكن وتوقيت الشريك.',
    },
    shadow: {
      title: 'غرفة الظل',
      sub: 'الصدق · الولاء',
      intro: 'إشارات الكتمان والثقة — لا أحكاماً.',
      items: [
        { label: 'رادار الخيانة', hint: 'نوافذ الخطر' },
        { label: 'أنماط الثقة', hint: 'بناء وضغط وإصلاح — لا أحكام' },
        { label: 'مخاطر التواصل', hint: 'وضوح وردة فعل وتصعيد — لا أحكام' },
        { label: 'أيام آمنة', hint: 'انكشاف منخفض' },
      ],
      coming: 'قريباً — توقيت. تعليمي فقط.',
    },
    look: {
      title: 'توقيت الأسلوب',
      sub: 'لون · عطر · أسلوب',
      intro: 'ماذا ترتدين ومتى تنشرين لأقصى جاذبية.',
      items: [
        { label: 'لون اليوم', hint: 'كود الإطلالة اليوم' },
        { label: 'عطر اليوم', hint: 'نغمات ناعمة مقابل عميقة' },
        { label: 'وقت البث', hint: 'أفضل ساعة' },
        { label: 'إطلالة الموعد', hint: 'الليلة' },
      ],
      coming: 'قريباً — كود إطلالة يومي.',
    },
    power: {
      title: 'تقويم القوة',
      sub: 'الجنس · المال · المسافة',
      intro: 'أيام حارّة، أيام مال، أيام صمت، وأيام «نعم».',
      items: [
        { label: 'أيام حارّة', hint: 'نوافذ الذروة' },
        { label: 'أيام المال', hint: 'أفضل أيام الطلب' },
        { label: 'أيام الغياب', hint: 'مسافة استراتيجية' },
        { label: 'يوم نعم', hint: 'طلبات كبيرة' },
      ],
      coming: 'قريباً — تقويم قوة شخصي.',
    },
    lounge: {
      title: 'صالون الوردي',
      sub: 'موثّق · مجهول',
      intro: 'غرفة للأعضاء الموثّقين فقط. أسماء مستعارة. تشفير.',
      items: [
        { label: 'دوائر سرّية', hint: 'حسب الموضوع' },
        { label: 'اسألي جوليا', hint: 'بدون اسم' },
        { label: 'ملكات موثّقات', hint: 'بعد تحقّق خفيف' },
        { label: 'بلا أثر', hint: 'مسح بضغطة' },
      ],
      coming: 'قريباً — دردشة وتحقّق.',
    },
  },
};

function isValidSection(s: string | undefined): s is VaultSectionKey {
  return !!s && VALID.includes(s as VaultSectionKey);
}

const SIGN_NAMES: Record<AppLang, string[]> = {
  en: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
  ru: ['Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева', 'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы'],
  fa: ['حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله', 'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت'],
  ar: ['الحمل', 'الثور', 'الجوزاء', 'السرطان', 'الأسد', 'العذراء', 'الميزان', 'العقرب', 'القوس', 'الجدي', 'الدلو', 'الحوت'],
};

type PersonalizedBlock = { label: string; text: string };

type PersonalizedReading = {
  headline: string;
  blocks: PersonalizedBlock[];
};

function signLabel(lang: AppLang, sign?: number): string {
  if (sign == null || sign < 1 || sign > 12) return '—';
  return SIGN_NAMES[lang][sign - 1];
}

function planetLine(lang: AppLang, body?: ChartPlanetBody): string {
  if (!body?.sign) return '';
  const sign = signLabel(lang, body.sign);
  const deg = body.degree != null ? ` ${body.degree.toFixed(1)}°` : '';
  const house = body.house ? ` · H${body.house}` : '';
  const rx = body.retrograde ? ' ℞' : '';
  return `${sign}${deg}${house}${rx}`;
}

function buildLoungeReading(
  itemIdx: number,
  planets: Record<string, ChartPlanetBody>,
  lang: AppLang,
): PersonalizedReading {
  const moon = planets.moon;
  const venus = planets.venus;
  const mars = planets.mars;
  const sun = planets.sun;
  const pluto = planets.pluto;

  if (itemIdx === 0) {
    const circles: Record<AppLang, PersonalizedReading> = {
      en: {
        headline: 'Your secret circles — matched from your chart',
        blocks: [
          { label: 'Moon circle', text: moon ? `Emotional core · Moon in ${planetLine(lang, moon)}` : 'Moon data not in chart response.' },
          { label: 'Venus circle', text: venus ? `Desire & taste · Venus in ${planetLine(lang, venus)}` : 'Venus data not in chart response.' },
          { label: 'Mars circle', text: mars ? `Drive & pursuit · Mars in ${planetLine(lang, mars)}` : 'Mars data not in chart response.' },
        ],
      },
      ru: {
        headline: 'Ваши секретные круги — по карте',
        blocks: [
          { label: 'Круг Луны', text: moon ? `Эмоциональное ядро · Луна в ${planetLine(lang, moon)}` : 'Данные Луны нет в ответе.' },
          { label: 'Круг Венеры', text: venus ? `Желание и вкус · Венера в ${planetLine(lang, venus)}` : 'Данных Венеры нет.' },
          { label: 'Круг Марса', text: mars ? `Импульс · Марс в ${planetLine(lang, mars)}` : 'Данных Марса нет.' },
        ],
      },
      fa: {
        headline: 'حلقه‌های سکرت تو — از روی چارت',
        blocks: [
          { label: 'حلقه ماه', text: moon ? `هسته احساسی · ماه در ${planetLine(lang, moon)}` : 'داده ماه در پاسخ نیست.' },
          { label: 'حلقه زهره', text: venus ? `میل و سلیقه · زهره در ${planetLine(lang, venus)}` : 'داده زهره در پاسخ نیست.' },
          { label: 'حلقه مریخ', text: mars ? `انگیزه · مریخ در ${planetLine(lang, mars)}` : 'داده مریخ در پاسخ نیست.' },
        ],
      },
      ar: {
        headline: 'دوائرك السرّية — من خريطتك',
        blocks: [
          { label: 'دائرة القمر', text: moon ? `النواة العاطفية · القمر في ${planetLine(lang, moon)}` : 'لا بيانات للقمر.' },
          { label: 'دائرة الزهرة', text: venus ? `الرغبة والذوق · الزهرة في ${planetLine(lang, venus)}` : 'لا بيانات للزهرة.' },
          { label: 'دائرة المريخ', text: mars ? `الدافع · المريخ في ${planetLine(lang, mars)}` : 'لا بيانات للمريخ.' },
        ],
      },
    };
    return circles[lang];
  }

  if (itemIdx === 1) {
    const julia: Record<AppLang, PersonalizedReading> = {
      en: {
        headline: 'Julia (anonymous) — one line from your chart',
        blocks: [
          {
            label: 'Your question channel',
            text: moon && venus
              ? `Moon in ${signLabel(lang, moon.sign)} (H${moon.house ?? '?'}) + Venus in ${signLabel(lang, venus.sign)} — you attract through ${signLabel(lang, venus.sign)} warmth with ${signLabel(lang, moon.sign)} emotional depth. Ask without naming yourself; Julia reads this geometry only.`
              : 'Save birth data in Profile and regenerate — Julia needs Moon + Venus from your chart.',
          },
        ],
      },
      ru: {
        headline: 'Юлия (анонимно) — одна строка по карте',
        blocks: [
          {
            label: 'Канал вопроса',
            text: moon && venus
              ? `Луна в ${signLabel(lang, moon.sign)} (д.${moon.house ?? '?'}) + Венера в ${signLabel(lang, venus.sign)} — притяжение через ${signLabel(lang, venus.sign)} с эмоциональной глубиной ${signLabel(lang, moon.sign)}.`
              : 'Сохраните данные рождения в Профиле.',
          },
        ],
      },
      fa: {
        headline: 'جولیا (ناشناس) — یک خط از چارت',
        blocks: [
          {
            label: 'کانال سوال',
            text: moon && venus
              ? `ماه در ${signLabel(lang, moon.sign)} (خانه ${moon.house ?? '?'}) + زهره در ${signLabel(lang, venus.sign)} — جذب از مسیر ${signLabel(lang, venus.sign)} با عمق احساسی ${signLabel(lang, moon.sign)}.`
              : 'اطلاعات تولد را در پروفایل ذخیره کن.',
          },
        ],
      },
      ar: {
        headline: 'جوليا (مجهول) — سطر من خريطتك',
        blocks: [
          {
            label: 'قناة السؤال',
            text: moon && venus
              ? `القمر في ${signLabel(lang, moon.sign)} (البيت ${moon.house ?? '?'}) + الزهرة في ${signLabel(lang, venus.sign)} — جاذبية عبر ${signLabel(lang, venus.sign)} بعمق ${signLabel(lang, moon.sign)}.`
              : 'احفظي بيانات الميلاد في الملف.',
          },
        ],
      },
    };
    return julia[lang];
  }

  if (itemIdx === 2) {
    const queens: Record<AppLang, PersonalizedReading> = {
      en: {
        headline: 'Verified Queens — your insight badge',
        blocks: [
          { label: 'Your Sun badge', text: sun ? `${signLabel(lang, sun.sign)} Sun · ${planetLine(lang, sun)}` : 'Sun placement not in chart response.' },
          { label: 'Verification step 1', text: 'Light ID check — alias only, no real name in lounge.' },
          { label: 'Verification step 2', text: 'Premium membership active — badge shows on your alias.' },
        ],
      },
      ru: {
        headline: 'Verified Queens — ваш значок инсайта',
        blocks: [
          { label: 'Значок Солнца', text: sun ? `Солнце ${signLabel(lang, sun.sign)} · ${planetLine(lang, sun)}` : 'Солнце не в ответе.' },
          { label: 'Шаг 1', text: 'Лёгкая проверка — только псевдоним.' },
          { label: 'Шаг 2', text: 'Активная подписка Премиум — значок у псевдонима.' },
        ],
      },
      fa: {
        headline: 'ملکه تأییدشده — نشان بینش تو',
        blocks: [
          { label: 'نشان خورشید', text: sun ? `خورشید ${signLabel(lang, sun.sign)} · ${planetLine(lang, sun)}` : 'خورشید در پاسخ نیست.' },
          { label: 'مرحله ۱', text: 'چک سبک — فقط نام مستعار در لانژ.' },
          { label: 'مرحله ۲', text: 'اشتراک پریمیوم فعال — نشان روی نام مستعار.' },
        ],
      },
      ar: {
        headline: 'ملكات موثّقات — شارة الرؤية الخاصة بك',
        blocks: [
          { label: 'شارة الشمس', text: sun ? `شمس ${signLabel(lang, sun.sign)} · ${planetLine(lang, sun)}` : 'لا بيانات للشمس.' },
          { label: 'الخطوة 1', text: 'تحقّق خفيف — اسم مستعار فقط.' },
          { label: 'الخطوة 2', text: 'اشتراك بريميوم نشط — الشارة على الاسم المستعار.' },
        ],
      },
    };
    return queens[lang];
  }

  const trace: Record<AppLang, PersonalizedReading> = {
    en: {
      headline: 'Leave no trace — privacy from your chart',
      blocks: [
        {
          label: 'Shadow signal',
          text: mars && (mars.house === 8 || mars.house === 12)
            ? `Mars in house ${mars.house} — you prefer discretion; one-tap wipe clears this session locally.`
            : pluto
              ? `Pluto in ${signLabel(lang, pluto.sign)} (H${pluto.house ?? '?'}) — deep privacy instinct; session data stays on this device until you wipe.`
              : 'Session stays on this device until you clear it below.',
        },
        { label: 'What we store', text: 'Lounge aliases and readings stay on this device until chat ships.' },
        { label: 'Wipe this session', text: 'Tap below to clear vault session keys from this browser.' },
      ],
    },
    ru: {
      headline: 'Без следа — приватность',
      blocks: [
        {
          label: 'Теневой сигнал',
          text: mars && (mars.house === 8 || mars.house === 12)
            ? `Марс в ${mars.house} доме — дискретность; очистка сессии локально.`
            : pluto
              ? `Плутон в ${signLabel(lang, pluto.sign)} — инстинкт приватности.`
              : 'Сессия только на этом устройстве.',
        },
        { label: 'Хранение', text: 'Пока данные не уходят на сервер — чат скоро.' },
        { label: 'Стереть сессию', text: 'Кнопка ниже очищает ключи vault в браузере.' },
      ],
    },
    fa: {
      headline: 'بدون ردپا — حریم خصوصی',
      blocks: [
        {
          label: 'سیگنال سایه',
          text: mars && (mars.house === 8 || mars.house === 12)
            ? `مریخ در خانه ${mars.house} — تمایل به محرمانگی؛ پاک‌سازی محلی.`
            : pluto
              ? `پلوتو در ${signLabel(lang, pluto.sign)} — غریزه حریم خصوصی.`
              : 'نشست فقط روی این دستگاه.',
        },
        { label: 'ذخیره‌سازی', text: 'فعلاً داده به سرور نمی‌رود — چت به‌زودی.' },
        { label: 'پاک‌سازی', text: 'دکمه پایین کلیدهای vault این مرورگر را پاک می‌کند.' },
      ],
    },
    ar: {
      headline: 'بلا أثر — الخصوصية',
      blocks: [
        {
          label: 'إشارة الظل',
          text: mars && (mars.house === 8 || mars.house === 12)
            ? `المريخ في البيت ${mars.house} — تفضيل التكتم.`
            : pluto
              ? `بلوتو في ${signLabel(lang, pluto.sign)} — غريزة الخصوصية.`
              : 'الجلسة على هذا الجهاز فقط.',
        },
        { label: 'التخزين', text: 'لا رفع للخادم حالياً — الدردشة قريباً.' },
        { label: 'مسح الجلسة', text: 'الزر أدناه يمسح مفاتيح vault من المتصفح.' },
      ],
    },
  };
  return trace[lang];
}

export default function VaultSectionPage() {
  const params = useParams();
  const raw = typeof params.section === 'string' ? params.section : '';
  const [lang, setLangState] = useState<AppLang>('en');
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [liveReading, setLiveReading] = useState<VaultReadingLayer | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<'needProfile' | 'api' | null>(null);
  const [hasLiveApi, setHasLiveApi] = useState(false);
  const [tier, setTier] = useState<MembershipTier>(() =>
    typeof window !== 'undefined' ? loadTier() : 'free'
  );
  const [personalizedReading, setPersonalizedReading] = useState<PersonalizedReading | null>(null);
  const [personalizedLoading, setPersonalizedLoading] = useState(false);
  const [personalizedError, setPersonalizedError] = useState<'needProfile' | 'api' | null>(null);
  const [wipeToast, setWipeToast] = useState(false);

  useQueuedEffect(() => {
    const stored = loadAppLang();
    if (stored === 'en' || stored === 'ru' || stored === 'fa' || stored === 'ar') {
      setLangState(stored);
    }
  }, []);

  useEffect(() => {
    const onChange = () => setTier(loadTier());
    window.addEventListener('storage', onChange);
    window.addEventListener('planet-life-membership-changed', onChange);
    return () => {
      window.removeEventListener('storage', onChange);
      window.removeEventListener('planet-life-membership-changed', onChange);
    };
  }, []);

  const setLang = (l: AppLang) => {
    setLangState(l);
    saveAppLang(l);
  };

  useQueuedEffect(() => {
    if (!isValidSection(raw) || !openItem) {
      setLiveReading(null);
      setHasLiveApi(false);
      setLiveError(null);
      setLiveLoading(false);
      setPersonalizedReading(null);
      setPersonalizedError(null);
      setPersonalizedLoading(false);
      return;
    }
    const sectionData = SECTION_LANGS[lang][raw];
    const idx = sectionData.items.findIndex((i) => i.label === openItem);
    const apiKey = (LIVE_ITEM_API[raw] ?? [])[idx];
    const isPremium = tier === 'premium' || tier === 'vip';

    setPersonalizedReading(null);
    setPersonalizedError(null);
    setPersonalizedLoading(false);

    if (
      apiKey === 'mars' ||
      apiKey === 'ghost' ||
      apiKey === 'hot' ||
      apiKey === 'money' ||
      apiKey === 'yes' ||
      apiKey === 'color' ||
      apiKey === 'perfume' ||
      apiKey === 'reel' ||
      apiKey === 'outfit' ||
      apiKey === 'countries' ||
      apiKey === 'jupiter' ||
      apiKey === 'partner' ||
      apiKey === 'compatibility' ||
      apiKey === 'radar' ||
      apiKey === 'trust' ||
      apiKey === 'communication'
    ) {
      setHasLiveApi(true);
      const profile = loadBirthProfile();
      if (!profile) {
        setLiveReading(null);
        setLiveError('needProfile');
        setLiveLoading(false);
        return;
      }
      let cancelled = false;
      setLiveLoading(true);
      setLiveError(null);
      setLiveReading(null);
      const fetchReading =
        apiKey === 'ghost'
          ? fetchVaultGhostDaysReading(profile, lang)
          : apiKey === 'hot'
            ? fetchVaultHotAttractionDaysReading(profile, lang)
            : apiKey === 'money'
              ? fetchVaultMoneyAskDaysReading(profile, lang)
              : apiKey === 'yes'
                ? fetchVaultYesDayReading(profile, lang)
                : apiKey === 'color'
                  ? fetchVaultTodaysColorReading(profile, lang)
                  : apiKey === 'perfume'
                    ? fetchVaultTodaysPerfumeReading(profile, lang)
                    : apiKey === 'reel'
                      ? fetchVaultLiveReelTimeReading(profile, lang)
                      : apiKey === 'outfit'
                        ? fetchVaultDateOutfitReading(profile, lang)
                        : apiKey === 'countries'
                          ? fetchVaultBestCountriesReading(profile, lang)
                          : apiKey === 'jupiter'
                            ? fetchVaultBusinessGeographyReading(profile, lang)
                            : apiKey === 'partner'
                              ? fetchVaultPartnerProfileReading(profile, lang)
                              : apiKey === 'compatibility'
                                ? fetchVaultCompatibilityReading(profile, lang)
                                : apiKey === 'radar'
                                  ? fetchVaultCheatingRadarReading(profile, lang)
                                  : apiKey === 'trust'
                                    ? fetchVaultTrustPatternsReading(profile, lang)
                                    : apiKey === 'communication'
                                      ? fetchVaultCommunicationRiskReading(profile, lang)
                                      : fetchVaultMarsReading(profile, lang);
      fetchReading
        .then((res) => {
          if (!cancelled) setLiveReading(res.reading);
        })
        .catch(() => {
          if (!cancelled) {
            setLiveError('api');
            setLiveReading(null);
          }
        })
        .finally(() => {
          if (!cancelled) setLiveLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }

    setHasLiveApi(false);
    setLiveReading(null);
    setLiveError(null);
    setLiveLoading(false);

    if (isPremium && raw === 'lounge' && idx >= 0) {
      const profile = loadBirthProfile();
      if (!profile) {
        setPersonalizedError('needProfile');
        return;
      }
      let cancelled = false;
      setPersonalizedLoading(true);
      fetchNatalChart(profile.birth_date, profile.birth_time, profile.location)
        .then((planets) => {
          if (cancelled) return;
          if (!planets) {
            setPersonalizedError('api');
            return;
          }
          setPersonalizedReading(buildLoungeReading(idx, planets, lang));
        })
        .catch(() => {
          if (!cancelled) setPersonalizedError('api');
        })
        .finally(() => {
          if (!cancelled) setPersonalizedLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }
  }, [openItem, lang, raw, tier]);

  const unlocked = tier === 'premium' || tier === 'vip';
  const t = SECTION_LANGS[lang];
  const rui = READING_UI[lang];
  const dir = HOME_LANGS[lang].dir;
  const fontFamily = localeFontFamily(lang);

  if (!isValidSection(raw)) {
    return (
      <AppShell lang={lang} setLang={setLang} dir={dir} navLabels={HOME_LANGS[lang].nav} fontFamily={fontFamily}>
        <div className="max-w-lg mx-auto px-6 py-12 text-center">
          <p className="fi text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Section not found.
          </p>
          <Link href="/vault" className="fi text-sm mt-4 inline-block" style={{ color: '#D4AF37' }}>
            {t.back}
          </Link>
        </div>
      </AppShell>
    );
  }

  const section = t[raw];

  return (
    <AppShell
      lang={lang}
      setLang={setLang}
      dir={dir}
      navLabels={HOME_LANGS[lang].nav}
      fontFamily={fontFamily}
    >
      <div className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 50% 30% at 50% 0%, rgba(212,175,55,0.12), transparent 70%)',
          }}
        />

        <div className="relative max-w-2xl mx-auto px-6 py-10">
          <Link
            href="/vault"
            className="fi text-xs no-underline inline-block mb-6"
            style={{ color: 'rgba(212,175,55,0.75)' }}
          >
            {t.back}
          </Link>

          <div className="mb-2">
            <span
              className="fi text-[10px] tracking-[0.25em] uppercase"
              style={{ color: 'rgba(212,175,55,0.5)' }}
            >
              {t.vaultHome}
            </span>
          </div>
          <h1
            className="fc text-3xl md:text-4xl mb-2"
            style={{
              background: 'linear-gradient(135deg, #F2CF75, #D4AF37)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {section.title}
          </h1>
          <p className="fi text-xs mb-4" style={{ color: 'rgba(212,175,55,0.55)' }}>
            {section.sub}
          </p>
          <p className="fi text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {section.intro}
          </p>

          <div className="space-y-3 mb-8">
            {section.items.map((item, itemIdx) => {
              const isOpen = openItem === item.label;
              const lock = PREVIEW_LOCK_LANGS[lang];
              const itemApiKey = (LIVE_ITEM_API[raw] ?? [])[itemIdx];
              const showLive =
                isOpen &&
                hasLiveApi &&
                !!itemApiKey &&
                LIVE_READING_KEYS.has(itemApiKey) &&
                openItem === item.label;
              const itemLive =
                (!!itemApiKey && LIVE_READING_KEYS.has(itemApiKey)) ||
                (unlocked && raw === 'lounge');
              const showPersonalized =
                isOpen && unlocked && raw === 'lounge' && !showLive;
              return (
                <div
                  key={item.label}
                  className="rounded-xl overflow-hidden transition-all"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(40,20,40,0.55), rgba(20,14,28,0.55))',
                    border: isOpen
                      ? '1px solid rgba(212,175,55,0.35)'
                      : '1px solid rgba(212,175,55,0.15)',
                    boxShadow: isOpen
                      ? '0 0 28px rgba(212,175,55,0.12)'
                      : 'none',
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenItem(isOpen ? null : item.label)
                    }
                    className="w-full text-left p-4 flex items-start justify-between gap-4 transition-colors"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <div className="flex-1">
                      <div
                        className="fc text-sm mb-1"
                        style={{ color: '#D4AF37' }}
                      >
                        {item.label}
                      </div>
                      <div
                        className="fi text-xs"
                        style={{ color: 'rgba(255,255,255,0.5)' }}
                      >
                        {item.hint}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="fi text-[10px] px-2 py-1 rounded-full"
                        style={{
                          background: itemLive
                            ? 'rgba(34,197,94,0.12)'
                            : 'rgba(212,175,55,0.1)',
                          border: itemLive
                            ? '1px solid rgba(34,197,94,0.35)'
                            : '1px solid rgba(212,175,55,0.2)',
                          color: itemLive
                            ? 'rgba(134,239,172,0.9)'
                            : 'rgba(212,175,55,0.7)',
                        }}
                      >
                        {itemLive ? 'LIVE' : lock.comingSoon}
                      </span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="rgba(212,175,55,0.7)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          transform: isOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.25s',
                        }}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </button>

                  {isOpen && (
                    <div
                      className="px-4 pb-4 pt-2"
                      style={{
                        borderTop: '1px solid rgba(212,175,55,0.1)',
                      }}
                    >
                      {showLive ? (
                        <>
                          <div
                            className="fi text-[10px] tracking-[0.2em] uppercase mb-2"
                            style={{ color: 'rgba(134,239,172,0.75)' }}
                          >
                            {rui.liveLabel}
                          </div>
                          {liveLoading && (
                            <p
                              className="fi text-xs py-4"
                              style={{ color: 'rgba(255,255,255,0.55)' }}
                            >
                              {rui.loading}
                            </p>
                          )}
                          {!liveLoading && liveError === 'needProfile' && (
                            <div className="mb-3">
                              <p
                                className="fi text-xs leading-relaxed mb-3"
                                style={{ color: 'rgba(255,255,255,0.65)' }}
                              >
                                {rui.needProfile}
                              </p>
                              <Link
                                href="/profile"
                                className="fc text-xs tracking-widest px-4 py-2 rounded-lg inline-flex no-underline"
                                style={{
                                  background: 'rgba(212,175,55,0.15)',
                                  border: '1px solid rgba(212,175,55,0.35)',
                                  color: '#F2CF75',
                                }}
                              >
                                {rui.goProfile}
                              </Link>
                            </div>
                          )}
                          {!liveLoading && liveError === 'api' && (
                            <p
                              className="fi text-xs leading-relaxed"
                              style={{ color: 'rgba(248,113,113,0.85)' }}
                            >
                              {rui.apiError}
                            </p>
                          )}
                          {!liveLoading && liveReading && (
                            <div className="space-y-3">
                              {liveReading.headline && (
                                <p
                                  className="fc text-sm leading-snug"
                                  style={{ color: '#F2CF75' }}
                                >
                                  {liveReading.headline}
                                </p>
                              )}
                              {liveReading.intensity && (
                                <span
                                  className="fi text-[10px] px-2 py-0.5 rounded-full inline-block"
                                  style={{
                                    background: 'rgba(212,175,55,0.12)',
                                    border: '1px solid rgba(212,175,55,0.25)',
                                    color: 'rgba(212,175,55,0.85)',
                                  }}
                                >
                                  {liveReading.intensity}
                                </span>
                              )}
                              {[
                                { key: 'executive' as const, label: rui.executive },
                                { key: 'strategic' as const, label: rui.strategic },
                                { key: 'technical' as const, label: rui.technical },
                              ].map(({ key, label }) =>
                                liveReading[key] ? (
                                  <div
                                    key={key}
                                    className="rounded-lg p-3"
                                    style={{
                                      background: 'rgba(0,0,0,0.22)',
                                      border: '1px solid rgba(212,175,55,0.12)',
                                    }}
                                  >
                                    <div
                                      className="fi text-[10px] tracking-[0.15em] uppercase mb-1.5"
                                      style={{ color: 'rgba(212,175,55,0.55)' }}
                                    >
                                      {label}
                                    </div>
                                    <p
                                      className="fi text-xs leading-relaxed whitespace-pre-line"
                                      style={{ color: 'rgba(255,255,255,0.82)' }}
                                    >
                                      {liveReading[key]}
                                    </p>
                                  </div>
                                ) : null,
                              )}
                            </div>
                          )}
                        </>
                      ) : showPersonalized ? (
                        <>
                          <div
                            className="fi text-[10px] tracking-[0.2em] uppercase mb-2"
                            style={{ color: 'rgba(134,239,172,0.75)' }}
                          >
                            {rui.liveLabel}
                          </div>
                          {personalizedLoading && (
                            <p className="fi text-xs py-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
                              {rui.loading}
                            </p>
                          )}
                          {!personalizedLoading && personalizedError === 'needProfile' && (
                            <div className="mb-3">
                              <p className="fi text-xs leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.65)' }}>
                                {rui.needProfile}
                              </p>
                              <Link
                                href="/profile"
                                className="fc text-xs tracking-widest px-4 py-2 rounded-lg inline-flex no-underline"
                                style={{
                                  background: 'rgba(212,175,55,0.15)',
                                  border: '1px solid rgba(212,175,55,0.35)',
                                  color: '#F2CF75',
                                }}
                              >
                                {rui.goProfile}
                              </Link>
                            </div>
                          )}
                          {!personalizedLoading && personalizedError === 'api' && (
                            <p className="fi text-xs leading-relaxed" style={{ color: 'rgba(248,113,113,0.85)' }}>
                              {rui.apiError}
                            </p>
                          )}
                          {!personalizedLoading && personalizedReading && (
                            <div className="space-y-3">
                              <p className="fc text-sm leading-snug" style={{ color: '#F2CF75' }}>
                                {personalizedReading.headline}
                              </p>
                              {personalizedReading.blocks.map((block) => (
                                <div
                                  key={block.label}
                                  className="rounded-lg p-3"
                                  style={{
                                    background: 'rgba(0,0,0,0.22)',
                                    border: '1px solid rgba(212,175,55,0.12)',
                                  }}
                                >
                                  <div
                                    className="fi text-[10px] tracking-[0.15em] uppercase mb-1.5"
                                    style={{ color: 'rgba(212,175,55,0.55)' }}
                                  >
                                    {block.label}
                                  </div>
                                  <p className="fi text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.82)' }}>
                                    {block.text}
                                  </p>
                                </div>
                              ))}
                              {itemIdx === 3 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    ['planet-life-vault-session', 'planet-life-vault-alias'].forEach((k) =>
                                      localStorage.removeItem(k),
                                    );
                                    setWipeToast(true);
                                    window.setTimeout(() => setWipeToast(false), 2000);
                                  }}
                                  className="fc text-xs tracking-widest px-4 py-2 rounded-lg w-full"
                                  style={{
                                    background: 'rgba(212,175,55,0.12)',
                                    border: '1px solid rgba(212,175,55,0.35)',
                                    color: '#F2CF75',
                                    cursor: 'pointer',
                                  }}
                                >
                                  {lang === 'fa' ? 'پاک‌سازی نشست' : lang === 'ru' ? 'Стереть сессию' : lang === 'ar' ? 'مسح الجلسة' : 'Wipe session'}
                                </button>
                              )}
                            </div>
                          )}
                        </>
                      ) : unlocked ? (
                        <>
                          <div
                            className="fi text-[10px] tracking-[0.2em] uppercase mb-2 inline-flex items-center gap-1.5"
                            style={{ color: 'rgba(134,239,172,0.85)' }}
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect x="5" y="11" width="14" height="9" rx="2" />
                              <path d="M8 11V7a4 4 0 0 1 7.5-2" />
                            </svg>
                            {lock.unlockedBadge}
                          </div>
                          <p
                            className="fi text-xs leading-relaxed mb-2"
                            style={{ color: 'rgba(255,255,255,0.72)' }}
                          >
                            {lock.teaser}
                          </p>
                          <p
                            className="fi text-[11px] leading-relaxed"
                            style={{ color: 'rgba(255,255,255,0.45)' }}
                          >
                            {lock.unlockedNote}
                          </p>
                        </>
                      ) : (
                        <>
                          <div
                            className="fi text-[10px] tracking-[0.2em] uppercase mb-2"
                            style={{ color: 'rgba(212,175,55,0.6)' }}
                          >
                            {lock.sampleLabel}
                          </div>
                          <div
                            className="rounded-lg p-3 mb-3 relative overflow-hidden"
                            style={{
                              background: 'rgba(0,0,0,0.25)',
                              border: '1px dashed rgba(212,175,55,0.18)',
                            }}
                          >
                            <p
                              className="fi text-xs leading-relaxed italic"
                              style={{
                                color: 'rgba(255,255,255,0.55)',
                                filter: 'blur(2px)',
                                userSelect: 'none',
                              }}
                              aria-hidden
                            >
                              ████ ████████ ██ ████, ███████ ████████ ██ ██████.
                              ████ ███████ ██ ███, ███ █████████ ██ ██████ █████.
                              ████ ████████ ██ ██████ ███, █████████ ██ ████.
                            </p>
                            <div
                              className="absolute inset-0 flex items-center justify-center"
                              style={{
                                background:
                                  'linear-gradient(180deg, rgba(20,14,28,0.4), rgba(20,14,28,0.85))',
                              }}
                            >
                              <svg
                                width="22"
                                height="22"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#D4AF37"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <rect x="5" y="11" width="14" height="9" rx="2" />
                                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                              </svg>
                            </div>
                          </div>
                          <p
                            className="fi text-xs leading-relaxed mb-3"
                            style={{ color: 'rgba(255,255,255,0.6)' }}
                          >
                            {lock.teaser}
                          </p>
                          <Link
                            href="/upgrade"
                            title={lock.premium}
                            className="fc text-xs tracking-widest px-4 py-2 rounded-lg inline-flex items-center gap-2 transition-all hover:scale-[1.02] no-underline"
                            style={{
                              background:
                                'linear-gradient(135deg, rgba(212,175,55,0.28), rgba(181,148,16,0.22))',
                              border: '1px solid rgba(212,175,55,0.4)',
                              color: '#F2CF75',
                              letterSpacing: '0.12em',
                              cursor: 'pointer',
                            }}
                          >
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z" />
                            </svg>
                            {lock.unlock}
                          </Link>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div
            className="rounded-xl p-4 text-center"
            style={{
              background: 'rgba(212,175,55,0.05)',
              border: '1px solid rgba(212,175,55,0.12)',
            }}
          >
            <p className="fi text-xs mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {section.coming}
            </p>
            <p className="fi text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {t.previewNote}
            </p>
          </div>
        </div>
      </div>
      {wipeToast && (
        <div
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] fi text-sm px-5 py-3 rounded-xl shadow-2xl"
          style={{ background: '#0B1736', color: '#F2CF75', border: '1px solid rgba(212,175,55,0.4)' }}
          role="status"
        >
          {lang === 'fa' ? 'نشست پاک شد' : lang === 'ru' ? 'Сессия очищена' : lang === 'ar' ? 'تم مسح الجلسة' : 'Session wiped'}
        </div>
      )}
    </AppShell>
  );
}
