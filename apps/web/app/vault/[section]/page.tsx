'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { HOME_LANGS } from '@/lib/home-i18n';
import { loadAppLang, saveAppLang } from '@/lib/calendar-preferences';
import type { AppLang } from '@/lib/app-settings';
import { loadBirthProfile } from '@/lib/birth-profile';
import {
  fetchVaultMarsReading,
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
      'Save your birth date, time and city in Profile — then this reading is built from your real Mars.',
    goProfile: 'Go to Profile',
    apiError: 'Could not reach the stars. Is the API running on port 8000?',
  },
  fa: {
    liveLabel: 'خوانش تو',
    executive: 'یک خط',
    strategic: 'استراتژی',
    technical: 'حقایق چارت',
    loading: 'در حال خواندن چارت…',
    needProfile:
      'تاریخ، ساعت و شهر تولد رو در پروفایل ذخیره کن — بعد این خوانش از مریخ واقعی چارتت ساخته می‌شه.',
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
      'Сохраните дату, время и город в Профиле — тогда разбор строится по вашему Марсу.',
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
      'احفظي تاريخ الميلاد والوقت والمدينة في الملف — ثم يُبنى هذا التحليل من مرّيخكِ الحقيقي.',
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
  }
> = {
  en: {
    sampleLabel: 'Sample reading',
    teaser:
      'A live, personal reading flows here once Premium is on — pulled from your natal chart, today’s transits, and the lunar phase.',
    unlock: 'Unlock full reading',
    premium: 'Premium · R8',
    expand: 'Open',
    collapse: 'Close',
  },
  ru: {
    sampleLabel: 'Пример разбора',
    teaser:
      'Здесь появится живой персональный разбор после активации Премиум — из натальной карты, транзитов дня и фазы Луны.',
    unlock: 'Открыть полный разбор',
    premium: 'Премиум · R8',
    expand: 'Открыть',
    collapse: 'Закрыть',
  },
  fa: {
    sampleLabel: 'نمونه خوانش',
    teaser:
      'با فعال شدن پریمیوم اینجا یه خوانش زنده و شخصی می‌بینی — از چارت تولدت، ترانزیت‌های امروز و فاز ماه.',
    unlock: 'باز کردن خوانش کامل',
    premium: 'پریمیوم · R8',
    expand: 'باز کن',
    collapse: 'ببند',
  },
  ar: {
    sampleLabel: 'قراءة تجريبية',
    teaser:
      'ستظهر قراءة شخصية حيّة هنا عند تفعيل البريميوم — من خريطتك الفلكية وعبور اليوم وطور القمر.',
    unlock: 'افتحي القراءة الكاملة',
    premium: 'بريميوم · R8',
    expand: 'افتح',
    collapse: 'إغلاق',
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
};

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
    previewNote: 'Preview mode — full tools ship in Sprint R8 with Premium.',
    sensuality: {
      title: 'Sensuality',
      sub: 'Mars · Pluto · Lilith',
      intro:
        'Read the geometry of your desire, fantasy, and magnetism — and when your appeal peaks today.',
      items: [
        { label: 'My Mars', hint: 'What kind of men you are drawn to' },
        { label: 'My Pluto', hint: 'Deep fantasies and shadow desire' },
        { label: 'My Lilith', hint: 'Hidden magnetism and seduction' },
        { label: 'Sex Appeal Today', hint: 'Peak hours for attraction' },
      ],
      coming: 'Charts connect to your natal profile in Sprint R8.',
    },
    cycle: {
      title: 'Body & Cycle',
      sub: 'Period · Ovulation · Hormones',
      intro:
        'Sync your cycle to the Moon. Know your peak, dip, and fertile window — day by day.',
      items: [
        { label: 'Period Sync', hint: 'Moon phases vs your cycle' },
        { label: 'Ovulation Peak', hint: 'Peak desire and fertility window' },
        { label: 'Hormone Calendar', hint: 'Weekly energy rhythm' },
        { label: 'PMS Warning', hint: 'Days to protect your energy' },
      ],
      coming: 'Cycle tracking + lunar overlay in Sprint R8.',
    },
    provider: {
      title: 'The Provider',
      sub: 'Jupiter · Astrocartography',
      intro:
        'Where on Earth your wealth-line falls. What partner your chart calls. Your luckiest geography.',
      items: [
        { label: 'My Jupiter', hint: 'Future partner profile and money' },
        { label: 'Love Lines Map', hint: 'Best countries and nationalities' },
        { label: 'Crush Hack', hint: 'Decode one man’s Venus' },
        { label: 'Open His Wallet', hint: 'Daily money-flow remedies' },
      ],
      coming: 'Relocation lines + partner timing in Sprint R8.',
    },
    shadow: {
      title: 'Shadow Room',
      sub: 'Honesty · Loyalty · Truth',
      intro:
        'Patterns of secrecy and trust in any chart. We show signals — never verdicts.',
      items: [
        { label: 'Cheating Radar', hint: 'Risk windows this month' },
        { label: 'Best Day to Talk', hint: 'When truth surfaces easier' },
        { label: 'Hidden 8th & 12th', hint: 'Secrecy houses on his chart' },
        { label: 'Safe Secret Timing', hint: 'Low-exposure days' },
      ],
      coming: 'Horary-style timing in Sprint R8. Educational only.',
    },
    look: {
      title: 'Cosmic Look',
      sub: 'Color · Scent · Style',
      intro:
        'What to wear, smell, and post today so you hit maximum attraction in real life and on camera.',
      items: [
        { label: "Today's Color", hint: 'Dress code from the Moon' },
        { label: "Today's Perfume", hint: 'Venus vs Pluto notes' },
        { label: 'Live / Reel Time', hint: 'Best hour to post' },
        { label: 'Date Outfit', hint: 'What pulls him tonight' },
      ],
      coming: 'Daily dress code engine in Sprint R8.',
    },
    power: {
      title: 'Power Calendar',
      sub: 'Sex · Money · Distance · Yes-days',
      intro:
        'Hot days, money-ask days, ghost days, and yes-days — the rhythm of attraction mapped.',
      items: [
        { label: 'Hot Sex Days', hint: 'Mars-ruled windows' },
        { label: 'Money-Ask Days', hint: 'Venus-ruled windows' },
        { label: 'Ghost Days', hint: 'Strategic distance' },
        { label: 'Yes Day', hint: 'Big asks and proposals' },
      ],
      coming: 'Personal power calendar in Sprint R8.',
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
      coming: 'Chat + verification in Sprint R10.',
    },
  },
  ru: {
    back: '← Назад в Хранилище',
    vaultHome: 'Хранилище',
    previewNote: 'Режим превью — полные инструменты в спринте R8 с Премиум.',
    sensuality: {
      title: 'Чувственность',
      sub: 'Марс · Плутон · Лилит',
      intro: 'Геометрия желания, фантазии и магнетизма — и часы пика притяжения.',
      items: [
        { label: 'Мой Марс', hint: 'К каким мужчинам тянет' },
        { label: 'Мой Плутон', hint: 'Глубокие фантазии' },
        { label: 'Моя Лилит', hint: 'Скрытый магнетизм' },
        { label: 'Притяжение сегодня', hint: 'Пиковые часы' },
      ],
      coming: 'Связь с натальной картой в R8.',
    },
    cycle: {
      title: 'Тело и цикл',
      sub: 'Цикл · Овуляция · Гормоны',
      intro: 'Синхронизация цикла с Луной — день за днём.',
      items: [
        { label: 'Синхрон с циклом', hint: 'Фазы Луны' },
        { label: 'Пик овуляции', hint: 'Окно желания' },
        { label: 'Календарь гормонов', hint: 'Ритм недели' },
        { label: 'Предупреждение ПМС', hint: 'Дни беречь силы' },
      ],
      coming: 'Трекер + Луна в R8.',
    },
    provider: {
      title: 'Покровитель',
      sub: 'Юпитер · Астрокартография',
      intro: 'Линия богатства на карте мира и профиль партнёра по карте.',
      items: [
        { label: 'Мой Юпитер', hint: 'Партнёр и деньги' },
        { label: 'Карта любви', hint: 'Страны и национальности' },
        { label: 'Хак объекта', hint: 'Венера мужчины' },
        { label: 'Открыть кошелёк', hint: 'Ремеди на день' },
      ],
      coming: 'Линии и тайминг в R8.',
    },
    shadow: {
      title: 'Теневая комната',
      sub: 'Честность · Верность',
      intro: 'Сигналы скрытности и доверия — не приговоры.',
      items: [
        { label: 'Радар верности', hint: 'Риски месяца' },
        { label: 'День разговора', hint: 'Когда правда всплывает' },
        { label: 'Дома 8 и 12', hint: 'Секреты в карте' },
        { label: 'Безопасные дни', hint: 'Низкая видимость' },
      ],
      coming: 'Тайминг в R8. Только обучение.',
    },
    look: {
      title: 'Космический образ',
      sub: 'Цвет · Аромат · Стиль',
      intro: 'Что надеть и когда постить для максимального эффекта.',
      items: [
        { label: 'Цвет дня', hint: 'От Луны' },
        { label: 'Аромат дня', hint: 'Венера / Плутон' },
        { label: 'Время лайва', hint: 'Лучший час' },
        { label: 'Образ на свидание', hint: 'Вечером' },
      ],
      coming: 'Движок стиля в R8.',
    },
    power: {
      title: 'Календарь силы',
      sub: 'Секс · Деньги · Дистанция',
      intro: 'Горячие дни, дни денег, дни тишины и дни «да».',
      items: [
        { label: 'Горячие дни', hint: 'Марс' },
        { label: 'Дни денег', hint: 'Венера' },
        { label: 'Дни тишины', hint: 'Дистанция' },
        { label: 'День «да»', hint: 'Большие просьбы' },
      ],
      coming: 'Персональный календарь в R8.',
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
      coming: 'Чат в R10.',
    },
  },
  fa: {
    back: '→ بازگشت به محرمانه',
    vaultHome: 'محرمانه',
    previewNote: 'حالت پیش‌نمایش — ابزار کامل در اسپرینت R8 با پریمیوم.',
    sensuality: {
      title: 'شهوت و جذابیت',
      sub: 'مریخ · پلوتو · لیلیت',
      intro: 'هندسه میل، فانتزی و مگنتیسم — و ساعت‌های اوج جذابیت امروز.',
      items: [
        { label: 'مریخ من', hint: 'کشش به چه نوع مردانی' },
        { label: 'پلوتو من', hint: 'فانتزی‌های عمیق' },
        { label: 'لیلیت من', hint: 'مگنتیسم پنهان' },
        { label: 'جذابیت امروز', hint: 'ساعات اوج' },
      ],
      coming: 'اتصال به چارت تولد در R8.',
    },
    cycle: {
      title: 'بدن و چرخه',
      sub: 'پریود · تخمک‌گذاری · هورمون',
      intro: 'هم‌گام‌سازی چرخه با ماه — روز به روز.',
      items: [
        { label: 'هم‌گام پریود', hint: 'فازهای ماه' },
        { label: 'اوج تخمک‌گذاری', hint: 'پنجره شهوت' },
        { label: 'تقویم هورمون', hint: 'ریتم هفتگی' },
        { label: 'هشدار PMS', hint: 'روزهای محافظت انرژی' },
      ],
      coming: 'ترکر + ماه در R8.',
    },
    provider: {
      title: 'حامی (همسر آینده)',
      sub: 'ژوپیتر · آستروکارتوگرافی',
      intro: 'خط ثروت روی نقشه و نوع شوهر در چارت.',
      items: [
        { label: 'ژوپیتر من', hint: 'شریک و پول' },
        { label: 'نقشه عشق', hint: 'کشور و ملیت' },
        { label: 'هک کیس', hint: 'ونوس مرد' },
        { label: 'باز کردن کیف پول', hint: 'ریمدی روزانه' },
      ],
      coming: 'خطوط و تایمینگ در R8.',
    },
    shadow: {
      title: 'اتاق سایه',
      sub: 'صداقت · وفاداری',
      intro: 'نشانه‌های پنهان‌کاری و اعتماد — نه حکم.',
      items: [
        { label: 'رادار خیانت', hint: 'پنجره ریسک' },
        { label: 'روز حرف زدن', hint: 'وقتی حقیقت راحت‌تره' },
        { label: 'خانه ۸ و ۱۲', hint: 'پنهان‌کاری' },
        { label: 'روزهای امن', hint: 'لو نرفتن' },
      ],
      coming: 'تایمینگ در R8. فقط آموزشی.',
    },
    look: {
      title: 'استایل کیهانی',
      sub: 'رنگ · عطر · استایل',
      intro: 'امروز چه بپوشی و کی پست بذاری برای بیشترین جذابیت.',
      items: [
        { label: 'رنگ امروز', hint: 'از ماه' },
        { label: 'عطر امروز', hint: 'ونوس / پلوتو' },
        { label: 'ساعت لایو', hint: 'بهترین پست' },
        { label: 'استایل قرار', hint: 'امشب' },
      ],
      coming: 'موتور استایل در R8.',
    },
    power: {
      title: 'تقویم قدرت',
      sub: 'سکس · پول · دوری · بله',
      intro: 'روزهای داغ، روز پول، روز سکوت و روز «بله».',
      items: [
        { label: 'روزهای داغ', hint: 'مریخ' },
        { label: 'روز پول', hint: 'ونوس' },
        { label: 'روز غیبت', hint: 'دوری استراتژیک' },
        { label: 'روز بله', hint: 'درخواست بزرگ' },
      ],
      coming: 'تقویم شخصی در R8.',
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
      coming: 'چت در R10.',
    },
  },
  ar: {
    back: '← العودة إلى الخزانة',
    vaultHome: 'الخزانة',
    previewNote: 'وضع المعاينة — الأدوات الكاملة في R8 مع البريميوم.',
    sensuality: {
      title: 'الحسّية',
      sub: 'مرّيخ · بلوتو · ليليت',
      intro: 'هندسة الرغبة والخيال والجاذبية — وساعات الذروة اليوم.',
      items: [
        { label: 'مرّيخي', hint: 'نوع الرجال الذين تجذبينهم' },
        { label: 'بلوتوي', hint: 'خيالات عميقة' },
        { label: 'ليليتي', hint: 'مغناطيسية خفية' },
        { label: 'جاذبية اليوم', hint: 'ساعات الذروة' },
      ],
      coming: 'ربط بالخريطة في R8.',
    },
    cycle: {
      title: 'الجسد والدورة',
      sub: 'الدورة · الإباضة',
      intro: 'مزامنة الدورة مع القمر — يوماً بيوم.',
      items: [
        { label: 'مزامنة الدورة', hint: 'أطوار القمر' },
        { label: 'ذروة الإباضة', hint: 'نافذة الرغبة' },
        { label: 'تقويم الهرمون', hint: 'إيقاع الأسبوع' },
        { label: 'تحذير PMS', hint: 'أيام حماية الطاقة' },
      ],
      coming: 'تتبّع + قمر في R8.',
    },
    provider: {
      title: 'العائل',
      sub: 'مشتري · الجغرافيا الفلكية',
      intro: 'خط الثروة على الأرض ونوع الشريك في خريطتك.',
      items: [
        { label: 'مشتريي', hint: 'الشريك والمال' },
        { label: 'خريطة الحب', hint: 'البلدان' },
        { label: 'اختراق الإعجاب', hint: 'زهرة الرجل' },
        { label: 'فتح المحفظة', hint: 'علاج يومي' },
      ],
      coming: 'الخطوط في R8.',
    },
    shadow: {
      title: 'غرفة الظل',
      sub: 'الصدق · الولاء',
      intro: 'إشارات الكتمان والثقة — لا أحكاماً.',
      items: [
        { label: 'رادار الخيانة', hint: 'نوافذ الخطر' },
        { label: 'يوم الحديث', hint: 'عندما تظهر الحقيقة' },
        { label: 'البيت 8 و12', hint: 'الأسرار' },
        { label: 'أيام آمنة', hint: 'انكشاف منخفض' },
      ],
      coming: 'توقيت في R8. تعليمي فقط.',
    },
    look: {
      title: 'الإطلالة الكونية',
      sub: 'لون · عطر · أسلوب',
      intro: 'ماذا ترتدين ومتى تنشرين لأقصى جاذبية.',
      items: [
        { label: 'لون اليوم', hint: 'من القمر' },
        { label: 'عطر اليوم', hint: 'الزهرة / بلوتو' },
        { label: 'وقت البث', hint: 'أفضل ساعة' },
        { label: 'إطلالة الموعد', hint: 'الليلة' },
      ],
      coming: 'محرك الإطلالة في R8.',
    },
    power: {
      title: 'تقويم القوة',
      sub: 'الجنس · المال · المسافة',
      intro: 'أيام حارّة، أيام مال، أيام صمت، وأيام «نعم».',
      items: [
        { label: 'أيام حارّة', hint: 'المريخ' },
        { label: 'أيام المال', hint: 'الزهرة' },
        { label: 'أيام الغياب', hint: 'مسافة استراتيجية' },
        { label: 'يوم نعم', hint: 'طلبات كبيرة' },
      ],
      coming: 'تقويم شخصي في R8.',
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
      coming: 'دردشة في R10.',
    },
  },
};

