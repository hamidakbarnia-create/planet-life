'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { HOME_LANGS } from '@/lib/home-i18n';
import { loadAppLang, saveAppLang } from '@/lib/calendar-preferences';
import type { AppLang } from '@/lib/app-settings';
import { loadTier, saveTier, type MembershipTier } from '@/lib/membership';

// /upgrade — pricing & tier comparison page.
// This is the destination for every Vault unlock CTA, every paywalled
// feature, and the "Free" badge in the AppShell. The actual checkout
// flow (Stripe + entitlements) lands in Sprint R3; this page locks in
// the pricing narrative + curiosity hook in 4 languages.

type TierKey = 'free' | 'pro' | 'premium' | 'vip';
type Cycle = 'monthly' | 'yearly';

type TierCopy = {
  name: string;
  tagline: string;
  monthly: string;
  yearly: string;
  cta: string;
  features: string[];
  details: { heading: string; body: string }[];
  whoFor: string;
};

type Copy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  cycleMonthly: string;
  cycleYearly: string;
  yearlyHint: string;
  popular: string;
  current: string;
  vaultUnlocks: string;
  back: string;
  comingSoon: string;
  comingSoonNote: string;
  showDetails: string;
  hideDetails: string;
  whoForLabel: string;
  tiers: Record<TierKey, TierCopy>;
  reserve: {
    title: string;
    subtitle: string;
    contactLabel: string;
    contactPlaceholder: string;
    nameLabel: string;
    namePlaceholder: string;
    submit: string;
    submitting: string;
    invalid: string;
    successTitle: string;
    successBody: string;
    founderBadge: string;
    founderCode: string;
    close: string;
    discount: string;
  };
};

