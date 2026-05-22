'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { HOME_LANGS } from '@/lib/home-i18n';
import { loadAppLang, saveAppLang } from '@/lib/calendar-preferences';
import type { AppLang } from '@/lib/app-settings';

const VAULT_ENTERED_KEY = 'planet-life-vault-entered';

// Vault gate — the locked entrance to the women-focused inner sanctum.
// This R0 stub presents the curiosity-driving preview: what's behind the
// lock without actually building it yet. Verification (Pink Firewall) is
// intentionally light — once unlocked, anyone willing to subscribe gets
// in. The Pink Lounge (chat rooms) remains gender-verified internally.

type VaultKey =
  | 'sensuality'
  | 'cycle'
  | 'provider'
  | 'shadow'
  | 'look'
  | 'power'
  | 'lounge';

const VAULT_LANGS: Record<
  AppLang,
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    promise: string;
    cta: string;
    ctaInside: string;
    ctaHint: string;
    backToToday: string;
    inside: string;
    sections: Record<
      VaultKey,
      { title: string; sub: string; preview: string }
    >;
  }
> = {
  en: {
    eyebrow: '· Members only ·',
    title: 'The Vault',
    subtitle:
      'A private chamber for the deepest, most personal use of astrology — desire, cycles, attraction, secrets, money, magnetism.',
    promise:
      'Your charts and chats are encrypted. No real names. No screenshots. A door you can close in one tap.',
    cta: 'Step inside',
    ctaInside: 'Welcome — preview unlocked',
    ctaHint: 'Full features arrive in Sprint R8 with Premium.',
    backToToday: '← Back to Today',
    inside: 'Inside, you will find',
    sections: {
      sensuality: {
        title: 'Sensuality',
        sub: 'Your Mars · Pluto · Lilith',
        preview:
          'The geometry of your desire, your fantasy, your magnetism — and the hours your appeal peaks.',
      },
      cycle: {
        title: 'Body & Cycle',
        sub: 'Period · Ovulation · Hormones',
        preview:
          'Sync your cycle to the Moon. Know your peak, your dip, your fertile window — to the day.',
      },
      provider: {
        title: 'The Provider',
        sub: 'Your Jupiter · Astrocartography',
        preview:
          'Where on Earth your wealth-line falls. What kind of partner your chart calls. Map your luckiest geography.',
      },
      shadow: {
        title: 'Shadow Room',
        sub: 'Honesty · Loyalty · Truth',
        preview:
          'Patterns of secrecy and trust in any chart. Read with care. We show signals, never verdicts.',
      },
      look: {
        title: 'Cosmic Look',
        sub: 'Color · Scent · Style of the day',
        preview:
          'Today the Moon is in Scorpio — wear black velvet. Today Venus is loud — wear honey. Daily.',
      },
      power: {
        title: 'Power Calendar',
        sub: 'Sex · Money · Distance · Yes-days',
        preview:
          'Hot days. Money-ask days. Quiet days that pull people back. The rhythm of attraction, mapped.',
      },
      lounge: {
        title: 'Pink Lounge',
        sub: 'Verified · Anonymous · Private',
        preview:
          'A chat room only verified members enter. Aliases only. End-to-end encrypted.',
      },
    },
  },
  ru: {
    eyebrow: '· Только для участников ·',
    title: 'Хранилище',
    subtitle:
      'Закрытая комната для самой личной астрологии — желание, циклы, притяжение, тайны, деньги, магнетизм.',
    promise:
      'Карты и беседы зашифрованы. Только псевдонимы. Без скриншотов. Дверь закрывается одним касанием.',
    cta: 'Войти',
    ctaInside: 'Добро пожаловать — превью открыто',
    ctaHint: 'Полный доступ откроется в спринте R8 с Премиум.',
    backToToday: '← Назад к Сегодня',
    inside: 'Внутри вас ждёт',
    sections: {
      sensuality: {
        title: 'Чувственность',
        sub: 'Марс · Плутон · Лилит',
        preview:
          'Геометрия вашего желания, фантазии и магнетизма — и часы, когда ваша притягательность на пике.',
      },
      cycle: {
        title: 'Тело и цикл',
        sub: 'Цикл · Овуляция · Гормоны',
        preview:
          'Синхронизируйте цикл с Луной. Зная пик, спад и фертильное окно — день в день.',
      },
      provider: {
        title: 'Покровитель',
        sub: 'Юпитер · Астрокартография',
        preview:
          'Где на карте мира проходит ваша линия богатства. Какого партнёра зовёт ваша карта.',
      },
      shadow: {
        title: 'Теневая комната',
        sub: 'Честность · Верность · Правда',
        preview:
          'Паттерны скрытности и доверия в любой карте. Мы показываем сигналы — не приговоры.',
      },
      look: {
        title: 'Космический образ',
        sub: 'Цвет · Аромат · Стиль дня',
        preview:
          'Сегодня Луна в Скорпионе — чёрный бархат. Сегодня Венера громкая — медовые тона. Ежедневно.',
      },
      power: {
        title: 'Календарь силы',
        sub: 'Секс · Деньги · Дистанция · Дни-да',
        preview:
          'Горячие дни. Дни просьб о деньгах. Тихие дни, что возвращают. Ритм притяжения на карте.',
      },
      lounge: {
        title: 'Pink Lounge',
        sub: 'Проверено · Анонимно · Приватно',
        preview:
          'Комната, куда входят только верифицированные участницы. Псевдонимы. Сквозное шифрование.',
      },
    },
  },
  fa: {
    eyebrow: '· فقط برای اعضا ·',
    title: 'محرمانه',
    subtitle:
      'اتاقی خصوصی برای عمیق‌ترین استفاده شخصی از استرولوژی — میل، چرخه‌ها، جذابیت، رازها، پول، مگنتیسم.',
    promise:
      'چارت‌ها و چت‌ها رمزنگاری شده‌اند. فقط نام مستعار. بدون اسکرین‌شات. دری که با یک کلیک می‌بندی.',
    cta: 'برو داخل',
    ctaInside: 'خوش اومدی — پیش‌نمایش باز شد',
    ctaHint: 'دسترسی کامل با اشتراک پریمیوم در اسپرینت R8.',
    backToToday: '→ بازگشت به امروز',
    inside: 'داخلش پیدا می‌کنی',
    sections: {
      sensuality: {
        title: 'شهوت و جذابیت',
        sub: 'مریخ · پلوتو · لیلیت تو',
        preview:
          'هندسه میل، فانتزی و مگنتیسم تو — و ساعت‌هایی که جذابیتت در اوج است.',
      },
      cycle: {
        title: 'بدن و چرخه',
        sub: 'پریود · تخمک‌گذاری · هورمون',
        preview:
          'چرخه‌ات را با ماه هم‌گام کن. اوج، فرود و پنجره باروری — روز به روز.',
      },
      provider: {
        title: 'حامی (همسر آینده)',
        sub: 'ژوپیتر · آستروکارتوگرافی',
        preview:
          'خط ثروتت روی نقشه دنیا. شوهر چارتت چه نوع آدمی‌ست. خوش‌شانس‌ترین جغرافیا.',
      },
      shadow: {
        title: 'اتاق سایه',
        sub: 'صداقت · وفاداری · حقیقت',
        preview:
          'الگوهای پنهان‌کاری و اعتماد در هر چارت. ما نشانه می‌دهیم — نه حکم.',
      },
      look: {
        title: 'استایل کیهانی',
        sub: 'رنگ · عطر · استایل روز',
        preview:
          'امروز ماه در عقرب است — مخمل مشکی. امروز ونوس بلند است — عسلی. هر روز.',
      },
      power: {
        title: 'تقویم قدرت',
        sub: 'سکس · پول · دوری · روزهای بله',
        preview:
          'روزهای داغ. روزهای درخواست پول. روزهای سکوت که آدم‌ها را برمی‌گردانند.',
      },
      lounge: {
        title: 'لانژ صورتی',
        sub: 'تأییدشده · ناشناس · خصوصی',
        preview:
          'اتاقی که فقط عضو تأییدشده وارد می‌شود. فقط نام مستعار. رمزنگاری دو سر.',
      },
    },
  },
  ar: {
    eyebrow: '· للأعضاء فقط ·',
    title: 'الخزانة',
    subtitle:
      'غرفة خاصة لأعمق استخدام شخصي للفلك — الرغبة، الدورات، الجاذبية، الأسرار، المال، المغناطيسية.',
    promise:
      'خرائطك ومحادثاتك مشفّرة. أسماء مستعارة فقط. بلا لقطات شاشة. باب يُغلق بضغطة.',
    cta: 'ادخلي',
    ctaInside: 'أهلاً بكِ — المعاينة مفتوحة',
    ctaHint: 'الميزات الكاملة تأتي في R8 مع البريميوم.',
    backToToday: '← العودة إلى اليوم',
    inside: 'في الداخل تجدين',
    sections: {
      sensuality: {
        title: 'الحسّية',
        sub: 'مرّيخك · بلوتوك · ليليت',
        preview:
          'هندسة رغبتك وخيالك وجاذبيتك — والساعات التي تبلغ فيها ذروتها.',
      },
      cycle: {
        title: 'الجسد والدورة',
        sub: 'الدورة · الإباضة · الهرمونات',
        preview:
          'زامني دورتك مع القمر. اعرفي الذروة والهبوط ونافذة الخصوبة — يوماً بيوم.',
      },
      provider: {
        title: 'العائل',
        sub: 'مشتريك · الجغرافيا الفلكية',
        preview:
          'أين يقع خط ثروتك على الكوكب. أيّ شريك تستدعيه خريطتك. أحظى الجغرافيا.',
      },
      shadow: {
        title: 'غرفة الظل',
        sub: 'الصدق · الولاء · الحقيقة',
        preview:
          'أنماط الكتمان والثقة في أي خريطة. نعرض إشارات — لا أحكاماً.',
      },
      look: {
        title: 'الإطلالة الكونية',
        sub: 'لون · عطر · أسلوب اليوم',
        preview:
          'اليوم القمر في العقرب — مخمل أسود. اليوم الزهرة عالية — لون العسل. يومياً.',
      },
      power: {
        title: 'تقويم القوة',
        sub: 'الجنس · المال · المسافة · أيام النعم',
        preview:
          'أيام حارّة. أيام طلب المال. أيام صمت تُعيد الناس. إيقاع الجاذبية.',
      },
      lounge: {
        title: 'صالون الوردي',
        sub: 'موثّق · مجهول · خاص',
        preview:
          'غرفة لا يدخلها إلا عضو موثّق. أسماء مستعارة فقط. تشفير طرفي.',
      },
    },
  },
};

