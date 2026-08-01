'use client';

import { useState } from 'react';
import { useQueuedEffect } from '@/lib/use-queued-effect';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { localeFontFamily } from '@/lib/brand-theme';
import { HOME_LANGS } from '@/lib/home-i18n';
import { loadAppLang, saveAppLang } from '@/lib/calendar-preferences';
import type { AppLang } from '@/lib/app-settings';
import {
  VAULT_HOME_CARD_ROLE,
  VAULT_HOME_LANGS,
  VAULT_HOME_VISIBLE_ORDER,
  type VaultHomeCardKey,
} from '@/lib/vault-home-i18n';

const VAULT_ENTERED_KEY = 'planet-life-vault-entered';

// Vault Home — Decision Intelligence hub entry.
// Enter ritual unlocks card navigation only; it is not Premium entitlement.

export default function VaultPage() {
  const [lang, setLangState] = useState<AppLang>('en');
  const [entered, setEntered] = useState(false);

  useQueuedEffect(() => {
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

  const t = VAULT_HOME_LANGS[lang];
  const dir = HOME_LANGS[lang].dir;
  const fontFamily = localeFontFamily(lang);

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
              'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(212,175,55,0.10), transparent 60%), radial-gradient(ellipse 50% 50% at 50% 100%, rgba(181,148,16,0.06), transparent 60%)',
          }}
        />

        <div className="relative max-w-3xl mx-auto px-6 py-10">
          <div className="text-center mb-10">
            <div
              className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 relative"
              style={{
                background:
                  'radial-gradient(circle, rgba(212,175,55,0.18), rgba(181,148,16,0.06))',
                border: '1px solid rgba(212,175,55,0.35)',
                boxShadow:
                  '0 0 60px rgba(212,175,55,0.25), inset 0 0 0 1px rgba(212,175,55,0.15)',
              }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                <path
                  d="M12 14.5c-.5-1-2-1-2 .2 0 1 1 1.6 2 2.3 1-.7 2-1.3 2-2.3 0-1.2-1.5-1.2-2-.2z"
                  fill="#D4AF37"
                />
              </svg>
            </div>

            <div
              className="fc text-[11px] tracking-[0.3em] mb-3"
              style={{ color: 'rgba(212,175,55,0.7)' }}
            >
              {t.eyebrow}
            </div>
            <h1
              className="fc text-4xl md:text-5xl mb-4"
              style={{
                background: 'linear-gradient(135deg, #F2CF75, #D4AF37)',
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

          <div id="vault-grid" className="mb-8 scroll-mt-6">
            <div
              className="fi text-[11px] tracking-[0.25em] uppercase mb-4 text-center"
              style={{ color: 'rgba(212,175,55,0.55)' }}
            >
              {t.inside}
              {entered && (
                <span
                  className="block mt-2 normal-case tracking-normal text-[11px]"
                  style={{ color: 'rgba(212,175,55,0.75)' }}
                >
                  {t.tapHint}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {VAULT_HOME_VISIBLE_ORDER.map((key: VaultHomeCardKey) => {
                const s = t.cards[key];
                const role = VAULT_HOME_CARD_ROLE[key];
                const isPrimary = role === 'primary';
                const isExperimental = role === 'experimental';
                const card = (
                  <>
                    <div
                      aria-hidden
                      className="absolute top-3 end-3"
                      style={{
                        opacity: entered ? 0 : 0.4,
                        transition: 'opacity 0.4s',
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#D4AF37"
                        strokeWidth="1.5"
                      >
                        <rect x="5" y="11" width="14" height="9" rx="2" />
                        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                      </svg>
                    </div>
                    {entered && !s.badge && (
                      <div
                        aria-hidden
                        className="absolute top-3 end-3"
                        style={{ opacity: 0.7 }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#D4AF37"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                      </div>
                    )}
                    {s.badge ? (
                      <div
                        className="fi text-[10px] tracking-wider uppercase mb-2 inline-flex"
                        data-vault-home-badge={role}
                        style={{
                          color: isPrimary
                            ? 'rgba(242,207,117,0.95)'
                            : 'rgba(212,175,55,0.65)',
                          letterSpacing: '0.14em',
                        }}
                      >
                        {s.badge}
                      </div>
                    ) : null}
                    <h3
                      className={`fc mb-1 ${isPrimary ? 'text-lg' : 'text-base'}`}
                      style={{ color: '#D4AF37', letterSpacing: '0.03em' }}
                    >
                      {s.title}
                    </h3>
                    <div
                      className="fi text-[10px] tracking-wider mb-2"
                      style={{ color: 'rgba(212,175,55,0.5)' }}
                    >
                      {s.sub}
                    </div>
                    <p
                      className={`fi leading-relaxed ${isPrimary ? 'text-sm' : 'text-xs'}`}
                      style={{
                        color: isExperimental
                          ? 'rgba(255,255,255,0.5)'
                          : 'rgba(255,255,255,0.6)',
                      }}
                    >
                      {s.preview}
                    </p>
                    {entered && (
                      <div
                        className="fc text-[11px] tracking-widest mt-3"
                        data-vault-home-cta={key}
                        style={{
                          color: isPrimary
                            ? '#F2CF75'
                            : isExperimental
                              ? 'rgba(212,175,55,0.55)'
                              : 'rgba(212,175,55,0.75)',
                          letterSpacing: '0.12em',
                        }}
                      >
                        {s.cta}
                      </div>
                    )}
                  </>
                );
                const baseClasses = `relative block rounded-xl overflow-hidden no-underline transition-all ${
                  isPrimary ? 'p-5 md:col-span-2' : 'p-4'
                } ${isExperimental ? 'opacity-90' : ''}`;
                const baseStyle = {
                  background: isPrimary
                    ? 'linear-gradient(135deg, rgba(48,28,48,0.72), rgba(22,16,30,0.72))'
                    : 'linear-gradient(135deg, rgba(40,20,40,0.6), rgba(20,14,28,0.6))',
                  border: entered
                    ? isPrimary
                      ? '1px solid rgba(212,175,55,0.42)'
                      : isExperimental
                        ? '1px solid rgba(212,175,55,0.16)'
                        : '1px solid rgba(212,175,55,0.28)'
                    : isPrimary
                      ? '1px solid rgba(212,175,55,0.22)'
                      : '1px solid rgba(212,175,55,0.12)',
                  boxShadow: entered
                    ? isPrimary
                      ? '0 0 28px rgba(212,175,55,0.14), inset 0 0 0 1px rgba(212,175,55,0.1)'
                      : '0 0 24px rgba(212,175,55,0.08), inset 0 0 0 1px rgba(212,175,55,0.06)'
                    : 'inset 0 0 0 1px rgba(212,175,55,0.04), 0 0 24px rgba(212,175,55,0.04)',
                  cursor: entered ? 'pointer' : 'default',
                };
                return entered ? (
                  <Link
                    key={key}
                    href={`/vault/${key}`}
                    className={`${baseClasses} hover:scale-[1.01]`}
                    style={baseStyle}
                    data-vault-home-card={key}
                    data-vault-home-role={role}
                  >
                    {card}
                  </Link>
                ) : (
                  <div
                    key={key}
                    className={baseClasses}
                    style={baseStyle}
                    data-vault-home-card={key}
                    data-vault-home-role={role}
                  >
                    {card}
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="rounded-xl p-4 mb-8 text-center"
            style={{
              background: 'rgba(212,175,55,0.04)',
              border: '1px solid rgba(212,175,55,0.12)',
            }}
          >
            <p
              className="fi text-xs leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              {t.promise}
            </p>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={handleEnter}
              disabled={entered}
              className="fc text-sm tracking-widest no-underline px-8 py-3.5 rounded-xl inline-flex items-center gap-2 transition-all hover:scale-[1.02]"
              style={{
                background: entered
                  ? 'linear-gradient(135deg, rgba(11,23,54,0.95), rgba(10,15,28,0.95))'
                  : 'linear-gradient(135deg, rgba(212,175,55,0.3), rgba(181,148,16,0.28))',
                border: entered
                  ? '1px solid rgba(212,175,55,0.45)'
                  : '1px solid rgba(212,175,55,0.5)',
                color: '#F2CF75',
                boxShadow: entered
                  ? '0 0 24px rgba(212,175,55,0.18)'
                  : '0 0 30px rgba(212,175,55,0.3), inset 0 0 0 1px rgba(255,255,255,0.05)',
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
