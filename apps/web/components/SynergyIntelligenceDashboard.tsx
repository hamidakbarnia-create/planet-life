'use client';

import type { AppLang } from '@/lib/app-settings';
import type { SynergyBadge } from '@/lib/people-storage';
import { BADGE_STYLES } from '@/lib/synergy';
import {
  dashboardSectionLabels,
  type SynergyDashboardView,
} from '@/lib/synastry-dashboard';
import { formatEvidenceLabel, formatImportanceLabel } from '@/lib/synastry-dashboard-i18n';
import { SynergyBadgePill } from '@/components/SynergyBadge';

export interface SynergyIntelligenceDashboardProps {
  view: SynergyDashboardView;
  lang: AppLang;
  badgeLabel: string;
  dir?: 'ltr' | 'rtl';
}

function scoreTone(value: number): string {
  if (value >= 70) return '#4ade80';
  if (value >= 45) return '#fbbf24';
  return '#f87171';
}

function importanceColor(level: 'high' | 'medium' | 'low'): string {
  if (level === 'high') return '#fbbf24';
  if (level === 'medium') return '#a78bfa';
  return 'rgba(255,255,255,0.35)';
}

function DashboardSection({
  title,
  accent,
  testId,
  children,
}: {
  title: string;
  accent: string;
  testId: string;
  children: React.ReactNode;
}) {
  return (
    <section
      data-testid={testId}
      className="rounded-2xl p-4"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <h2 className="fc text-xs tracking-wider mb-3" style={{ color: accent }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function IntelBar({ label, pct, icon }: { label: string; pct: number; icon: string }) {
  return (
    <div data-testid={`intel-${label}`}>
      <div className="flex items-center justify-between mb-1 gap-2">
        <span className="fi text-xs text-white/75 truncate">
          <span className="mr-1.5 opacity-70">{icon}</span>
          {label}
        </span>
        <span className="fc text-xs shrink-0" style={{ color: scoreTone(pct) }}>
          {pct}%
        </span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: scoreTone(pct) }}
        />
      </div>
    </div>
  );
}

function FactorCard({
  card,
  tone,
  lang,
}: {
  card: SynergyDashboardView['strengths'][number];
  tone: 'positive' | 'negative';
  lang: AppLang;
}) {
  const accent = tone === 'positive' ? '#4ade80' : '#f87171';
  const sign = card.scoreContribution > 0 ? '+' : '';
  return (
    <article
      data-testid={`factor-card-${card.id}`}
      className="rounded-xl px-3 py-2.5"
      style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${accent}22` }}
    >
      <div className="flex items-start gap-2">
        <span className="text-sm opacity-80 mt-0.5">{card.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="fi text-xs text-white/85">{card.title}</h3>
            <span className="fc text-xs shrink-0" style={{ color: accent }}>
              {sign}
              {card.scoreContribution.toFixed(1)}
            </span>
          </div>
          <p className="fi text-[11px] leading-relaxed text-white/45 mt-1">{card.explanation}</p>
          <p className="fi text-[10px] text-white/25 mt-1" data-testid={`evidence-link-${card.evidenceId}`}>
            → {formatEvidenceLabel(lang, card.evidenceId)}
          </p>
        </div>
      </div>
    </article>
  );
}

function RecommendationList({
  items,
  accent,
  groupId,
  lang,
}: {
  items: Array<{ text: string; evidenceIds: string[] }>;
  accent: string;
  groupId: string;
  lang: AppLang;
}) {
  if (items.length === 0) {
    return <p className="fi text-[11px] text-white/30">—</p>;
  }
  return (
    <ul className="space-y-2" data-testid={`rec-group-${groupId}`}>
      {items.map((item, i) => (
        <li
          key={`${groupId}-${i}`}
          className="rounded-lg px-3 py-2"
          style={{ background: 'rgba(255,255,255,0.02)', borderInlineStart: `2px solid ${accent}` }}
        >
          <p className="fi text-xs text-white/70">{item.text}</p>
          {item.evidenceIds.length > 0 && (
            <p className="fi text-[10px] text-white/30 mt-1">
              {item.evidenceIds.map((id) => formatEvidenceLabel(lang, id)).join(' · ')}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

export function SynergyIntelligenceDashboard({
  view,
  lang,
  badgeLabel,
  dir = 'ltr',
}: SynergyIntelligenceDashboardProps) {
  const labels = dashboardSectionLabels(lang);
  const badgeStyle = BADGE_STYLES[view.overall.badge as SynergyBadge];

  return (
    <div className="space-y-4" dir={dir} data-testid="synergy-intelligence-dashboard">
      <DashboardSection title={labels.overall} accent={badgeStyle.text} testId="section-overall">
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: badgeStyle.bg, border: `1px solid ${badgeStyle.border}` }}
        >
          <div className="fc text-4xl mb-1" style={{ color: badgeStyle.text }}>
            {view.overall.score}
          </div>
          <SynergyBadgePill badge={view.overall.badge} label={badgeLabel} />
          <div className="grid grid-cols-2 gap-3 mt-4 text-start">
            <div>
              <div className="fi text-[10px] uppercase tracking-wide text-white/35">{labels.confidence}</div>
              <div className="fc text-sm text-white/80">{Math.round(view.overall.confidence * 100)}%</div>
            </div>
            <div>
              <div className="fi text-[10px] uppercase tracking-wide text-white/35">{labels.profile}</div>
              <div className="fi text-sm text-white/80" data-testid="dashboard-profile-label">
                {view.overall.profileLabel}
              </div>
            </div>
          </div>
          <p className="fi text-xs leading-relaxed text-white/55 mt-3 text-start">{view.overall.summary}</p>
        </div>
      </DashboardSection>

      <DashboardSection title={labels.strengths} accent="#4ade80" testId="section-strengths">
        <div className="space-y-2">
          {view.strengths.length === 0 ? (
            <p className="fi text-[11px] text-white/35">{labels.noStrengths}</p>
          ) : (
            view.strengths.map((card) => (
              <FactorCard key={card.id} card={card} tone="positive" lang={lang} />
            ))
          )}
        </div>
      </DashboardSection>

      <DashboardSection title={labels.risks} accent="#f87171" testId="section-risks">
        <div className="space-y-2">
          {view.risks.length === 0 ? (
            <p className="fi text-[11px] text-white/35">{labels.noRisks}</p>
          ) : (
            view.risks.map((card) => (
              <FactorCard key={card.id} card={card} tone="negative" lang={lang} />
            ))
          )}
        </div>
      </DashboardSection>

      <DashboardSection
        title={view.sectionTitle}
        accent="#a78bfa"
        testId="section-profile-intelligence"
      >
        <div className="space-y-3" data-testid="profile-intelligence-grid">
          {view.profileIntelligence.map((item) => (
            <IntelBar key={item.key} label={item.label} pct={item.pct} icon={item.icon} />
          ))}
        </div>
      </DashboardSection>

      <DashboardSection title={labels.recommendations} accent="#fbbf24" testId="section-recommendations">
        <div className="space-y-4">
          <div>
            <h3 className="fi text-[10px] uppercase tracking-wide text-emerald-400/80 mb-2">{labels.doMore}</h3>
            <RecommendationList items={view.recommendations.doMore} accent="#4ade80" groupId="do-more" lang={lang} />
          </div>
          <div>
            <h3 className="fi text-[10px] uppercase tracking-wide text-amber-400/80 mb-2">{labels.watchCarefully}</h3>
            <RecommendationList
              items={view.recommendations.watchCarefully}
              accent="#fbbf24"
              groupId="watch"
              lang={lang}
            />
          </div>
          <div>
            <h3 className="fi text-[10px] uppercase tracking-wide text-red-400/80 mb-2">{labels.avoid}</h3>
            <RecommendationList items={view.recommendations.avoid} accent="#f87171" groupId="avoid" lang={lang} />
          </div>
        </div>
      </DashboardSection>

      <DashboardSection title={labels.evidence} accent="#c4b5fd" testId="section-evidence">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="fi text-[10px] uppercase tracking-wide text-white/35">
                <th className="pb-2 pr-2 font-normal">{labels.planet}</th>
                <th className="pb-2 pr-2 font-normal">{labels.aspect}</th>
                <th className="pb-2 pr-2 font-normal">{labels.house}</th>
                <th className="pb-2 pr-2 font-normal">{labels.orb}</th>
                <th className="pb-2 font-normal">{labels.importance}</th>
              </tr>
            </thead>
            <tbody>
              {view.evidence.map((row) => (
                <tr
                  key={row.id}
                  data-testid={row.id}
                  className="border-t border-white/5 fi text-[11px] text-white/60"
                >
                  <td className="py-2 pr-2">{row.planet}</td>
                  <td className="py-2 pr-2">{row.aspect}</td>
                  <td className="py-2 pr-2">{row.house}</td>
                  <td className="py-2 pr-2">{row.orb.toFixed(1)}°</td>
                  <td className="py-2" style={{ color: importanceColor(row.importance) }}>
                    {formatImportanceLabel(lang, row.importance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardSection>
    </div>
  );
}