const LANGS: Record<AppLang, Copy> = {
  en: {
    eyebrow: '· Choose your altitude ·',
    title: 'Upgrade Planet Life',
    subtitle:
      'Free covers the basics. Pro unlocks decision tools. Premium opens the Vault. VIP gives you Julia.',
    cycleMonthly: 'Monthly',
    cycleYearly: 'Yearly',
    yearlyHint: 'Save 30% with yearly',
    popular: 'Most popular',
    current: 'Your plan',
    vaultUnlocks: 'Unlocks the Vault',
    back: '← Back',
    comingSoon: 'Checkout opens in Sprint R3',
    comingSoonNote:
      'We are finalising payment partners across UAE, Russia, Iran, and the GCC. Save your spot below — early users get founder pricing for life.',
    showDetails: 'See full details',
    hideDetails: 'Hide details',
    whoForLabel: 'Built for',
    reserve: {
      title: 'Reserve your spot',
      subtitle:
        'Drop your email or phone. The day checkout opens, you get the link first — and founder pricing locked in for life.',
      contactLabel: 'Email or phone',
      contactPlaceholder: 'you@email.com or +971 50 123 4567',
      nameLabel: 'Your name (optional)',
      namePlaceholder: 'Full name',
      submit: 'Reserve my spot',
      submitting: 'Saving…',
      invalid: 'Please enter a valid email or phone.',
      successTitle: 'You are on the list',
      successBody:
        'We will message you the moment checkout is live. Show this code at checkout for your founder discount.',
      founderBadge: 'Founder',
      founderCode: 'Your code',
      close: 'Done',
      discount: '30% off for life',
    },
    tiers: {
      free: {
        name: 'Free',
        tagline: 'Your daily cosmic snapshot.',
        monthly: '0',
        yearly: '0',
        cta: 'Your plan',
        features: [
          'Daily cosmic score',
          '7-day calendar window',
          '3 questions per day',
          '2 people in your circle',
          'Single calendar (Gregorian)',
        ],
        whoFor:
          'Anyone curious — try the engine, get a feel for the daily score before paying.',
        details: [
          {
            heading: 'Daily cosmic score',
            body: 'Each morning we compute your day’s 0–100 score from real Swiss Ephemeris transits against your natal chart. One number tells you if today is a green light, neutral, or friction.',
          },
          {
            heading: '7-day calendar',
            body: 'See the next week ahead so you can plan small things — meetings, posts, workouts — but not the full year-level pattern.',
          },
          {
            heading: '3 questions / day',
            body: 'Ask three concrete questions per day (e.g. “Is tomorrow good to sign?”) and get a scored answer based on your chart.',
          },
          {
            heading: '2 people in your circle',
            body: 'Add up to two other birth charts (partner, friend) and see basic compatibility windows with them.',
          },
        ],
      },
      pro: {
        name: 'Pro',
        tagline: 'Decision-grade timing.',
        monthly: '40 AED · $11',
        yearly: '320 AED · $89',
        cta: 'Go Pro',
        features: [
          'Unlimited questions',
          'Full year calendar (macro · meso · micro)',
          '10 people in your circle',
          'Real-time golden-hour notifications',
          'Persian & Hijri calendars',
          'Cosmic Look (daily color & scent)',
        ],
        whoFor:
          'Founders, traders, freelancers, anyone who plans their week and wants their timing to actually work.',
        details: [
          {
            heading: 'Unlimited questions',
            body: 'Ask as many questions as you want — “best hour to send the deck”, “should I sign Tuesday or Thursday”, “is this flight day OK”. We never throttle you.',
          },
          {
            heading: 'Three-layer calendar',
            body: 'Macro: Saturn / Jupiter bands across the whole year. Meso: each week labelled (comms, money, review). Micro: tap any day to see the 24h golden / friction strip.',
          },
          {
            heading: '10 people in your circle',
            body: 'Add partner, co-founder, parent, key clients. See compatibility windows, conflict days, and synergy peaks across the whole group.',
          },
          {
            heading: 'Real-time golden hour push',
            body: 'When a Jupiter trine to your Sun opens at 14:00 today, your phone tells you so you don’t miss the meeting window.',
          },
          {
            heading: 'Persian + Hijri calendars',
            body: 'Switch between Gregorian, Solar Hijri (Shamsi) and Lunar Hijri so dates always make sense in your culture and family.',
          },
          {
            heading: 'Cosmic Look',
            body: 'Daily color and scent suggestion based on the Moon’s sign and Venus aspects — small ritual that compounds attraction over weeks.',
          },
        ],
      },
      premium: {
        name: 'Premium',
        tagline: 'The Vault opens.',
        monthly: '180 AED · $49',
        yearly: '1,440 AED · $399',
        cta: 'Open the Vault',
        features: [
          'Everything in Pro',
          'Vault — Sensuality · Body & Cycle · Provider',
          'Vault — Shadow Room · Power Calendar',
          'Marriage Lifecycle (timing, conception, divorce)',
          'Numerology + Abjad',
          'Famous people charts (politicians, founders, stars)',
          'Markets & Real-Estate astrology',
        ],
        whoFor:
          'Women who want the deep stuff — desire, magnetism, hormonal rhythm, secret tools. And anyone serious about marriage timing or markets.',
        details: [
          {
            heading: 'The Vault — Sensuality',
            body: 'Read the geometry of your Mars, Pluto and Lilith. What kind of magnetism you carry, when your appeal peaks, and which men are wired to chase your chart.',
          },
          {
            heading: 'Body & Cycle',
            body: 'Sync your period to the Moon. Know your fertile window, your dip, your PMS protection days — to the day, not the vague week.',
          },
          {
            heading: 'The Provider',
            body: 'Your Jupiter and your love-line astrocartography. The kind of partner your chart actually pulls in, and the cities on Earth where your wealth-line activates.',
          },
          {
            heading: 'Shadow Room',
            body: 'Honesty / loyalty / secrecy patterns in any chart. Educational signals — never verdicts. Use it to read the room, not to spy.',
          },
          {
            heading: 'Power Calendar',
            body: 'Hot days, money-ask days, ghost days, yes-days. The rhythm of attraction mapped onto your week so you stop guessing.',
          },
          {
            heading: 'Marriage Lifecycle',
            body: 'Best months for engagement and wedding. Conception windows. If divorce is on the table — the timing that protects you legally and karmically.',
          },
          {
            heading: 'Numerology + Abjad',
            body: 'Western numerology (life path, personal year/day) plus Arabic Abjad. Calculate brand names, phone numbers, license plates and see their planetary vibration.',
          },
          {
            heading: 'Famous people charts',
            body: 'Politicians (Putin, Trump, MBS, Khamenei, Netanyahu), founders (Musk, Bezos), athletes and stars. See what they’re going through this week — and how it ripples to you.',
          },
          {
            heading: 'Markets & Real Estate',
            body: 'Oil, gold, Bitcoin, forex, equities — read against planetary cycles. Plus Dubai, Tehran, Riyadh, Istanbul property charts: when each city tops and bottoms.',
          },
        ],
      },
      vip: {
        name: 'VIP',
        tagline: 'Julia, on call.',
        monthly: '3,500 AED · $950',
        yearly: '30,000 AED · $8,200',
        cta: 'Talk to Julia',
        features: [
          'Everything in Premium',
          '12 private sessions per year with Julia',
          'Family chart bundle (up to 4 people)',
          'Pink Lounge access',
          'Concierge messaging — 24/7 reply',
          'Early access to every new module',
        ],
        whoFor:
          'Family offices, executives, public figures, women navigating big private decisions — anyone whose next call needs a real human, not a feed.',
        details: [
          {
            heading: '12 private sessions with Julia',
            body: 'Once a month, 60 minutes, online or in-person at our Dubai office. Russian, English, Arabic, or through translation. Recordings + notes saved to your account.',
          },
          {
            heading: 'Family chart bundle',
            body: 'Up to four members — you, partner, two children. Everyone gets full Premium plus combined family timing for school, travel, big decisions.',
          },
          {
            heading: 'Pink Lounge',
            body: 'The verified-women-only chat rooms inside the Vault. Aliases. End-to-end encrypted. Topics curated weekly by Julia.',
          },
          {
            heading: 'Concierge messaging',
            body: 'Direct WhatsApp / Telegram thread with the team. Reply within 24 hours, often same-day. Quick "should I take this call?" between sessions.',
          },
          {
            heading: 'Early access to new modules',
            body: 'Every new feature — Astrocartography v2, Synastry Simulator, Project Natal — opens for VIP first, with Julia walking you through it.',
          },
        ],
      },
    },
  },
  ru: {
    eyebrow: '· Выберите высоту ·',
    title: 'Обновите Planet Life',
    subtitle:
      'Free — основа. Pro — инструменты решений. Premium — открывает Хранилище. VIP — это Юлия лично.',
    cycleMonthly: 'Ежемесячно',
    cycleYearly: 'Годовой',
    yearlyHint: 'Скидка 30% при оплате за год',
    popular: 'Популярный',
    current: 'Ваш план',
    vaultUnlocks: 'Открывает Хранилище',
    back: '← Назад',
    comingSoon: 'Оплата откроется в спринте R3',
    comingSoonNote:
      'Подключаем платёжных партнёров в ОАЭ, России, Иране и Заливе. Ранние пользователи получают цены основателей навсегда.',
    showDetails: 'Все подробности',
    hideDetails: 'Скрыть подробности',
    whoForLabel: 'Кому подойдёт',
    reserve: {
      title: 'Забронируйте место',
      subtitle:
        'Оставьте email или телефон. В день запуска оплаты — ссылка придёт вам первой, цена основателей закреплена навсегда.',
      contactLabel: 'Email или телефон',
      contactPlaceholder: 'you@email.com или +7 999 123 45 67',
      nameLabel: 'Ваше имя (необязательно)',
      namePlaceholder: 'ФИО',
      submit: 'Забронировать',
      submitting: 'Сохраняем…',
      invalid: 'Введите корректный email или телефон.',
      successTitle: 'Вы в списке',
      successBody:
        'Напишем вам, как только оплата заработает. Покажите этот код при оплате — получите скидку основателя.',
      founderBadge: 'Founder',
      founderCode: 'Ваш код',
      close: 'Готово',
      discount: '30% навсегда',
    },
    tiers: {
      free: {
        name: 'Free',
        tagline: 'Ежедневный космический снимок.',
        monthly: '0',
        yearly: '0',
        cta: 'Ваш план',
        features: [
          'Космическая оценка дня',
          'Календарь на 7 дней',
          '3 вопроса в день',
          '2 человека в вашем круге',
          'Григорианский календарь',
        ],
        whoFor:
          'Любому, кто хочет попробовать движок и понять оценку дня перед оплатой.',
        details: [
          {
            heading: 'Космическая оценка дня',
            body: 'Каждое утро рассчитываем 0–100 по реальным транзитам Swiss Ephemeris к вашей карте. Одно число — зелёный, нейтрал или трение.',
          },
          {
            heading: 'Календарь на 7 дней',
            body: 'Видите ближайшую неделю — встречи, посты, тренировки. Полная годовая картина — в Pro.',
          },
          {
            heading: '3 вопроса в день',
            body: 'Три конкретных вопроса с балльным ответом: «Хорошо ли подписать завтра?», «Когда писать инвестору?»',
          },
          {
            heading: '2 человека в круге',
            body: 'Добавьте партнёра и друга, чтобы видеть базовые окна совместимости и трения.',
          },
        ],
      },
      pro: {
        name: 'Pro',
        tagline: 'Тайминг решений.',
        monthly: '40 AED · $11',
        yearly: '320 AED · $89',
        cta: 'Перейти на Pro',
        features: [
          'Безлимитные вопросы',
          'Календарь на год — макро/мезо/микро',
          '10 человек в круге',
          'Уведомления о золотых часах',
          'Персидский и хиджри календарь',
          'Cosmic Look — цвет и аромат дня',
        ],
        whoFor:
          'Основателям, трейдерам, фрилансерам — всем, кому важно, чтобы тайминг работал.',
        details: [
          {
            heading: 'Безлимит вопросов',
            body: 'Сколько угодно вопросов в день: «лучший час для звонка», «вторник или четверг для подписи».',
          },
          {
            heading: 'Трёхуровневый календарь',
            body: 'Макро — циклы Сатурна и Юпитера на год. Мезо — темы недель. Микро — золотые / красные часы каждого дня.',
          },
          {
            heading: '10 человек в круге',
            body: 'Партнёр, со-основатель, родители, ключевые клиенты. Видите окна синергии и конфликта по всей группе.',
          },
          {
            heading: 'Push-уведомления',
            body: 'Когда Юпитер делает трин к вашему Солнцу в 14:00 — телефон сообщает, чтобы вы не пропустили.',
          },
          {
            heading: 'Персидский + хиджри',
            body: 'Григорианский, шамси, хиджри — переключение, чтобы даты всегда соответствовали культуре и семье.',
          },
          {
            heading: 'Cosmic Look',
            body: 'Цвет и аромат дня — маленький ритуал, усиливающий притяжение неделями.',
          },
        ],
      },
      premium: {
        name: 'Premium',
        tagline: 'Хранилище открывается.',
        monthly: '180 AED · $49',
        yearly: '1 440 AED · $399',
        cta: 'Открыть Хранилище',
        features: [
          'Всё из Pro',
          'Хранилище — Чувственность · Тело · Покровитель',
          'Хранилище — Теневая комната · Календарь силы',
          'Цикл брака (тайминг, зачатие, развод)',
          'Нумерология + Абджад',
          'Карты публичных фигур',
          'Астрология рынков и недвижимости',
        ],
        whoFor:
          'Женщинам, кому нужна глубина — желание, магнетизм, цикл, секретные инструменты. И всем, кто думает о браке или рынках всерьёз.',
        details: [
          {
            heading: 'Чувственность',
            body: 'Геометрия Марса, Плутона и Лилит — какой магнетизм вы несёте и часы пика притяжения.',
          },
          {
            heading: 'Тело и цикл',
            body: 'Синхрон цикла с Луной. Окно фертильности, спад, дни защиты ПМС — точно по дням.',
          },
          {
            heading: 'Покровитель',
            body: 'Ваш Юпитер и линии любви на карте мира. Тип партнёра и города, где активна линия богатства.',
          },
          {
            heading: 'Теневая комната',
            body: 'Сигналы скрытности и доверия в любой карте. Только сигналы — никаких приговоров.',
          },
          {
            heading: 'Календарь силы',
            body: 'Горячие дни, дни денег, дни тишины и дни «да» — ритм притяжения на вашей неделе.',
          },
          {
            heading: 'Цикл брака',
            body: 'Лучшие месяцы для свадьбы и зачатия. Если развод — окно, защищающее юридически.',
          },
          {
            heading: 'Нумерология + Абджад',
            body: 'Западная нумерология плюс арабский Абджад. Считает имена, телефоны, номера и их вибрации.',
          },
          {
            heading: 'Карты фигур',
            body: 'Путин, Трамп, MBS, Хаменеи, Маск, Безос, спортсмены, звёзды — что у них на этой неделе и как это касается вас.',
          },
          {
            heading: 'Рынки и недвижимость',
            body: 'Нефть, золото, BTC, форекс, акции — на циклах планет. И карты Дубая, Тегерана, Эр-Рияда, Стамбула.',
          },
        ],
      },
      vip: {
        name: 'VIP',
        tagline: 'Юлия — на связи.',
        monthly: '3 500 AED · $950',
        yearly: '30 000 AED · $8 200',
        cta: 'Говорить с Юлией',
        features: [
          'Всё из Premium',
          '12 личных сессий в год',
          'Семейный пакет (до 4 человек)',
          'Доступ к Pink Lounge',
          'Консьерж-чат 24/7',
          'Ранний доступ к новым модулям',
        ],
        whoFor:
          'Семейным офисам, руководителям, публичным людям, женщинам с большими частными решениями — когда нужен живой человек, а не лента.',
        details: [
          {
            heading: '12 личных сессий с Юлией',
            body: 'Раз в месяц, 60 минут, онлайн или в офисе в Дубае. Русский, английский, арабский. Записи и заметки в кабинете.',
          },
          {
            heading: 'Семейный пакет',
            body: 'До 4 членов семьи. Каждый получает Premium плюс совместный тайминг по школе, путешествиям, большим решениям.',
          },
          {
            heading: 'Pink Lounge',
            body: 'Закрытые комнаты внутри Хранилища. Только верифицированные. Псевдонимы. Темы — от Юлии.',
          },
          {
            heading: 'Консьерж',
            body: 'Прямой WhatsApp / Telegram с командой. Ответ в 24 часа, обычно в тот же день.',
          },
          {
            heading: 'Ранний доступ',
            body: 'Каждый новый модуль — Астрокартография v2, Синастри-симулятор — открывается VIP первыми.',
          },
        ],
      },
    },
  },
  fa: {
    eyebrow: '· ارتفاعت رو انتخاب کن ·',
    title: 'ارتقای Planet Life',
    subtitle:
      'رایگان: اصول. Pro: ابزار تصمیم. Premium: محرمانه باز می‌شه. VIP: جولیا در دسترس.',
    cycleMonthly: 'ماهانه',
    cycleYearly: 'سالانه',
    yearlyHint: 'با پرداخت سالانه ۳۰٪ تخفیف',
    popular: 'محبوب',
    current: 'پلن فعلی',
    vaultUnlocks: 'محرمانه رو باز می‌کنه',
    back: '→ بازگشت',
    comingSoon: 'پرداخت در اسپرینت R3 فعال می‌شه',
    comingSoonNote:
      'داریم پارتنر پرداخت رو برای امارات، روسیه، ایران و خلیج نهایی می‌کنیم. کاربرهای زود — قیمت بنیان‌گذار رو مادام‌العمر می‌گیرن.',
    showDetails: 'توضیحات کامل',
    hideDetails: 'بستن توضیحات',
    whoForLabel: 'مناسب برای',
    reserve: {
      title: 'جایت رو رزرو کن',
      subtitle:
        'ایمیل یا شماره‌ت رو بذار. روز اول که پرداخت فعال شه، لینک اول دست توئه — و قیمت بنیان‌گذار برای همیشه قفل می‌شه روی اسمت.',
      contactLabel: 'ایمیل یا شماره',
      contactPlaceholder: 'you@email.com یا 09121234567',
      nameLabel: 'اسمت (اختیاری)',
      namePlaceholder: 'نام و نام خانوادگی',
      submit: 'رزرو می‌کنم',
      submitting: 'در حال ذخیره…',
      invalid: 'یه ایمیل یا شماره معتبر بنویس.',
      successTitle: 'تو لیست هستی',
      successBody:
        'لحظه‌ای که پرداخت فعال شه بهت پیام می‌دیم. این کد رو زمان پرداخت نشون بده تا تخفیف بنیان‌گذار رو بگیری.',
      founderBadge: 'بنیان‌گذار',
      founderCode: 'کد تو',
      close: 'تموم',
      discount: '۳۰٪ تخفیف مادام‌العمر',
    },
    tiers: {
      free: {
        name: 'رایگان',
        tagline: 'تصویر کیهانی روزانه.',
        monthly: '۰',
        yearly: '۰',
        cta: 'پلن فعلی',
        features: [
          'امتیاز کیهانی روزانه',
          'تقویم ۷ روز جلو',
          '۳ پرسش در روز',
          '۲ نفر تو حلقه‌ت',
          'فقط تقویم میلادی',
        ],
        whoFor:
          'هر کسی که می‌خواد قبل از پرداخت، موتور رو امتحان کنه و حس امتیاز روزانه رو بگیره.',
        details: [
          {
            heading: 'امتیاز کیهانی روزانه',
            body: 'هر صبح، با ترانزیت‌های واقعی Swiss Ephemeris روی چارت تو، یه نمره ۰ تا ۱۰۰ حساب می‌شه. یه عدد می‌گه امروز سبزه، خنثی یا اصطکاکی.',
          },
          {
            heading: 'تقویم ۷ روز',
            body: 'هفته جلو رو می‌بینی برای برنامه‌های کوچیک — جلسه، پست، تمرین. الگوی کل سال تو Pro هست.',
          },
          {
            heading: '۳ پرسش در روز',
            body: 'سه تا سوال مشخص با جواب نمره‌دار: «امضا فردا چطوره؟»، «کی پیام بدم به سرمایه‌گذار؟»',
          },
          {
            heading: '۲ نفر',
            body: 'تا ۲ نفر اضافه می‌کنی — همسر، دوست — و پنجره‌های هم‌خوانی پایه رو می‌بینی.',
          },
        ],
      },
      pro: {
        name: 'Pro',
        tagline: 'تایمینگ تصمیم.',
        monthly: '۴۰ درهم · ۱۱ دلار',
        yearly: '۳۲۰ درهم · ۸۹ دلار',
        cta: 'برو Pro',
        features: [
          'پرسش‌های نامحدود',
          'تقویم سال کامل (ماکرو/میسو/میکرو)',
          '۱۰ نفر تو حلقه‌ت',
          'هشدار ساعت طلایی',
          'تقویم شمسی و هجری',
          'Cosmic Look — رنگ و عطر روز',
        ],
        whoFor:
          'بنیان‌گذار، تریدر، فریلنسر — هر کی هفته‌ش رو برنامه‌ریزی می‌کنه و می‌خواد تایمینگش واقعاً جواب بده.',
        details: [
          {
            heading: 'پرسش‌های نامحدود',
            body: 'هر چقدر بخوای سوال بپرس: «بهترین ساعت برای فرستادن پرزنتیشن»، «سه‌شنبه یا پنج‌شنبه برای امضا»، «این پرواز خوبه؟»',
          },
          {
            heading: 'تقویم سه‌لایه',
            body: 'ماکرو: نوارهای زحل و ژوپیتر روی کل سال. میسو: هر هفته با تم (ارتباط، پول، بازنگری). میکرو: هر روز یه نوار ۲۴ ساعته طلایی/قرمز.',
          },
          {
            heading: '۱۰ نفر',
            body: 'همسر، شریک، والدین، کاینت‌های مهم. پنجره هم‌افزایی و تنش بین کل گروه رو می‌بینی.',
          },
          {
            heading: 'هشدار طلایی',
            body: 'وقتی ژوپیتر تراین می‌زنه به خورشید چارتت ساعت ۱۴، گوشیت بهت می‌گه که جلسه رو از دست ندی.',
          },
          {
            heading: 'تقویم شمسی و هجری',
            body: 'بین میلادی، شمسی و هجری جابجا می‌شی تا تاریخ‌ها همیشه برای فرهنگ و خانواده‌ت معنی بدن.',
          },
          {
            heading: 'Cosmic Look',
            body: 'رنگ و عطر روزانه بر اساس برج ماه و زاویه‌های ونوس — یه ریتوال کوچیک که جذابیت رو هفته به هفته بیشتر می‌کنه.',
          },
        ],
      },
      premium: {
        name: 'Premium',
        tagline: 'محرمانه باز می‌شه.',
        monthly: '۱۸۰ درهم · ۴۹ دلار',
        yearly: '۱٬۴۴۰ درهم · ۳۹۹ دلار',
        cta: 'باز کردن محرمانه',
        features: [
          'هر چیزی که Pro داره',
          'محرمانه — جذابیت · بدن · حامی',
          'محرمانه — اتاق سایه · تقویم قدرت',
          'چرخه ازدواج (تایمینگ، بارداری، طلاق)',
          'نومرولوژی + ابجد',
          'چارت سیاستمدارها و سلبریتی‌ها',
          'استرولوژی بازار و املاک',
        ],
        whoFor:
          'زن‌هایی که عمق می‌خوان — میل، مگنتیسم، چرخه هورمون، ابزار سکرت. و هر کسی که جدی به ازدواج و بازار فکر می‌کنه.',
        details: [
          {
            heading: 'جذابیت (Sensuality)',
            body: 'هندسه مریخ، پلوتو و لیلیت تو رو می‌خونه. چه نوع مگنتیسمی داری، ساعت‌های اوج جذابیتت کِی هستن، و کدوم مردا با چارت تو wired شدن.',
          },
          {
            heading: 'بدن و چرخه',
            body: 'پریود رو با ماه هم‌گام می‌کنه. پنجره باروری، روزهای فرود، روزهای محافظت PMS — دقیق به روز، نه «حدوداً همین هفته».',
          },
          {
            heading: 'حامی (Provider)',
            body: 'ژوپیتر تو + خط عشق روی نقشه دنیا. نوع شریکی که چارتت می‌کشه و شهرهایی که خط ثروتت فعال می‌شه.',
          },
          {
            heading: 'اتاق سایه',
            body: 'الگوهای صداقت، وفاداری و پنهان‌کاری در هر چارت. فقط نشانه — هرگز حکم. ابزار خواندن، نه جاسوسی.',
          },
          {
            heading: 'تقویم قدرت',
            body: 'روزهای داغ، روز پول، روز سکوت، روز «بله». ریتم جذابیت روی هفته‌ت چیده می‌شه تا حدس نزنی.',
          },
          {
            heading: 'چرخه ازدواج',
            body: 'بهترین ماه‌های نامزدی و عقد. پنجره بارداری. اگه طلاق روی میزه — تایمینگی که قانونی و کارمیک ازت محافظت می‌کنه.',
          },
          {
            heading: 'نومرولوژی + ابجد',
            body: 'نومرولوژی غربی (مسیر زندگی، روز شخصی) + ابجد عربی. اعداد برند، شماره تلفن، پلاک ماشین رو حساب می‌کنه و می‌گه ارتعاش سیاره‌ای‌ش چیه.',
          },
          {
            heading: 'چارت‌های مهم',
            body: 'پوتین، ترامپ، بن‌سلمان، خامنه‌ای، نتانیاهو، ماسک، بزوس، ورزشکار و ستاره. این هفته چی بهشون می‌گذره و چطور موج می‌رسه به تو.',
          },
          {
            heading: 'بازار و املاک',
            body: 'نفت، طلا، بیت‌کوین، فارکس، بورس — روی چرخه سیاره‌ها. + چارت دبی، تهران، ریاض، استانبول و لندن: کدوم شهر کِی به اوج و کف می‌رسه.',
          },
        ],
      },
      vip: {
        name: 'VIP',
        tagline: 'جولیا در اختیار توست.',
        monthly: '۳٬۵۰۰ درهم · ۹۵۰ دلار',
        yearly: '۳۰٬۰۰۰ درهم · ۸٬۲۰۰ دلار',
        cta: 'صحبت با جولیا',
        features: [
          'هر چیزی که Premium داره',
          'سالی ۱۲ جلسه خصوصی با جولیا',
          'پکیج خانواده (تا ۴ نفر)',
          'دسترسی به Pink Lounge',
          'پیام‌رسان کنسیرژ ۲۴/۷',
          'دسترسی زود به ماژول‌های جدید',
        ],
        whoFor:
          'فمیلی آفیس، مدیران، چهره‌های عمومی، زن‌هایی با تصمیم‌های بزرگ خصوصی — هر کی تماس بعدیش به یه آدم واقعی نیاز داره، نه فید.',
        details: [
          {
            heading: 'سالی ۱۲ جلسه با جولیا',
            body: 'ماهی یه بار، ۶۰ دقیقه، آنلاین یا حضوری تو دفتر دبی. روسی، انگلیسی، عربی یا با ترجمه. ضبط + یادداشت تو حسابت ذخیره می‌شه.',
          },
          {
            heading: 'پکیج خانواده',
            body: 'تا ۴ نفر — تو، شریک، دو فرزند. هر کسی Premium کامل + تایمینگ مشترک خانواده برای مدرسه، سفر، تصمیم‌های بزرگ.',
          },
          {
            heading: 'Pink Lounge',
            body: 'اتاق‌های فقط زنان تأییدشده داخل محرمانه. فقط نام مستعار. رمزنگاری دو سر. موضوع‌ها رو جولیا هفتگی می‌چینه.',
          },
          {
            heading: 'پیام‌رسان کنسیرژ',
            body: 'تماس مستقیم WhatsApp/Telegram با تیم. جواب تو ۲۴ ساعت، معمولاً همون روز. سوال سریع «این تماس رو بگیرم یا نه؟» بین جلسه‌ها.',
          },
          {
            heading: 'دسترسی زود',
            body: 'هر ماژول جدید — Astrocartography v2، Synastry Simulator، Project Natal — اول برای VIP باز می‌شه، با راهنمایی جولیا.',
          },
        ],
      },
    },
  },
  ar: {
    eyebrow: '· اختاري ارتفاعك ·',
    title: 'ترقية Planet Life',
    subtitle:
      'المجاني للأساسيات. Pro لأدوات القرار. Premium يفتح الخزانة. VIP يمنحكِ جوليا.',
    cycleMonthly: 'شهري',
    cycleYearly: 'سنوي',
    yearlyHint: 'وفّر 30٪ مع الدفع السنوي',
    popular: 'الأكثر شعبية',
    current: 'خطتكِ',
    vaultUnlocks: 'يفتح الخزانة',
    back: '← رجوع',
    comingSoon: 'الدفع يبدأ في R3',
    comingSoonNote:
      'نُنهي شركاء الدفع في الإمارات وروسيا وإيران والخليج. المستخدمات الأوائل يحصلن على سعر المؤسسين مدى الحياة.',
    showDetails: 'كل التفاصيل',
    hideDetails: 'إخفاء التفاصيل',
    whoForLabel: 'مناسبة لـ',
    reserve: {
      title: 'احجزي مكانكِ',
      subtitle:
        'اتركي بريداً أو رقماً. لحظة فتح الدفع، سيصلكِ الرابط أولاً — وسعر المؤسسين يُثبَّت باسمكِ مدى الحياة.',
      contactLabel: 'البريد أو الهاتف',
      contactPlaceholder: 'you@email.com أو ‎+971 50 123 4567',
      nameLabel: 'اسمكِ (اختياري)',
      namePlaceholder: 'الاسم الكامل',
      submit: 'احجزي',
      submitting: 'يتم الحفظ…',
      invalid: 'أدخلي بريداً أو رقماً صحيحاً.',
      successTitle: 'أنتِ في القائمة',
      successBody:
        'سنراسلكِ لحظة تفعيل الدفع. أظهري هذا الرمز عند الدفع للحصول على خصم المؤسسين.',
      founderBadge: 'مؤسِّسة',
      founderCode: 'رمزكِ',
      close: 'تم',
      discount: '30٪ خصم مدى الحياة',
    },
    tiers: {
      free: {
        name: 'مجاني',
        tagline: 'لقطة كونية يومية.',
        monthly: '0',
        yearly: '0',
        cta: 'خطتكِ الحالية',
        features: [
          'درجة اليوم الكونية',
          'تقويم 7 أيام',
          '٣ أسئلة يومياً',
          'شخصان في دائرتك',
          'تقويم ميلادي فقط',
        ],
        whoFor:
          'لمن يريد تجربة المحرّك ومعرفة درجة اليوم قبل الاشتراك.',
        details: [
          { heading: 'درجة كونية يومية', body: 'كل صباح نحسب درجة من 0 إلى 100 من العبور الفعلي على خريطتك. رقم واحد يخبركِ: أخضر، محايد، أم احتكاك.' },
          { heading: 'تقويم 7 أيام', body: 'ترين الأسبوع القادم لخطط صغيرة. النمط السنوي الكامل في Pro.' },
          { heading: '٣ أسئلة يومياً', body: 'ثلاثة أسئلة محدّدة بإجابة بدرجة. مثال: «هل غداً مناسب للتوقيع؟»' },
          { heading: 'شخصان', body: 'أضيفي شريكاً وصديقة لرؤية نوافذ التوافق الأساسية.' },
        ],
      },
      pro: {
        name: 'Pro',
        tagline: 'توقيت القرار.',
        monthly: '40 درهم · 11 دولار',
        yearly: '320 درهم · 89 دولار',
        cta: 'الترقية إلى Pro',
        features: [
          'أسئلة غير محدودة',
          'تقويم سنوي كامل',
          '10 أشخاص في دائرتك',
          'تنبيهات الساعة الذهبية',
          'تقويم فارسي وهجري',
          'Cosmic Look — لون وعطر اليوم',
        ],
        whoFor:
          'لكل مؤسّس، تاجر، فريلنسر — كل من يخطّط أسبوعه ويريد توقيتاً يعمل.',
        details: [
          { heading: 'أسئلة بلا حدود', body: 'اسألي ما تشائين: أفضل ساعة، الثلاثاء أم الخميس، هل هذه الرحلة مناسبة.' },
          { heading: 'تقويم بثلاث طبقات', body: 'ماكرو: نطاقات زحل والمشتري على السنة. ميزو: مواضيع الأسابيع. مايكرو: ساعات ذهبية وحمراء كل يوم.' },
          { heading: '10 أشخاص', body: 'الشريك، المؤسّس المشارك، الأهل، العملاء — نوافذ التآزر والتوتر للمجموعة.' },
          { heading: 'تنبيهات الساعة الذهبية', body: 'حين يفتح ترين المشتري على شمسك في الساعة 14 — يخبركِ هاتفكِ.' },
          { heading: 'فارسي وهجري', body: 'تبديل بين الميلادي والفارسي والهجري كي يفهم التاريخ ثقافتكِ.' },
          { heading: 'Cosmic Look', body: 'لون وعطر اليوم — طقس صغير يضاعف الجاذبية على مدى الأسابيع.' },
        ],
      },
      premium: {
        name: 'Premium',
        tagline: 'تنفتح الخزانة.',
        monthly: '180 درهم · 49 دولار',
        yearly: '1,440 درهم · 399 دولار',
        cta: 'افتحي الخزانة',
        features: [
          'كل ما في Pro',
          'الخزانة — الحسّية · الجسد · العائل',
          'الخزانة — غرفة الظل · تقويم القوة',
          'دورة الزواج (التوقيت، الحمل، الطلاق)',
          'الأرقام + الأبجد',
          'خرائط شخصيات عامة',
          'فلك الأسواق والعقار',
        ],
        whoFor:
          'للنساء اللواتي يردن العمق — الرغبة، المغناطيسية، الدورة، الأدوات السرّية. ولكل جادّ في الزواج أو الأسواق.',
        details: [
          { heading: 'الحسّية', body: 'هندسة مرّيخك وبلوتوك وليليت — أيّ مغناطيسية تحملين، وساعات الذروة.' },
          { heading: 'الجسد والدورة', body: 'مزامنة دورتك مع القمر. نافذة الخصوبة، الهبوط، أيام حماية الـ PMS — يوماً بيوم.' },
          { heading: 'العائل', body: 'مشتريكِ وخطوط الحب على خريطة العالم. نوع الشريك ومدن الثروة.' },
          { heading: 'غرفة الظل', body: 'إشارات الكتمان والثقة في أي خريطة. إشارات فقط — لا أحكام.' },
          { heading: 'تقويم القوة', body: 'أيام حارّة، أيام طلب المال، أيام الغياب، أيام «نعم». إيقاع الجاذبية.' },
          { heading: 'دورة الزواج', body: 'أفضل أشهر للخطبة والعرس. نوافذ الحمل. وإن كان الطلاق — توقيت يحميكِ.' },
          { heading: 'أرقام + أبجد', body: 'الأرقام الغربية + الأبجد. اسم العلامة، رقم الهاتف، اللوحة — وذبذبتها.' },
          { heading: 'خرائط الشخصيات', body: 'بوتين، ترامب، MBS، خامنئي، ماسك، بيزوس، رياضيون ونجوم — ما يمرّون به ومدى تأثيره عليكِ.' },
          { heading: 'الأسواق والعقار', body: 'النفط والذهب والبيتكوين والفوركس — على دورات الكواكب. وخرائط دبي وطهران والرياض وإسطنبول.' },
        ],
      },
      vip: {
        name: 'VIP',
        tagline: 'جوليا تحت الطلب.',
        monthly: '3,500 درهم · 950 دولار',
        yearly: '30,000 درهم · 8,200 دولار',
        cta: 'تحدّثي مع جوليا',
        features: [
          'كل ما في Premium',
          '12 جلسة خاصة سنوياً',
          'باقة عائلية (حتى 4 أشخاص)',
          'الدخول إلى Pink Lounge',
          'كونسيرج 24/7',
          'وصول مبكر للوحدات الجديدة',
        ],
        whoFor:
          'للمكاتب العائلية، التنفيذيين، الشخصيات العامة، النساء أمام قرارات خاصة كبيرة — حين تحتاجين إنساناً حقيقياً.',
        details: [
          { heading: '12 جلسة خاصة', body: 'مرة شهرياً، 60 دقيقة، أونلاين أو في مكتبنا بدبي. روسية، إنجليزية، عربية. التسجيلات والملاحظات في حسابك.' },
          { heading: 'باقة عائلية', body: 'حتى 4 أفراد — أنتِ والشريك وطفلان. الجميع Premium + توقيت عائلي مشترك.' },
          { heading: 'Pink Lounge', body: 'غرف للمحقّقات فقط داخل الخزانة. أسماء مستعارة. تشفير طرفي.' },
          { heading: 'كونسيرج', body: 'WhatsApp / Telegram مباشر مع الفريق. ردّ خلال 24 ساعة، غالباً اليوم نفسه.' },
          { heading: 'وصول مبكر', body: 'كل وحدة جديدة — Astrocartography v2 وSynastry Simulator — تُفتح للـ VIP أولاً.' },
        ],
      },
    },
  },
};

