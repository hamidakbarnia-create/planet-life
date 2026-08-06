import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import type { LegalPageContent } from '@/lib/legal-content';
import { SiteFooter } from '@/components/SiteFooter';
type LegalPageShellProps = {
  content: LegalPageContent;
};

export function LegalPageShell({ content }: LegalPageShellProps) {
  return (
    <div
      className="min-h-screen flex flex-col bg-[#0A0E1A] text-white"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Inter:wght@300;400;500&display=swap');
        .fc{font-family:'Cinzel',serif}
        .fi{font-family:'Inter',sans-serif}
      `}</style>

      <header className="flex items-center justify-between px-6 py-5 border-b border-white/5">
        <BrandLogo href="/" size="md" showTagline />
        <Link
          href="/home"
          className="fi text-xs px-3 py-1.5 rounded-md border transition-colors no-underline"
          style={{
            borderColor: 'rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.55)',
          }}
        >
          Open app
        </Link>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-10">
        <p
          className="fi text-[10px] uppercase tracking-widest mb-3"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          Last updated: {content.lastUpdated}
        </p>
        <h1 className="fc text-2xl tracking-wide mb-4" style={{ color: '#fbbf24' }}>
          {content.title}
        </h1>
        {content.intro ? (
          <p
            className="fi text-sm leading-relaxed mb-8"
            style={{ color: 'rgba(255,255,255,0.72)' }}
          >
            {content.intro}
          </p>
        ) : null}

        <div className="space-y-8">
          {content.sections.map((section) => (
            <section key={section.heading}>
              <h2
                className="fc text-base tracking-wide mb-3"
                style={{ color: 'rgba(255,255,255,0.92)' }}
              >
                {section.heading}
              </h2>
              <div className="space-y-3">
                {section.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="fi text-sm leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.65)' }}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
