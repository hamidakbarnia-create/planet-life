'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthed, saveSession, type AuthMethod } from '@/lib/auth';

type Tab = 'email' | 'phone';
type Step = 'identifier' | 'code' | 'success';

const LANGS = {
  en: {
    dir: 'ltr', name: 'EN',
    tagline: 'Astrological Intelligence',
    welcomeTitle: 'Welcome back',
    welcomeSub: 'Sign in to sync your charts, people, and saved windows.',
    emailTab: 'Email',
    phoneTab: 'Phone',
    emailLabel: 'Email address',
    emailPlaceholder: 'you@email.com',
    phoneLabel: 'Phone number',
    phonePlaceholder: '555 123 4567',
    sendCode: 'Send code',
    sending: 'Sending…',
    codeLabel: 'Verification code',
    codeHint: 'We sent a 6-digit code to',
    verify: 'Verify & Continue',
    verifying: 'Verifying…',
    resend: 'Resend',
    back: 'Change',
    successTitle: 'You are signed in',
    successSub: 'Redirecting to your daily brief…',
    orContinue: 'or continue with',
    google: 'Continue with Google',
    apple: 'Continue with Apple',
    magicHint: 'Prefer a magic link? We will send one when you tap “Send code”.',
    terms: 'By continuing you agree to the educational use disclaimer.',
    invalidEmail: 'Please enter a valid email.',
    invalidPhone: 'Please enter a valid phone number.',
    invalidCode: 'Enter the 6-digit code.',
  },
  ru: {
    dir: 'ltr', name: 'RU',
    tagline: 'Астрологический анализ',
    welcomeTitle: 'С возвращением',
    welcomeSub: 'Войдите, чтобы синхронизировать карты, людей и окна.',
    emailTab: 'Email',
    phoneTab: 'Телефон',
    emailLabel: 'Электронная почта',
    emailPlaceholder: 'you@email.com',
    phoneLabel: 'Номер телефона',
    phonePlaceholder: '+7 999 123 45 67',
    sendCode: 'Отправить код',
    sending: 'Отправка…',
    codeLabel: 'Код подтверждения',
    codeHint: 'Мы отправили 6-значный код на',
    verify: 'Подтвердить',
    verifying: 'Проверка…',
    resend: 'Отправить снова',
    back: 'Изменить',
    successTitle: 'Вы вошли',
    successSub: 'Переход к дневному обзору…',
    orContinue: 'или продолжите через',
    google: 'Войти через Google',
    apple: 'Войти через Apple',
    magicHint: 'Хотите magic link? Мы отправим его при нажатии «Отправить код».',
    terms: 'Продолжая, вы соглашаетесь с уведомлением об образовательном использовании.',
    invalidEmail: 'Введите корректный email.',
    invalidPhone: 'Введите корректный номер.',
    invalidCode: 'Введите 6-значный код.',
  },
  fa: {
    dir: 'rtl', name: 'FA',
    tagline: 'هوش نجومی',
    welcomeTitle: 'خوش آمدید',
    welcomeSub: 'وارد شوید تا نمودارها، افراد و پنجره‌های ذخیره‌شده هم‌گام شوند.',
    emailTab: 'ایمیل',
    phoneTab: 'موبایل',
    emailLabel: 'آدرس ایمیل',
    emailPlaceholder: 'you@email.com',
    phoneLabel: 'شمارهٔ موبایل',
    phonePlaceholder: '۰۹۱۲ ۱۲۳ ۴۵۶۷',
    sendCode: 'ارسال کد',
    sending: 'در حال ارسال…',
    codeLabel: 'کد تأیید',
    codeHint: 'یک کد ۶ رقمی ارسال شد به',
    verify: 'تأیید و ادامه',
    verifying: 'در حال بررسی…',
    resend: 'ارسال دوباره',
    back: 'تغییر',
    successTitle: 'وارد شدید',
    successSub: 'انتقال به خلاصهٔ روزانه…',
    orContinue: 'یا ادامه با',
    google: 'ورود با گوگل',
    apple: 'ورود با اپل',
    magicHint: 'لینک جادویی می‌خواهید؟ با لمس «ارسال کد» برایتان می‌فرستیم.',
    terms: 'با ادامه، شما با شرایط استفادهٔ آموزشی موافق هستید.',
    invalidEmail: 'یک ایمیل معتبر وارد کنید.',
    invalidPhone: 'یک شمارهٔ معتبر وارد کنید.',
    invalidCode: 'کد ۶ رقمی را وارد کنید.',
  },
  ar: {
    dir: 'rtl', name: 'AR',
    tagline: 'الذكاء الفلكي',
    welcomeTitle: 'مرحباً بعودتك',
    welcomeSub: 'سجّل الدخول لمزامنة خرائطك وأشخاصك ونوافذك المحفوظة.',
    emailTab: 'البريد',
    phoneTab: 'الهاتف',
    emailLabel: 'البريد الإلكتروني',
    emailPlaceholder: 'you@email.com',
    phoneLabel: 'رقم الهاتف',
    phonePlaceholder: '+971 50 123 4567',
    sendCode: 'إرسال الرمز',
    sending: 'جاري الإرسال…',
    codeLabel: 'رمز التحقق',
    codeHint: 'أرسلنا رمزاً مكوناً من ٦ أرقام إلى',
    verify: 'تحقّق وتابع',
    verifying: 'جاري التحقق…',
    resend: 'إعادة الإرسال',
    back: 'تغيير',
    successTitle: 'تم تسجيل الدخول',
    successSub: 'يتم التحويل إلى ملخصك اليومي…',
    orContinue: 'أو تابع باستخدام',
    google: 'المتابعة بحساب Google',
    apple: 'المتابعة بحساب Apple',
    magicHint: 'تفضّل رابطاً سحرياً؟ سنرسله عند النقر على "إرسال الرمز".',
    terms: 'بالمتابعة، أنت توافق على إخلاء المسؤولية للاستخدام التعليمي.',
    invalidEmail: 'الرجاء إدخال بريد صحيح.',
    invalidPhone: 'الرجاء إدخال رقم صحيح.',
    invalidCode: 'أدخل الرمز المكون من ٦ أرقام.',
  },
};