const TIER_ORDER: TierKey[] = ['free', 'pro', 'premium', 'vip'];

const TIER_THEME: Record<TierKey, { glow: string; ring: string; tint: string; popular?: boolean }> = {
  free: { glow: 'rgba(255,255,255,0.06)', ring: 'rgba(255,255,255,0.1)', tint: 'rgba(255,255,255,0.7)' },
  pro: { glow: 'rgba(251,191,36,0.18)', ring: 'rgba(251,191,36,0.4)', tint: '#fbbf24', popular: true },
  premium: { glow: 'rgba(244,114,182,0.22)', ring: 'rgba(244,114,182,0.45)', tint: '#f9a8d4' },
  vip: { glow: 'rgba(196,181,253,0.22)', ring: 'rgba(196,181,253,0.45)', tint: '#c4b5fd' },
};

function isValidContact(s: string): boolean {
  const v = s.trim();
  if (v.length < 5) return false;
  // crude: looks like email if has '@' and '.', looks like phone if mostly digits
  const looksEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const digits = v.replace(/[^0-9]/g, '');
  const looksPhone = digits.length >= 7 && digits.length <= 15;
  return looksEmail || looksPhone;
}

function makeFounderCode(tier: TierKey): string {
  const tag = tier === 'pro' ? 'PRO' : tier === 'premium' ? 'PREM' : 'VIP';
  const ts = Date.now().toString(36).slice(-4).toUpperCase();
  return `FOUNDER-${tag}-${ts}`;
}

