'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import { isAuthed, saveSession, type AuthMethod } from '@/lib/auth';
import { BRAND_I18N } from '@/lib/brand';
import type { BrandLang } from '@/lib/brand';
import { localeFcFiCss, localeFontFamily } from '@/lib/brand-theme';
import { trackFtueEvent } from '@/lib/ftue-analytics';
import { LOGIN_FTUE_COPY } from '@/lib/ftue-i18n';
import { resolvePostAuthPath } from '@/lib/ftue-routing';
import { useQueuedEffect } from '@/lib/use-queued-effect';

type Tab = 'email' | 'phone';
type Step = 'identifier' | 'code' | 'success';

const LANGS = {
  en: {
    dir: 'ltr',
    name: 'EN',
    tagline: BRAND_I18N.en.tagline,
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
    resend: 'Resend code',
    back: 'Change email or phone',
    successTitle: 'You are signed in',
    successSub: 'Continuing your setup…',
    orContinue: 'or continue with',
    google: 'Continue with Google',
    apple: 'Continue with Apple',
    magicHint: 'We will send a one-time code when you tap Send code.',
    invalidEmail: 'Please enter a valid email.',
    invalidPhone: 'Please enter a valid phone number.',
    invalidCode: 'Enter the 6-digit code.',
  },
  ru: {
    dir: 'ltr',
    name: 'RU',
    tagline: BRAND_I18N.ru.tagline,
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
    back: 'Изменить email или телефон',
    successTitle: 'Вы вошли',
    successSub: 'Продолжаем настройку…',
    orContinue: 'или продолжите через',
    google: 'Войти через Google',
    apple: 'Войти через Apple',
    magicHint: 'Одноразовый код отправим по нажатию «Отправить код».',
    invalidEmail: 'Введите корректный email.',
    invalidPhone: 'Введите корректный номер.',
    invalidCode: 'Введите 6-значный код.',
  },
  fa: {
    dir: 'rtl',
    name: 'FA',
    tagline: BRAND_I18N.fa.tagline,
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
    back: 'تغییر ایمیل یا موبایل',
    successTitle: 'وارد شدید',
    successSub: 'ادامهٔ راه‌اندازی…',
    orContinue: 'یا ادامه با',
    google: 'ورود با گوگل',
    apple: 'ورود با اپل',
    magicHint: 'با لمس «ارسال کد» کد یک‌بارمصرف می‌فرستیم.',
    invalidEmail: 'یک ایمیل معتبر وارد کنید.',
    invalidPhone: 'یک شمارهٔ معتبر وارد کنید.',
    invalidCode: 'کد ۶ رقمی را وارد کنید.',
  },
  ar: {
    dir: 'rtl',
    name: 'AR',
    tagline: BRAND_I18N.ar.tagline,
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
    back: 'تغيير البريد أو الهاتف',
    successTitle: 'تم تسجيل الدخول',
    successSub: 'متابعة الإعداد…',
    orContinue: 'أو تابع باستخدام',
    google: 'المتابعة بحساب Google',
    apple: 'المتابعة بحساب Apple',
    magicHint: 'نرسل رمزاً لمرة واحدة عند النقر على «إرسال الرمز».',
    invalidEmail: 'الرجاء إدخال بريد صحيح.',
    invalidPhone: 'الرجاء إدخال رقم صحيح.',
    invalidCode: 'أدخل الرمز المكون من ٦ أرقام.',
  },
} as const;

type LangKey = keyof typeof LANGS;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AUTH_SEND_KEY = 'planet-life-ftue-auth-sends';
const MAX_SENDS = 3;
const SEND_WINDOW_MS = 15 * 60 * 1000;

function canSendAuthCode(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = sessionStorage.getItem(AUTH_SEND_KEY);
    const times: number[] = raw ? (JSON.parse(raw) as number[]) : [];
    const recent = times.filter((t) => Date.now() - t < SEND_WINDOW_MS);
    return recent.length < MAX_SENDS;
  } catch {
    return true;
  }
}

function recordAuthSend(): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = sessionStorage.getItem(AUTH_SEND_KEY);
    const times: number[] = raw ? (JSON.parse(raw) as number[]) : [];
    const recent = times.filter((t) => Date.now() - t < SEND_WINDOW_MS);
    recent.push(Date.now());
    sessionStorage.setItem(AUTH_SEND_KEY, JSON.stringify(recent));
  } catch {
    /* non-blocking */
  }
}