type LangKey = keyof typeof LANGS;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState<LangKey>('en');
  const [tab, setTab] = useState<Tab>('email');
  const [step, setStep] = useState<Step>('identifier');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const t = LANGS[lang];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('planet-life-lang');
    if (stored === 'en' || stored === 'ru' || stored === 'fa' || stored === 'ar') {
      setLang(stored);
    }
    if (isAuthed()) {
      router.replace('/home');
    }
  }, [router]);

  const identifier = tab === 'email' ? email : phone;

  const validateIdentifier = () => {
    setError('');
    if (tab === 'email') {
      if (!EMAIL_RE.test(email.trim())) {
        setError(t.invalidEmail);
        return false;
      }
    } else {
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 6) {
        setError(t.invalidPhone);
        return false;
      }
    }
    return true;
  };

  const sendCode = async () => {
    if (!validateIdentifier()) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 600));
    setBusy(false);
    setStep('code');
  };

  const verifyCode = async () => {
    setError('');
    if (!/^\d{6}$/.test(code.trim())) {
      setError(t.invalidCode);
      return;
    }
    setBusy(true);
    await new Promise((r) => setTimeout(r, 600));
    saveSession({
      method: tab,
      identifier: identifier.trim(),
      verifiedAt: Date.now(),
    });
    setBusy(false);
    setStep('success');
    setTimeout(() => router.replace('/home'), 900);
  };

  const handleOAuth = async (method: Extract<AuthMethod, 'google' | 'apple'>) => {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 500));
    saveSession({
      method,
      identifier: method === 'google' ? 'google-user' : 'apple-user',
      verifiedAt: Date.now(),
    });
    setBusy(false);
    setStep('success');
    setTimeout(() => router.replace('/home'), 700);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        direction: t.dir as 'ltr' | 'rtl',
        background: 'radial-gradient(circle at top, #1a1240 0%, #070B14 55%)',
        fontFamily: lang === 'fa' || lang === 'ar' ? 'Vazirmatn, sans-serif' : 'Inter, sans-serif',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Inter:wght@300;400;500&display=swap');
        @import url('https://fonts.googleapis.com/earlyaccess/vazirmatn.css');
        .fc{font-family:'Cinzel',serif}.fi{font-family:'Inter',sans-serif}
        .login-input{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:#fff;border-radius:12px}
        .login-input:focus{border-color:rgba(251,191,36,0.45);outline:none}
        .otp-input{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:#fff;border-radius:10px;text-align:center;font-family:'Cinzel',serif;font-size:18px}
        .otp-input:focus{border-color:rgba(251,191,36,0.45);outline:none}
      `}</style>

      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-3 no-underline">
          <svg width="36" height="36" viewBox="0 0 30 30" fill="none">
            <circle cx="15" cy="15" r="13" stroke="#fbbf24" strokeWidth="0.5" opacity="0.4" />
            <circle cx="15" cy="15" r="7" stroke="#fbbf24" strokeWidth="0.5" opacity="0.6" />
            <circle cx="15" cy="15" r="2.5" fill="#fbbf24" />
          </svg>
          <div className="flex flex-col leading-tight">
            <span className="fc text-lg tracking-widest" style={{ color: '#fbbf24' }}>
              Planet Life
            </span>
            <span className="fi text-[10px] tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {t.tagline}
            </span>
          </div>
        </Link>
        <div className="flex gap-1">
          {(Object.keys(LANGS) as LangKey[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className="fi px-2.5 py-1 text-xs rounded-md border transition-all"
              style={
                lang === l
                  ? { borderColor: 'rgba(251,191,36,0.5)', color: '#fbbf24', background: 'rgba(251,191,36,0.06)' }
                  : { borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }
              }
            >
              {LANGS[l].name}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-6">
        <div
          className="w-full max-w-md rounded-3xl p-7 space-y-6"
          style={{
            background: 'rgba(7,11,20,0.7)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {step === 'success' ? (
            <SuccessView title={t.successTitle} sub={t.successSub} />
          ) : (
            <>
              <div className="space-y-1 text-center">
                <h1 className="fc text-2xl" style={{ color: '#ffffff' }}>
                  {t.welcomeTitle}
                </h1>
                <p className="fi text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {t.welcomeSub}
                </p>
              </div>

              {step === 'identifier' && (
                <>
                  <TabSwitch
                    tab={tab}
                    setTab={(v) => {
                      setTab(v);
                      setError('');
                    }}
                    labels={{ email: t.emailTab, phone: t.phoneTab }}
                  />

                  <div className="space-y-2">
                    <label
                      className="fi text-[11px] uppercase tracking-widest"
                      style={{ color: 'rgba(255,255,255,0.45)' }}
                    >
                      {tab === 'email' ? t.emailLabel : t.phoneLabel}
                    </label>
                    {tab === 'email' ? (
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t.emailPlaceholder}
                        className="login-input w-full px-4 py-3 fi text-sm"
                        autoComplete="email"
                      />
                    ) : (
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={t.phonePlaceholder}
                        className="login-input w-full px-4 py-3 fi text-sm"
                        autoComplete="tel"
                      />
                    )}
                    {error && (
                      <div className="fi text-xs" style={{ color: '#fca5a5' }}>
                        {error}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={sendCode}
                    disabled={busy}
                    className="w-full py-3 rounded-xl fc text-sm tracking-widest disabled:opacity-50"
                    style={{
                      background: 'linear-gradient(135deg,#d97706,#f59e0b)',
                      color: '#0A0E1A',
                    }}
                  >
                    {busy ? t.sending : t.sendCode}
                  </button>

                  <p className="fi text-[11px] text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {t.magicHint}
                  </p>

                  <Divider label={t.orContinue} />

                  <div className="space-y-2">
                    <OAuthButton
                      onClick={() => handleOAuth('google')}
                      disabled={busy}
                      label={t.google}
                      icon={<GoogleIcon />}
                    />
                    <OAuthButton
                      onClick={() => handleOAuth('apple')}
                      disabled={busy}
                      label={t.apple}
                      icon={<AppleIcon />}
                      dark
                    />
                  </div>
                </>
              )}

              {step === 'code' && (
                <CodeStep
                  identifier={identifier}
                  code={code}
                  setCode={setCode}
                  hint={t.codeHint}
                  label={t.codeLabel}
                  verify={t.verify}
                  verifying={t.verifying}
                  resend={t.resend}
                  back={t.back}
                  busy={busy}
                  error={error}
                  onVerify={verifyCode}
                  onResend={() => {
                    setCode('');
                    setError('');
                  }}
                  onBack={() => {
                    setStep('identifier');
                    setCode('');
                    setError('');
                  }}
                />
              )}

              <p
                className="fi text-[11px] text-center"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                {t.terms}
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function TabSwitch({
  tab,
  setTab,
  labels,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  labels: { email: string; phone: string };
}) {
  return (
    <div
      className="grid grid-cols-2 p-1 rounded-xl"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {(['email', 'phone'] as Tab[]).map((k) => {
        const active = tab === k;
        return (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className="fi text-xs py-2 rounded-lg tracking-wide transition-colors"
            style={{
              background: active ? 'rgba(251,191,36,0.12)' : 'transparent',
              color: active ? '#fbbf24' : 'rgba(255,255,255,0.5)',
              border: active ? '1px solid rgba(251,191,36,0.35)' : '1px solid transparent',
            }}
          >
            {labels[k]}
          </button>
        );
      })}
    </div>
  );
}

function CodeStep({
  identifier,
  code,
  setCode,
  hint,
  label,
  verify,
  verifying,
  resend,
  back,
  busy,
  error,
  onVerify,
  onResend,
  onBack,
}: {
  identifier: string;
  code: string;
  setCode: (v: string) => void;
  hint: string;
  label: string;
  verify: string;
  verifying: string;
  resend: string;
  back: string;
  busy: boolean;
  error: string;
  onVerify: () => void;
  onResend: () => void;
  onBack: () => void;
}) {
  const digits = useMemo(() => code.padEnd(6, ' ').slice(0, 6).split(''), [code]);
  const handleChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 6);
    setCode(cleaned);
  };
  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <div className="fi text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {hint}
        </div>
        <div className="fc text-base" style={{ color: '#fbbf24' }}>
          {identifier}
        </div>
      </div>

      <div className="space-y-2">
        <label
          className="fi text-[11px] uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          {label}
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            value={code}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onVerify()}
            maxLength={6}
            className="absolute inset-0 opacity-0"
            aria-label={label}
          />
          <div className="grid grid-cols-6 gap-2" style={{ direction: 'ltr' }}>
            {digits.map((d, i) => (
              <div
                key={i}
                className="otp-input h-12 flex items-center justify-center"
                style={
                  d.trim()
                    ? { borderColor: 'rgba(251,191,36,0.45)' }
                    : undefined
                }
              >
                {d.trim() || ''}
              </div>
            ))}
          </div>
        </div>
        {error && (
          <div className="fi text-xs" style={{ color: '#fca5a5' }}>
            {error}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onVerify}
        disabled={busy}
        className="w-full py-3 rounded-xl fc text-sm tracking-widest disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg,#d97706,#f59e0b)', color: '#0A0E1A' }}
      >
        {busy ? verifying : verify}
      </button>

      <div className="flex justify-between fi text-xs">
        <button
          type="button"
          onClick={onBack}
          className="underline-offset-2 hover:underline"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          ← {back}
        </button>
        <button
          type="button"
          onClick={onResend}
          className="underline-offset-2 hover:underline"
          style={{ color: '#fbbf24' }}
        >
          {resend}
        </button>
      </div>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <span
        className="fi text-[10px] uppercase tracking-widest"
        style={{ color: 'rgba(255,255,255,0.35)' }}
      >
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
    </div>
  );
}

function OAuthButton({
  onClick,
  disabled,
  label,
  icon,
  dark,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  icon: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full py-3 rounded-xl fi text-sm flex items-center justify-center gap-3 disabled:opacity-50 transition-colors"
      style={
        dark
          ? { background: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }
          : { background: '#ffffff', color: '#1f2937', border: '1px solid rgba(255,255,255,0.15)' }
      }
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.58 2.69-3.9 2.69-6.62z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.94v2.32A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.96H.94A8.997 8.997 0 0 0 0 9c0 1.45.35 2.83.94 4.04l3.03-2.32z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.94 4.96l3.03 2.32C4.68 5.16 6.66 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M16.365 1.43c0 1.14-.46 2.22-1.21 3.02-.8.85-2.1 1.5-3.16 1.42-.13-1.1.42-2.27 1.18-3.06.8-.88 2.18-1.5 3.19-1.38zM20 17.4c-.55 1.27-.82 1.84-1.53 2.97-.99 1.57-2.38 3.52-4.1 3.54-1.53.02-1.93-1-4-1-2.07 0-2.5 1-4.04.98-1.72-.04-3.04-1.79-4.03-3.36C-.21 16.06-.5 10.92 1.36 8.27c1.31-1.86 3.37-2.94 5.3-2.94 1.97 0 3.22 1.08 4.86 1.08 1.59 0 2.56-1.08 4.85-1.08 1.74 0 3.57.95 4.86 2.6-4.27 2.34-3.58 8.42-1.23 9.47z" />
    </svg>
  );
}

function SuccessView({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="py-10 text-center space-y-3">
      <div
        className="mx-auto w-14 h-14 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.5)' }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div className="fc text-xl" style={{ color: '#ffffff' }}>
        {title}
      </div>
      <div className="fi text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
        {sub}
      </div>
    </div>
  );
}