export default function UpgradePage() {
  const [lang, setLangState] = useState<AppLang>('en');
  const [cycle, setCycle] = useState<Cycle>('monthly');
  const [reserveTier, setReserveTier] = useState<TierKey | null>(null);
  const [reservedTiers, setReservedTiers] = useState<Set<TierKey>>(new Set());
  const [openDetails, setOpenDetails] = useState<TierKey | null>(null);
  const [contact, setContact] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<MembershipTier>('free');

  useEffect(() => {
    const stored = loadAppLang();
    if (stored === 'en' || stored === 'ru' || stored === 'fa' || stored === 'ar') {
      setLangState(stored);
    }
    setCurrentTier(loadTier());
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('planet-life-upgrade-reservations');
        const list: { tier: TierKey }[] = raw ? JSON.parse(raw) : [];
        setReservedTiers(new Set(list.map((r) => r.tier)));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const setLang = (l: AppLang) => {
    setLangState(l);
    saveAppLang(l);
  };

  const t = LANGS[lang];
  const dir = HOME_LANGS[lang].dir;
  const fontFamily = lang === 'fa' ? 'Vazirmatn, sans-serif' : 'Inter, sans-serif';

  const openReserve = (key: TierKey) => {
    if (key === 'free') return;
    setReserveTier(key);
    setContact('');
    setName('');
    setError(null);
    setSuccessCode(null);
  };

  const closeReserve = () => {
    setReserveTier(null);
    setError(null);
    setSuccessCode(null);
  };

  const submitReservation = () => {
    if (!reserveTier) return;
    if (!isValidContact(contact)) {
      setError(t.reserve.invalid);
      return;
    }
    setSubmitting(true);
    setError(null);
    const code = makeFounderCode(reserveTier);
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('planet-life-upgrade-reservations');
        const list: {
          tier: TierKey;
          contact: string;
          name: string;
          cycle: Cycle;
          code: string;
          ts: number;
        }[] = raw ? JSON.parse(raw) : [];
        list.push({
          tier: reserveTier,
          contact: contact.trim(),
          name: name.trim(),
          cycle,
          code,
          ts: Date.now(),
        });
        localStorage.setItem(
          'planet-life-upgrade-reservations',
          JSON.stringify(list),
        );
        const interestRaw = localStorage.getItem(
          'planet-life-upgrade-interest',
        );
        const interest: string[] = interestRaw ? JSON.parse(interestRaw) : [];
        if (!interest.includes(reserveTier)) interest.push(reserveTier);
        localStorage.setItem(
          'planet-life-upgrade-interest',
          JSON.stringify(interest),
        );
      } catch {
        /* ignore */
      }
    }
    setReservedTiers((prev) => {
      const next = new Set(prev);
      next.add(reserveTier);
      return next;
    });
    // Demo activation: until real Stripe checkout (R3), completing the
    // reservation grants the chosen tier so paywalled features unlock now.
    saveTier(reserveTier);
    setCurrentTier(reserveTier);
    setSuccessCode(code);
    setSubmitting(false);
  };

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
              'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(251,191,36,0.06), transparent 60%), radial-gradient(ellipse 50% 40% at 70% 60%, rgba(244,114,182,0.06), transparent 60%), radial-gradient(ellipse 50% 40% at 30% 80%, rgba(196,181,253,0.05), transparent 60%)',
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6 py-10">
          <Link
            href="/vault"
            className="fi text-xs no-underline inline-block mb-4"
            style={{ color: 'rgba(244,114,182,0.7)' }}
          >
            {t.back}
          </Link>

          <div className="text-center mb-10">
            <div
              className="fc text-[11px] tracking-[0.3em] mb-3"
              style={{ color: 'rgba(251,191,36,0.6)' }}
            >
              {t.eyebrow}
            </div>
            <h1
              className="fc text-4xl md:text-5xl mb-3"
              style={{ color: '#fbbf24', letterSpacing: '0.05em' }}
            >
              {t.title}
            </h1>
            <p
              className="fi text-sm md:text-base max-w-2xl mx-auto leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              {t.subtitle}
            </p>

            {/* Cycle toggle */}
            <div
              className="inline-flex mt-6 p-1 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {(['monthly', 'yearly'] as Cycle[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCycle(c)}
                  className="fi text-xs px-4 py-2 rounded-full transition-all"
                  style={{
                    background:
                      cycle === c
                        ? 'rgba(251,191,36,0.12)'
                        : 'transparent',
                    color: cycle === c ? '#fbbf24' : 'rgba(255,255,255,0.5)',
                    border:
                      cycle === c
                        ? '1px solid rgba(251,191,36,0.3)'
                        : '1px solid transparent',
                    minWidth: 100,
                  }}
                >
                  {c === 'monthly' ? t.cycleMonthly : t.cycleYearly}
                </button>
              ))}
            </div>
            {cycle === 'yearly' && (
              <div
                className="fi text-[11px] mt-2"
                style={{ color: 'rgba(74,222,128,0.85)' }}
              >
                {t.yearlyHint}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {TIER_ORDER.map((key) => {
              const tier = t.tiers[key];
              const theme = TIER_THEME[key];
              const price = cycle === 'monthly' ? tier.monthly : tier.yearly;
              const sent = reservedTiers.has(key);
              const isCurrent = currentTier === key && key !== 'free';
              return (
                <div
                  key={key}
                  className="relative rounded-2xl p-6 flex flex-col"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(20,24,40,0.7), rgba(14,18,32,0.7))',
                    border: `1px solid ${theme.ring}`,
                    boxShadow: `0 0 40px ${theme.glow}, inset 0 0 0 1px rgba(255,255,255,0.02)`,
                  }}
                >
                  {theme.popular && (
                    <span
                      className="fi text-[10px] tracking-[0.18em] uppercase absolute -top-2.5 right-5 px-2 py-0.5 rounded-full"
                      style={{
                        background: '#fbbf24',
                        color: '#1a1305',
                      }}
                    >
                      {t.popular}
                    </span>
                  )}
                  {key === 'premium' && (
                    <span
                      className="fi text-[10px] absolute -top-2.5 right-5 px-2 py-0.5 rounded-full"
                      style={{
                        background: '#f9a8d4',
                        color: '#3b0d2a',
                      }}
                    >
                      {t.vaultUnlocks}
                    </span>
                  )}

                  <div className="mb-4">
                    <div
                      className="fc text-xl mb-1"
                      style={{ color: theme.tint, letterSpacing: '0.04em' }}
                    >
                      {tier.name}
                    </div>
                    <div
                      className="fi text-xs"
                      style={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                      {tier.tagline}
                    </div>
                  </div>

                  <div className="mb-5">
                    <div
                      className="fc text-2xl"
                      style={{ color: '#fff', letterSpacing: '0.02em' }}
                    >
                      {price}
                    </div>
                    {key !== 'free' && (
                      <div
                        className="fi text-[11px] mt-1"
                        style={{ color: 'rgba(255,255,255,0.4)' }}
                      >
                        {cycle === 'monthly'
                          ? t.cycleMonthly.toLowerCase()
                          : t.cycleYearly.toLowerCase()}
                      </div>
                    )}
                  </div>

                  <ul className="space-y-2 mb-4 flex-1">
                    {tier.features.map((f) => (
                      <li
                        key={f}
                        className="fi text-xs flex items-start gap-2 leading-snug"
                        style={{ color: 'rgba(255,255,255,0.7)' }}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={theme.tint}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mt-1 shrink-0"
                        >
                          <path d="M5 12l4 4 10-10" />
                        </svg>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Details toggle */}
                  <button
                    type="button"
                    onClick={() =>
                      setOpenDetails(openDetails === key ? null : key)
                    }
                    className="fi text-[11px] tracking-wider mb-3 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-colors"
                    style={{
                      color: 'rgba(255,255,255,0.55)',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                    }}
                  >
                    {openDetails === key ? t.hideDetails : t.showDetails}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transform:
                          openDetails === key ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s',
                      }}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>

                  {openDetails === key && (
                    <div className="mb-4 space-y-3">
                      <div
                        className="rounded-lg p-3"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: `1px solid ${theme.ring}`,
                        }}
                      >
                        <div
                          className="fi text-[10px] tracking-[0.2em] uppercase mb-1"
                          style={{ color: theme.tint }}
                        >
                          {t.whoForLabel}
                        </div>
                        <p
                          className="fi text-xs leading-relaxed"
                          style={{ color: 'rgba(255,255,255,0.75)' }}
                        >
                          {tier.whoFor}
                        </p>
                      </div>
                      {tier.details.map((d) => (
                        <div key={d.heading}>
                          <div
                            className="fc text-xs mb-1"
                            style={{ color: theme.tint }}
                          >
                            {d.heading}
                          </div>
                          <p
                            className="fi text-[11px] leading-relaxed"
                            style={{ color: 'rgba(255,255,255,0.6)' }}
                          >
                            {d.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => openReserve(key)}
                    disabled={key === 'free'}
                    className="fc text-xs tracking-widest py-2.5 rounded-xl transition-all hover:scale-[1.02]"
                    style={{
                      background:
                        key === 'free'
                          ? 'rgba(255,255,255,0.04)'
                          : sent
                            ? 'linear-gradient(135deg, rgba(74,222,128,0.2), rgba(34,197,94,0.15))'
                            : `linear-gradient(135deg, ${theme.glow}, ${theme.glow})`,
                      border: sent
                        ? '1px solid rgba(74,222,128,0.4)'
                        : `1px solid ${theme.ring}`,
                      color: sent ? '#bbf7d0' : theme.tint,
                      letterSpacing: '0.14em',
                      cursor: key === 'free' ? 'default' : 'pointer',
                    }}
                  >
                    {isCurrent
                      ? `${t.current} ✓`
                      : sent
                        ? lang === 'fa'
                          ? 'دوباره رزرو ✓'
                          : lang === 'ar'
                            ? 'محجوز ✓ — احجزي مرة أخرى'
                            : lang === 'ru'
                              ? 'Забронировано ✓'
                              : 'Reserved ✓'
                        : tier.cta}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Coming-soon transparency */}
          <div
            className="mt-10 max-w-2xl mx-auto rounded-xl p-5 text-center"
            style={{
              background: 'rgba(251,191,36,0.04)',
              border: '1px solid rgba(251,191,36,0.15)',
            }}
          >
            <div
              className="fc text-[11px] tracking-[0.25em] uppercase mb-2"
              style={{ color: 'rgba(251,191,36,0.7)' }}
            >
              {t.comingSoon}
            </div>
            <p
              className="fi text-xs leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              {t.comingSoonNote}
            </p>
          </div>
        </div>

        {/* Reserve modal */}
        {reserveTier && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto"
            style={{
              background: 'rgba(4,6,14,0.78)',
              backdropFilter: 'blur(8px)',
            }}
            onClick={closeReserve}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative rounded-2xl w-full max-w-md p-6"
              style={{
                background:
                  'linear-gradient(135deg, rgba(28,18,40,0.96), rgba(18,14,28,0.96))',
                border: `1px solid ${TIER_THEME[reserveTier].ring}`,
                boxShadow: `0 0 50px ${TIER_THEME[reserveTier].glow}, 0 20px 60px rgba(0,0,0,0.6)`,
              }}
            >
              <button
                type="button"
                onClick={closeReserve}
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>

              {!successCode ? (
                <>
                  <div className="mb-1">
                    <span
                      className="fi text-[10px] tracking-[0.25em] uppercase"
                      style={{
                        color: TIER_THEME[reserveTier].tint,
                      }}
                    >
                      {t.tiers[reserveTier].name} ·{' '}
                      {cycle === 'monthly' ? t.cycleMonthly : t.cycleYearly}
                    </span>
                  </div>
                  <h2
                    className="fc text-2xl mb-2"
                    style={{ color: '#fff' }}
                  >
                    {t.reserve.title}
                  </h2>
                  <p
                    className="fi text-xs leading-relaxed mb-5"
                    style={{ color: 'rgba(255,255,255,0.65)' }}
                  >
                    {t.reserve.subtitle}
                  </p>

                  <label
                    className="fi block text-[10px] tracking-wider mb-1.5 uppercase"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    {t.reserve.contactLabel}
                  </label>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder={t.reserve.contactPlaceholder}
                    className="fi w-full px-3 py-2.5 text-sm rounded-lg mb-3"
                    autoFocus
                  />

                  <label
                    className="fi block text-[10px] tracking-wider mb-1.5 uppercase"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    {t.reserve.nameLabel}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.reserve.namePlaceholder}
                    className="fi w-full px-3 py-2.5 text-sm rounded-lg mb-4"
                  />

                  {error && (
                    <p
                      className="fi text-xs mb-3"
                      style={{ color: '#fca5a5' }}
                    >
                      {error}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={submitReservation}
                    disabled={submitting}
                    className="fc w-full py-3 rounded-xl text-sm tracking-widest transition-all hover:scale-[1.01]"
                    style={{
                      background: `linear-gradient(135deg, ${TIER_THEME[reserveTier].glow}, ${TIER_THEME[reserveTier].glow})`,
                      border: `1px solid ${TIER_THEME[reserveTier].ring}`,
                      color: TIER_THEME[reserveTier].tint,
                      letterSpacing: '0.16em',
                      cursor: submitting ? 'wait' : 'pointer',
                    }}
                  >
                    {submitting ? t.reserve.submitting : t.reserve.submit}
                  </button>

                  <div
                    className="fi text-[10px] mt-3 text-center"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                  >
                    🔒 {t.reserve.discount}
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <div
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                    style={{
                      background:
                        'radial-gradient(circle, rgba(74,222,128,0.25), rgba(34,197,94,0.1))',
                      border: '1px solid rgba(74,222,128,0.4)',
                    }}
                  >
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#86efac"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12l4 4 10-10" />
                    </svg>
                  </div>
                  <h2
                    className="fc text-2xl mb-2"
                    style={{ color: '#fff' }}
                  >
                    {t.reserve.successTitle}
                  </h2>
                  <p
                    className="fi text-xs leading-relaxed mb-5"
                    style={{ color: 'rgba(255,255,255,0.6)' }}
                  >
                    {t.reserve.successBody}
                  </p>

                  <div
                    className="rounded-xl p-4 mb-5"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(244,114,182,0.1))',
                      border: '1px solid rgba(251,191,36,0.3)',
                    }}
                  >
                    <div
                      className="fi text-[10px] tracking-[0.25em] uppercase mb-1"
                      style={{ color: 'rgba(251,191,36,0.85)' }}
                    >
                      {t.reserve.founderCode} · {t.reserve.discount}
                    </div>
                    <div
                      className="fc text-base tracking-wider select-all"
                      style={{ color: '#fbbf24', letterSpacing: '0.1em' }}
                    >
                      {successCode}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={closeReserve}
                    className="fc text-xs tracking-widest px-6 py-2.5 rounded-xl transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: 'rgba(255,255,255,0.85)',
                      letterSpacing: '0.16em',
                      cursor: 'pointer',
                    }}
                  >
                    {t.reserve.close}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