export function LoginScreen() {
  const router = useRouter();
  const [lang, setLang] = useState<LangKey>('en');
  const [tab, setTab] = useState<Tab>('email');
  const [step, setStep] = useState<Step>('identifier');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [oauthNotice, setOauthNotice] = useState('');
  const [ready, setReady] = useState(false);
  const identifierRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  const t = LANGS[lang];
  const ftue = LOGIN_FTUE_COPY;
  const identifier = tab === 'email' ? email : phone;

  useQueuedEffect(() => {
    const stored = localStorage.getItem('planet-life-lang');
    if (stored === 'en' || stored === 'ru' || stored === 'fa' || stored === 'ar') {
      setLang(stored);
    }
    if (isAuthed()) {
      router.replace(resolvePostAuthPath());
      return;
    }
    setReady(true);
    trackFtueEvent('ftue_login_view');
  }, [router]);

  useEffect(() => {
    if (step === 'identifier') identifierRef.current?.focus();
    if (step === 'code') codeRef.current?.focus();
  }, [step]);

  const setLangAndStore = (l: LangKey) => {
    setLang(l);
    localStorage.setItem('planet-life-lang', l);
  };

  const finishAuth = () => {
    trackFtueEvent('ftue_auth_complete', { method: tab });
    setStep('success');
    const dest = resolvePostAuthPath();
    setTimeout(() => router.replace(dest), 900);
  };

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
    if (!canSendAuthCode()) {
      setError(ftue.rateLimited);
      trackFtueEvent('ftue_auth_rate_limited', { tab });
      return;
    }
    setBusy(true);
    recordAuthSend();
    trackFtueEvent('ftue_auth_send_code', { tab });
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
    trackFtueEvent('ftue_auth_verify_attempt', { tab });
    await new Promise((r) => setTimeout(r, 600));
    saveSession({
      method: tab,
      identifier: identifier.trim(),
      verifiedAt: Date.now(),
    });
    setBusy(false);
    finishAuth();
  };

  const handleOAuth = (method: Extract<AuthMethod, 'google' | 'apple'>) => {
    setOauthNotice(ftue.oauthSoon);
    trackFtueEvent('ftue_auth_oauth_unavailable', { provider: method });
  };

  if (!ready) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#070B14' }}
        aria-busy="true"
      />
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        direction: t.dir as 'ltr' | 'rtl',
        background: 'radial-gradient(circle at top, #1a1240 0%, #070B14 55%)',
        fontFamily: localeFontFamily(lang),
      }}
    >
      <style>{`
        ${localeFcFiCss(lang)}
        .login-input{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:#fff;border-radius:12px}
        .login-input:focus{border-color:rgba(251,191,36,0.45);outline:none}
        .login-input:focus-visible,.login-btn:focus-visible,.login-tab:focus-visible{outline:2px solid #fbbf24;outline-offset:2px}
        .otp-input{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:#fff;border-radius:10px;text-align:center;font-family:inherit;font-size:18px;font-weight:500}
      `}</style>

      <header className="flex items-center justify-between px-6 py-5">
        <BrandLogo lang={lang as BrandLang} href="/welcome" size="md" showTagline />
        <div
          className="flex gap-1"
          role="group"
          aria-label="Language"
        >
          {(Object.keys(LANGS) as LangKey[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLangAndStore(l)}
              aria-pressed={lang === l}
              className="login-tab fi px-2.5 py-1 text-xs rounded-md border transition-all"
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

      <main
        id="login-main"
        className="flex-1 flex items-center justify-center px-4 py-6"
        aria-labelledby="login-title"
      >
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
                <h1 id="login-title" className="fc text-2xl" style={{ color: '#ffffff' }}>
                  {ftue.title}
                </h1>
                <p className="fi text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {ftue.sub}
                </p>
              </div>

              {oauthNotice && (
                <p className="fi text-xs text-center" role="status" style={{ color: '#fbbf24' }}>
                  {oauthNotice}
                </p>
              )}

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
                      htmlFor="login-identifier"
                      className="fi text-[11px] uppercase tracking-widest"
                      style={{ color: 'rgba(255,255,255,0.45)' }}
                    >
                      {tab === 'email' ? t.emailLabel : t.phoneLabel}
                    </label>
                    {tab === 'email' ? (
                      <input
                        ref={identifierRef}
                        id="login-identifier"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendCode()}
                        placeholder={t.emailPlaceholder}
                        className="login-input w-full px-4 py-3 fi text-sm"
                        autoComplete="email"
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? 'login-error' : undefined}
                      />
                    ) : (
                      <input
                        ref={identifierRef}
                        id="login-identifier"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendCode()}
                        placeholder={t.phonePlaceholder}
                        className="login-input w-full px-4 py-3 fi text-sm"
                        autoComplete="tel"
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? 'login-error' : undefined}
                      />
                    )}
                    {error && (
                      <div id="login-error" className="fi text-xs" role="alert" style={{ color: '#fca5a5' }}>
                        {error}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={sendCode}
                    disabled={busy}
                    className="login-btn w-full py-3 rounded-xl fc text-sm tracking-widest disabled:opacity-50"
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
                  codeRef={codeRef}
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
                    void sendCode();
                  }}
                  onBack={() => {
                    setStep('identifier');
                    setCode('');
                    setError('');
                  }}
                />
              )}

              <p className="fi text-[11px] text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {ftue.termsPrefix}{' '}
                <Link href="/terms" className="underline hover:text-white/55">
                  {ftue.termsLink}
                </Link>{' '}
                {ftue.privacyMid}{' '}
                <Link href="/privacy" className="underline hover:text-white/55">
                  {ftue.privacyLink}
                </Link>
                .
              </p>

              <p className="text-center">
                <Link
                  href="/welcome"
                  className="fi text-xs underline hover:text-white/70"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                  ← {ftue.backWelcome}
                </Link>
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
      role="tablist"
      aria-label="Sign-in method"
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
            role="tab"
            id={`login-tab-${k}`}
            aria-selected={active}
            aria-controls="login-identifier-panel"
            onClick={() => setTab(k)}
            className="login-tab fi text-xs py-2 rounded-lg tracking-wide transition-colors"
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
  codeRef,
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
  codeRef: React.RefObject<HTMLInputElement | null>;
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
    <div className="space-y-4" id="login-identifier-panel" role="tabpanel">
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
          htmlFor="login-code"
          className="fi text-[11px] uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          {label}
        </label>
        <div className="relative">
          <input
            ref={codeRef}
            id="login-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onVerify()}
            maxLength={6}
            className="login-input w-full px-4 py-3 fi text-lg tracking-[0.4em] text-center"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'login-code-error' : 'login-code-hint'}
          />
          <p id="login-code-hint" className="sr-only">
            Enter 6 digits. Boxes below mirror your input.
          </p>
          <div className="grid grid-cols-6 gap-2 mt-3" style={{ direction: 'ltr' }} aria-hidden="true">
            {digits.map((d, i) => (
              <div
                key={i}
                className="otp-input h-12 flex items-center justify-center"
                style={d.trim() ? { borderColor: 'rgba(251,191,36,0.45)' } : undefined}
              >
                {d.trim() || ''}
              </div>
            ))}
          </div>
        </div>
        {error && (
          <div id="login-code-error" className="fi text-xs" role="alert" style={{ color: '#fca5a5' }}>
            {error}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onVerify}
        disabled={busy}
        className="login-btn w-full py-3 rounded-xl fc text-sm tracking-widest disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg,#d97706,#f59e0b)', color: '#0A0E1A' }}
      >
        {busy ? verifying : verify}
      </button>

      <div className="flex justify-between fi text-xs">
        <button
          type="button"
          onClick={onBack}
          className="login-btn underline-offset-2 hover:underline"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          ← {back}
        </button>
        <button
          type="button"
          onClick={onResend}
          className="login-btn underline-offset-2 hover:underline"
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
    <div className="flex items-center gap-3" role="separator">
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
      aria-label={label}
      className="login-btn w-full py-3 rounded-xl fi text-sm flex items-center justify-center gap-3 disabled:opacity-50 transition-colors"
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
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
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
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor">
      <path d="M16.365 1.43c0 1.14-.46 2.22-1.21 3.02-.8.85-2.1 1.5-3.16 1.42-.13-1.1.42-2.27 1.18-3.06.8-.88 2.18-1.5 3.19-1.38zM20 17.4c-.55 1.27-.82 1.84-1.53 2.97-.99 1.57-2.38 3.52-4.1 3.54-1.53.02-1.93-1-4-1-2.07 0-2.5 1-4.04.98-1.72-.04-3.04-1.79-4.03-3.36C-.21 16.06-.5 10.92 1.36 8.27c1.31-1.86 3.37-2.94 5.3-2.94 1.97 0 3.22 1.08 4.86 1.08 1.59 0 2.56-1.08 4.85-1.08 1.74 0 3.57.95 4.86 2.6-4.27 2.34-3.58 8.42-1.23 9.47z" />
    </svg>
  );
}

function SuccessView({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="py-10 text-center space-y-3" role="status" aria-live="polite">
      <div
        className="mx-auto w-14 h-14 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.5)' }}
        aria-hidden="true"
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
