import type { ReactNode } from 'react';
import type { LandingPreviewModule, LandingPreviewModuleId } from '@/lib/landing-i18n';
import { COLORS, COLORS_RGBA } from '@/lib/brand-theme';

function PreviewFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className="overflow-hidden rounded-lg border"
      style={{
        borderColor: COLORS_RGBA.white08,
        background: 'rgba(255,255,255,0.03)',
      }}
    >
      <div
        className="flex items-center gap-1.5 border-b px-3 py-2"
        style={{ borderColor: COLORS_RGBA.white08, background: 'rgba(0,0,0,0.25)' }}
      >
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function TodayMock() {
  return (
    <PreviewFrame>
      <div className="mb-2 text-[10px] uppercase tracking-widest text-white/40">Today</div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold text-white">72</div>
          <div className="text-[11px] text-white/45">Decision score</div>
        </div>
        <div className="text-right text-[11px] leading-snug text-white/55">
          Supported window
          <br />
          <span style={{ color: '#93B4FF' }}>10:00 – 14:00</span>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
        <div className="h-full w-[72%] rounded-full" style={{ background: COLORS.royalBlue }} />
      </div>
    </PreviewFrame>
  );
}

function CalendarMock() {
  const cells = [42, 58, 71, 65, 48, 82, 55, 61, 74, 39, 68, 77];
  return (
    <PreviewFrame>
      <div className="mb-2 text-[10px] uppercase tracking-widest text-white/40">Calendar</div>
      <div className="grid grid-cols-6 gap-1">
        {cells.map((score, i) => (
          <div
            key={i}
            className="flex h-7 items-center justify-center rounded text-[10px] font-medium"
            style={{
              background: `rgba(48,92,222,${Math.max(0.08, score / 120)})`,
              color: score > 70 ? '#93B4FF' : 'rgba(255,255,255,0.45)',
            }}
          >
            {score}
          </div>
        ))}
      </div>
    </PreviewFrame>
  );
}

function AskMock() {
  return (
    <PreviewFrame>
      <div className="mb-2 text-[10px] uppercase tracking-widest text-white/40">Ask</div>
      <p className="mb-2 text-xs text-white/75">Should I sign the contract this week?</p>
      <div className="flex items-center justify-between rounded-md px-2.5 py-2" style={{ background: COLORS_RGBA.royalBlue12 }}>
        <span className="text-[11px] text-white/55">Score</span>
        <span className="text-sm font-semibold" style={{ color: '#93B4FF' }}>
          68
        </span>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-white/45">
        Reasoning available · 3 evidence points
      </p>
    </PreviewFrame>
  );
}

function PeopleMock() {
  const names = ['A', 'M', 'S'];
  return (
    <PreviewFrame>
      <div className="mb-2 text-[10px] uppercase tracking-widest text-white/40">People</div>
      <div className="flex gap-2">
        {names.map((initial) => (
          <div key={initial} className="flex flex-col items-center gap-1">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold"
              style={{ background: COLORS_RGBA.royalBlue12, color: '#93B4FF' }}
            >
              {initial}
            </div>
            <span className="text-[9px] text-white/40">Context</span>
          </div>
        ))}
      </div>
    </PreviewFrame>
  );
}

function JuliaMock() {
  return (
    <PreviewFrame>
      <div className="mb-2 text-[10px] uppercase tracking-widest text-white/40">Julia</div>
      <p className="text-xs leading-relaxed text-white/65">
        Private session · context behind the score
      </p>
      <div
        className="mt-2 inline-flex rounded-md px-2 py-1 text-[10px]"
        style={{ background: 'rgba(34,197,94,0.12)', color: '#86efac', border: '1px solid rgba(34,197,94,0.35)' }}
      >
        Verified guidance
      </div>
    </PreviewFrame>
  );
}

const PREVIEW_MOCKS: Record<LandingPreviewModuleId, () => ReactNode> = {
  today: TodayMock,
  calendar: CalendarMock,
  ask: AskMock,
  people: PeopleMock,
  julia: JuliaMock,
};

type LandingProductPreviewProps = {
  title: string;
  modules: LandingPreviewModule[];
};

export function LandingProductPreview({ title, modules }: LandingProductPreviewProps) {
  return (
    <section
      id="features"
      aria-labelledby="landing-preview-heading"
      className="border-t px-5 py-14 md:px-8 md:py-20"
      style={{ borderColor: COLORS_RGBA.white08 }}
    >
      <div className="mx-auto max-w-6xl">
        <h2 id="landing-preview-heading" className="mb-10 text-center text-2xl font-semibold md:mb-12">
          {title}
        </h2>
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => {
            const Mock = PREVIEW_MOCKS[module.id];
            return (
              <li key={module.id} className="flex flex-col gap-3">
                <Mock />
                <div>
                  <h3 className="mb-1 text-sm font-medium text-white/90">{module.title}</h3>
                  <p className="text-sm leading-relaxed text-white/50">{module.description}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