const VAULT_ORDER: VaultKey[] = [
  'sensuality',
  'cycle',
  'provider',
  'shadow',
  'look',
  'power',
  'lounge',
];

export default function VaultPage() {
  const [lang, setLangState] = useState<AppLang>('en');
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const stored = loadAppLang();
    if (stored === 'en' || stored === 'ru' || stored === 'fa' || stored === 'ar') {
      setLangState(stored);
    }
    if (typeof window !== 'undefined') {
      setEntered(localStorage.getItem(VAULT_ENTERED_KEY) === '1');
    }
  }, []);

  const handleEnter = () => {
    setEntered(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(VAULT_ENTERED_KEY, '1');
      requestAnimationFrame(() => {
        document.getElementById('vault-grid')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    }
  };

  const setLang = (l: AppLang) => {
    setLangState(l);
    saveAppLang(l);
  };

  const t = VAULT_LANGS[lang];
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
              'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(244,114,182,0.10), transparent 60%), radial-gradient(ellipse 50% 50% at 50% 100%, rgba(168,85,247,0.06), transparent 60%)',
          }}
        />

        <div className="relative max-w-3xl mx-auto px-6 py-10">
          {/* Locked icon hero */}
          <div className="text-center mb-10">
            <div
              className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 relative"
              style={{
                background:
                  'radial-gradient(circle, rgba(244,114,182,0.18), rgba(168,85,247,0.06))',
                border: '1px solid rgba(244,114,182,0.35)',
                boxShadow:
                  '0 0 60px rgba(244,114,182,0.25), inset 0 0 0 1px rgba(244,114,182,0.15)',
              }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#f9a8d4"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                <path
                  d="M12 14.5c-.5-1-2-1-2 .2 0 1 1 1.6 2 2.3 1-.7 2-1.3 2-2.3 0-1.2-1.5-1.2-2-.2z"
                  fill="#f9a8d4"
                />
              </svg>
            </div>

            <div
              className="fc text-[11px] tracking-[0.3em] mb-3"
              style={{ color: 'rgba(244,114,182,0.7)' }}
            >
              {t.eyebrow}
            </div>
            <h1
              className="fc text-4xl md:text-5xl mb-4"
              style={{
                background:
                  'linear-gradient(135deg, #f9a8d4, #d8b4fe)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.05em',
              }}
            >
              {t.title}
            </h1>
            <p
              className="fi text-sm md:text-base max-w-xl mx-auto leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.65)' }}
            >
              {t.subtitle}
            </p>
          </div>

          {/* Inside preview / live grid */}
          <div id="vault-grid" className="mb-8 scroll-mt-6">
            <div
              className="fi text-[11px] tracking-[0.25em] uppercase mb-4 text-center"
              style={{ color: 'rgba(244,114,182,0.55)' }}
            >
              {t.inside}
              {entered && (
                <span
                  className="block mt-2 normal-case tracking-normal text-[11px]"
                  style={{ color: 'rgba(244,114,182,0.75)' }}
                >
                  {lang === 'fa'
                    ? 'روی هر کارت بزن — واردش می‌شی'
                    : lang === 'ar'
                      ? 'اضغطي على أي بطاقة للدخول'
                      : lang === 'ru'
                        ? 'Нажмите на карточку — войдёте внутрь'
                        : 'Tap any card to go inside'}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {VAULT_ORDER.map((key) => {
                const s = t.sections[key];
                const card = (
                  <>
                    <div
                      aria-hidden
                      className="absolute top-3 right-3"
                      style={{ opacity: entered ? 0 : 0.4, transition: 'opacity 0.4s' }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#f9a8d4"
                        strokeWidth="1.5"
                      >
                        <rect x="5" y="11" width="14" height="9" rx="2" />
                        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                      </svg>
                    </div>
                    {entered && (
                      <div
                        aria-hidden
                        className="absolute top-3 right-3"
                        style={{ opacity: 0.7 }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#f9a8d4"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                      </div>
                    )}
                    <h3
                      className="fc text-base mb-1"
                      style={{ color: '#f9a8d4', letterSpacing: '0.03em' }}
                    >
                      {s.title}
                    </h3>
                    <div
                      className="fi text-[10px] tracking-wider mb-2"
                      style={{ color: 'rgba(244,114,182,0.5)' }}
                    >
                      {s.sub}
                    </div>
                    <p
                      className="fi text-xs leading-relaxed"
                      style={{ color: 'rgba(255,255,255,0.6)' }}
                    >
                      {s.preview}
                    </p>
                  </>
                );
                const baseClasses =
                  'relative block rounded-xl p-4 overflow-hidden no-underline transition-all';
                const baseStyle = {
                  background:
                    'linear-gradient(135deg, rgba(40,20,40,0.6), rgba(20,14,28,0.6))',
                  border: entered
                    ? '1px solid rgba(244,114,182,0.28)'
                    : '1px solid rgba(244,114,182,0.12)',
                  boxShadow: entered
                    ? '0 0 24px rgba(244,114,182,0.12), inset 0 0 0 1px rgba(244,114,182,0.08)'
                    : 'inset 0 0 0 1px rgba(244,114,182,0.04), 0 0 24px rgba(244,114,182,0.04)',
                  cursor: entered ? 'pointer' : 'default',
                };
                return entered ? (
                  <Link
                    key={key}
                    href={`/vault/${key}`}
                    className={`${baseClasses} hover:scale-[1.02]`}
                    style={baseStyle}
                  >
                    {card}
                  </Link>
                ) : (
                  <div key={key} className={baseClasses} style={baseStyle}>
                    {card}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Privacy promise */}
          <div
            className="rounded-xl p-4 mb-8 text-center"
            style={{
              background: 'rgba(244,114,182,0.04)',
              border: '1px solid rgba(244,114,182,0.12)',
            }}
          >
            <p
              className="fi text-xs leading-relaxed italic"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              {t.promise}
            </p>
          </div>

          {/* CTA */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleEnter}
              disabled={entered}
              className="fc text-sm tracking-widest no-underline px-8 py-3.5 rounded-xl inline-flex items-center gap-2 transition-all hover:scale-[1.02]"
              style={{
                background: entered
                  ? 'linear-gradient(135deg, rgba(74,222,128,0.18), rgba(34,197,94,0.12))'
                  : 'linear-gradient(135deg, rgba(244,114,182,0.3), rgba(168,85,247,0.28))',
                border: entered
                  ? '1px solid rgba(74,222,128,0.4)'
                  : '1px solid rgba(244,114,182,0.5)',
                color: entered ? '#bbf7d0' : '#fce7f3',
                boxShadow: entered
                  ? '0 0 24px rgba(74,222,128,0.18)'
                  : '0 0 30px rgba(244,114,182,0.3), inset 0 0 0 1px rgba(255,255,255,0.05)',
                letterSpacing: '0.15em',
                cursor: entered ? 'default' : 'pointer',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {entered ? (
                  <path d="M5 12l4 4 10-10" />
                ) : (
                  <>
                    <rect x="5" y="11" width="14" height="9" rx="2" />
                    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                  </>
                )}
              </svg>
              {entered ? t.ctaInside : t.cta}
            </button>
            <div
              className="fi text-[11px] mt-3"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              {t.ctaHint}
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/home"
              className="fi text-xs no-underline px-4 py-2 rounded-lg inline-block"
              style={{
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              {t.backToToday}
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