function isValidSection(s: string | undefined): s is VaultSectionKey {
  return !!s && VALID.includes(s as VaultSectionKey);
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

  useEffect(() => {
    if (!isValidSection(raw) || !openItem) {
      setLiveReading(null);
      setHasLiveApi(false);
      setLiveError(null);
      setLiveLoading(false);
      return;
    }
    const sectionData = SECTION_LANGS[lang][raw];
    const idx = sectionData.items.findIndex((i) => i.label === openItem);
    const apiKey = (LIVE_ITEM_API[raw] ?? [])[idx];
    if (!apiKey) {
      setHasLiveApi(false);
      setLiveReading(null);
      setLiveError(null);
      return;
    }
    setHasLiveApi(true);
    if (apiKey !== 'mars') return;

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
    fetchVaultMarsReading(profile, lang)
      .then((res) => {
        if (!cancelled) setLiveReading(res.reading);
      })
      .catch(() => {
        if (!cancelled) setLiveError('api');
      })
      .finally(() => {
        if (!cancelled) setLiveLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [openItem, lang, raw]);

  const t = SECTION_LANGS[lang];
  const rui = READING_UI[lang];
  const dir = HOME_LANGS[lang].dir;
  const fontFamily = lang === 'fa' ? 'Vazirmatn, sans-serif' : 'Inter, sans-serif';

  if (!isValidSection(raw)) {
    return (
      <AppShell lang={lang} setLang={setLang} dir={dir} navLabels={HOME_LANGS[lang].nav} fontFamily={fontFamily}>
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <p className="fi text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Section not found.
          </p>
          <Link href="/vault" className="fi text-sm mt-4 inline-block" style={{ color: '#f9a8d4' }}>
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
      <div className="relative min-h-[calc(100vh-60px)] overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 50% 30% at 50% 0%, rgba(244,114,182,0.12), transparent 70%)',
          }}
        />

        <div className="relative max-w-2xl mx-auto px-6 py-10">
          <Link
            href="/vault"
            className="fi text-xs no-underline inline-block mb-6"
            style={{ color: 'rgba(244,114,182,0.75)' }}
          >
            {t.back}
          </Link>

          <div className="mb-2">
            <span
              className="fi text-[10px] tracking-[0.25em] uppercase"
              style={{ color: 'rgba(244,114,182,0.5)' }}
            >
              {t.vaultHome}
            </span>
          </div>
          <h1
            className="fc text-3xl md:text-4xl mb-2"
            style={{
              background: 'linear-gradient(135deg, #f9a8d4, #d8b4fe)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {section.title}
          </h1>
          <p className="fi text-xs mb-4" style={{ color: 'rgba(244,114,182,0.55)' }}>
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
                isOpen && hasLiveApi && itemApiKey === 'mars' && openItem === item.label;
              return (
                <div
                  key={item.label}
                  className="rounded-xl overflow-hidden transition-all"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(40,20,40,0.55), rgba(20,14,28,0.55))',
                    border: isOpen
                      ? '1px solid rgba(244,114,182,0.35)'
                      : '1px solid rgba(244,114,182,0.15)',
                    boxShadow: isOpen
                      ? '0 0 28px rgba(244,114,182,0.12)'
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
                        style={{ color: '#f9a8d4' }}
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
                          background: itemApiKey
                            ? 'rgba(34,197,94,0.12)'
                            : 'rgba(244,114,182,0.1)',
                          border: itemApiKey
                            ? '1px solid rgba(34,197,94,0.35)'
                            : '1px solid rgba(244,114,182,0.2)',
                          color: itemApiKey
                            ? 'rgba(134,239,172,0.9)'
                            : 'rgba(244,114,182,0.7)',
                        }}
                      >
                        {itemApiKey ? 'LIVE' : 'R8'}
                      </span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="rgba(244,114,182,0.7)"
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
                        borderTop: '1px solid rgba(244,114,182,0.1)',
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
                                  background: 'rgba(244,114,182,0.15)',
                                  border: '1px solid rgba(244,114,182,0.35)',
                                  color: '#fce7f3',
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
                                  style={{ color: '#fce7f3' }}
                                >
                                  {liveReading.headline}
                                </p>
                              )}
                              {liveReading.intensity && (
                                <span
                                  className="fi text-[10px] px-2 py-0.5 rounded-full inline-block"
                                  style={{
                                    background: 'rgba(244,114,182,0.12)',
                                    border: '1px solid rgba(244,114,182,0.25)',
                                    color: 'rgba(244,114,182,0.85)',
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
                                      border: '1px solid rgba(244,114,182,0.12)',
                                    }}
                                  >
                                    <div
                                      className="fi text-[10px] tracking-[0.15em] uppercase mb-1.5"
                                      style={{ color: 'rgba(244,114,182,0.55)' }}
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
                      ) : (
                        <>
                          <div
                            className="fi text-[10px] tracking-[0.2em] uppercase mb-2"
                            style={{ color: 'rgba(244,114,182,0.6)' }}
                          >
                            {lock.sampleLabel}
                          </div>
                          <div
                            className="rounded-lg p-3 mb-3 relative overflow-hidden"
                            style={{
                              background: 'rgba(0,0,0,0.25)',
                              border: '1px dashed rgba(244,114,182,0.18)',
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
                                stroke="#f9a8d4"
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
                                'linear-gradient(135deg, rgba(244,114,182,0.28), rgba(168,85,247,0.22))',
                              border: '1px solid rgba(244,114,182,0.4)',
                              color: '#fce7f3',
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
              background: 'rgba(244,114,182,0.05)',
              border: '1px solid rgba(244,114,182,0.12)',
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
    </AppShell>
  );
}
