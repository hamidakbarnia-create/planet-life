'use client';

import Link from 'next/link';
import { BottomNav } from './BottomNav';

type LangKey = 'en' | 'ru' | 'fa' | 'ar';

const LANG_OPTIONS: { key: LangKey; name: string }[] = [
  { key: 'en', name: 'EN' },
  { key: 'ru', name: 'RU' },
  { key: 'fa', name: 'FA' },
  { key: 'ar', name: 'AR' },
];

export function AppShell({
  children,
  lang,
  setLang,
  dir,
  navLabels,
  fontFamily,
}: {
  children: React.ReactNode;
  lang: LangKey;
  setLang: (l: LangKey) => void;
  dir: 'ltr' | 'rtl';
  navLabels?: Record<string, string>;
  fontFamily?: string;
}) {
  return (
    <div
      style={{
        direction: dir,
        fontFamily: fontFamily ?? 'Inter, sans-serif',
      }}
      className="min-h-screen bg-[#070B14] text-white pb-20"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Inter:wght@300;400;500&display=swap');
        @import url('https://fonts.googleapis.com/earlyaccess/vazirmatn.css');
        .fc{font-family:'Cinzel',serif}
        .fi{font-family:'Inter',sans-serif}
      `}</style>

      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link href="/home" className="flex items-center gap-3 no-underline">
          <svg width="28" height="28" viewBox="0 0 30 30" fill="none">
            <circle cx="15" cy="15" r="13" stroke="#fbbf24" strokeWidth="0.5" opacity="0.4" />
            <circle cx="15" cy="15" r="7" stroke="#fbbf24" strokeWidth="0.5" opacity="0.6" />
            <circle cx="15" cy="15" r="2.5" fill="#fbbf24" />
          </svg>
          <span className="fc text-sm tracking-widest" style={{ color: '#fbbf24' }}>
            Planet Life
          </span>
        </Link>
        <div className="flex gap-1">
          {LANG_OPTIONS.map((l) => (
            <button
              key={l.key}
              type="button"
              onClick={() => setLang(l.key)}
              className="fi px-2.5 py-1 text-xs rounded-md border transition-all"
              style={
                lang === l.key
                  ? {
                      borderColor: 'rgba(251,191,36,0.5)',
                      color: '#fbbf24',
                      background: 'rgba(251,191,36,0.06)',
                    }
                  : {
                      borderColor: 'rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.3)',
                    }
              }
            >
              {l.name}
            </button>
          ))}
        </div>
      </header>

      <main>{children}</main>
      <BottomNav labels={navLabels} />
    </div>
  );
}
