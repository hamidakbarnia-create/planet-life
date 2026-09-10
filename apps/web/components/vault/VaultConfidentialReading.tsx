'use client';

import type { CSSProperties, ReactNode } from 'react';
import type { AppLang } from '@/lib/app-settings';
import type { VaultReadingLayer } from '@/lib/vault-reading';
import {
  confidenceMeterSteps,
  parseConfidenceLevel,
  presentVaultReading,
  sanitizeVaultReadingProse,
  shapeVaultReadingUxV2,
  type VaultReadingPresentationCopy,
} from '@/lib/vault-reading-presentation';

type Props = {
  lang: AppLang;
  reading: VaultReadingLayer;
  labels: VaultReadingPresentationCopy;
  /** Optional advisory confidence line already localized by the caller. */
  confidenceLabel?: string | null;
  /** Optional caller-formatted window value for the hero (no Top Days coupling). */
  bestWindowLabel?: string | null;
  /** Existing localized label reused above bestWindowLabel (e.g. topDays). */
  bestWindowLabelTitle?: string | null;
  /** Optional generic slot rendered after the hero. */
  windowsSlot?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

const LABEL: CSSProperties = {
  color: 'rgba(212,175,55,0.55)',
};

const BODY: CSSProperties = {
  color: 'rgba(255,255,255,0.9)',
};

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div
      className="fi text-[10px] uppercase tracking-[0.16em] mb-2"
      style={LABEL}
    >
      {children}
    </div>
  );
}

function BulletList({
  items,
  testId,
  warning,
  checklist,
}: {
  items: string[];
  testId: string;
  warning?: boolean;
  checklist?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <ul className="m-0 p-0 list-none space-y-1.5" data-testid={testId}>
      {items.map((item) => (
        <li
          key={item}
          className="fi text-xs leading-snug flex gap-2"
          style={warning ? { color: 'rgba(242, 180, 120, 0.92)' } : BODY}
        >
          <span
            aria-hidden
            className="shrink-0 mt-[0.35em]"
            style={{
              width: checklist ? 6 : 4,
              height: checklist ? 6 : 4,
              borderRadius: checklist ? 2 : 999,
              border: checklist
                ? '1px solid rgba(212,175,55,0.55)'
                : undefined,
              background: warning
                ? 'rgba(242,180,120,0.55)'
                : checklist
                  ? 'transparent'
                  : 'rgba(212,175,55,0.55)',
            }}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ConfidenceMeter({
  level,
}: {
  level: 'high' | 'medium' | 'low';
}) {
  const steps = confidenceMeterSteps(level);
  if (steps == null) return null;
  return (
    <div
      className="flex gap-1"
      data-testid="vault-reading-confidence-bar"
      data-confidence-level={level}
      aria-hidden
    >
      {([1, 2, 3] as const).map((step) => (
        <div
          key={step}
          className="h-1 flex-1 rounded-full"
          style={{
            background:
              step <= steps
                ? 'rgba(212,175,55,0.75)'
                : 'rgba(255,255,255,0.08)',
          }}
        />
      ))}
    </div>
  );
}

/**
 * Confidential reading presentation: Decision Intelligence hierarchy.
 * Never renders technical layer, producer keys, or engine vocabulary.
 */
export function VaultConfidentialReading({
  lang,
  reading,
  labels,
  confidenceLabel,
  bestWindowLabel,
  bestWindowLabelTitle,
  windowsSlot,
  className,
  style,
}: Props) {
  // New symbolic responses are already structured and localized. Do not run
  // their interpretation/limitation through the legacy sentence filter: it
  // removes explained astrology themes and can silently erase safety context.
  if (reading.evidence_status === 'unvalidated') {
    const copy = {
      en: {
        evidence: 'Predictive validity has not been established.',
        complete: 'Required inputs are complete; this does not validate a prediction.',
        supplied_unverified: 'Required birth details are supplied but unverified.',
        incomplete: 'Some required birth details are missing.',
        not_assessed: 'Input completeness has not been assessed.',
        strongest: 'Strongest symbolic window', secondary: 'Secondary windows',
      },
      ru: {
        evidence: 'Предсказательная достоверность не подтверждена.',
        complete: 'Все необходимые данные есть; это не подтверждает прогноз.',
        supplied_unverified: 'Необходимые данные рождения указаны, но не проверены.',
        incomplete: 'Часть необходимых данных рождения отсутствует.',
        not_assessed: 'Полнота данных не оценивалась.',
        strongest: 'Наиболее выраженное символическое окно', secondary: 'Другие окна',
      },
      fa: {
        evidence: 'اعتبار پیش‌بینی تأیید نشده است.',
        complete: 'اطلاعات لازم کامل است؛ این به معنای تأیید پیش‌بینی نیست.',
        supplied_unverified: 'اطلاعات لازمِ تولد وارد شده، اما راستی‌آزمایی نشده است.',
        incomplete: 'بخشی از اطلاعات لازمِ تولد وارد نشده است.',
        not_assessed: 'کامل‌بودن اطلاعات بررسی نشده است.',
        strongest: 'قوی‌ترین بازه از نظر نمادین', secondary: 'بازه‌های دیگر',
      },
      ar: {
        evidence: 'لم تثبت صلاحية هذه القراءة للتنبؤ.',
        complete: 'البيانات المطلوبة مكتملة؛ وهذا لا يثبت صحة التنبؤ.',
        supplied_unverified: 'بيانات الميلاد المطلوبة متوفرة، لكنها غير متحقق منها.',
        incomplete: 'بعض بيانات الميلاد المطلوبة غير متوفرة.',
        not_assessed: 'لم يُقيَّم اكتمال البيانات.',
        strongest: 'الفترة الأقوى رمزياً', secondary: 'فترات أخرى',
      },
    }[lang];
    return (
      <div className={className} style={style} dir={lang === 'fa' || lang === 'ar' ? 'rtl' : 'ltr'}
        data-testid="vault-confidential-reading" data-vault-reading-presented="true">
        <section className="fi rounded-xl px-3 py-2.5 mb-3" data-testid="vault-reading-hero"
          style={{ background: 'linear-gradient(165deg, rgba(212,175,55,0.10), rgba(0,0,0,0.28))', border: '1px solid rgba(212,175,55,0.22)' }}>
          <h2 className="fi text-[1.2rem] leading-snug font-medium" data-testid="vault-reading-hero-decision">
            {reading.headline}
          </h2>
          <div className="mt-2" data-testid="vault-reading-hero-action">
            <SectionLabel>{labels.recommendedActions}</SectionLabel>
            <p>{reading.action}</p>
          </div>
          <aside className="fi text-xs leading-relaxed mt-3" data-testid="vault-symbolic-limitation">
            <p>{reading.limitation}</p>
          </aside>
          <div className="fi text-xs leading-relaxed mt-2" data-testid="vault-evidence-status">
            <p>{copy.evidence}</p>
            <p data-testid="vault-data-completeness">{copy[reading.data_completeness ?? 'not_assessed']}</p>
          </div>
        </section>
        {reading.strongest_window ? (
          <section className="mb-4" data-testid="vault-reading-windows">
            <SectionLabel>{copy.strongest}</SectionLabel>
            <p><bdi dir="ltr">{reading.strongest_window.date} · {reading.strongest_window.score}/100</bdi></p>
            {reading.secondary_windows?.length ? (
              <>
                <SectionLabel>{copy.secondary}</SectionLabel>
                <ul>{reading.secondary_windows.slice(0, 4).map((window) => (
                  <li key={window.date}><bdi dir="ltr">{window.date} · {window.score}/100</bdi></li>
                ))}</ul>
              </>
            ) : null}
          </section>
        ) : windowsSlot ? <section className="mb-4" data-testid="vault-reading-windows">{windowsSlot}</section> : null}
        <section className="mb-3" data-testid="vault-reading-interpretation">
          <SectionLabel>{labels.overallSituation}</SectionLabel>
          <p>{reading.interpretation ?? reading.strategic}</p>
        </section>
        {reading.avoid ? (
          <section className="mb-3" data-testid="vault-reading-hero-risk">
            <SectionLabel>{labels.thingsToAvoid}</SectionLabel>
            <p>{reading.avoid}</p>
          </section>
        ) : null}
      </div>
    );
  }
  const presented = presentVaultReading(reading, lang);
  const decisionHeadline = sanitizeVaultReadingProse(reading.headline, lang);
  const ux = shapeVaultReadingUxV2(presented, labels, decisionHeadline);
  const symbolic = reading.confidence_basis === 'unvalidated_symbolic_guidance';
  const confidenceLevel = symbolic ? null : parseConfidenceLevel(reading.confidence);

  return (
    <div
      className={className}
      style={style}
      data-testid="vault-confidential-reading"
      data-vault-reading-presented="true"
      data-vault-reading-ux="v2"
    >
      <section
        data-testid="vault-reading-hero"
        className="rounded-xl px-3 py-2.5 mb-3"
        style={{
          background:
            'linear-gradient(165deg, rgba(212,175,55,0.10), rgba(0,0,0,0.28))',
          border: '1px solid rgba(212,175,55,0.22)',
        }}
      >
        <h2
          className="fi text-[1.2rem] leading-snug font-medium m-0 tracking-tight"
          style={{ color: 'rgba(255,255,255,0.96)' }}
          data-testid="vault-reading-hero-decision"
        >
          {ux.decision}
        </h2>

        <div
          className="mt-2"
          data-testid="vault-reading-hero-action"
          data-section-key="recommendedActions"
        >
          <div
            className="fi text-[10px] uppercase tracking-[0.16em] mb-0.5"
            style={LABEL}
          >
            {ux.actionLabel}
          </div>
          <div
            className="fi text-[0.95rem] leading-snug font-medium"
            style={{ color: 'rgba(255,255,255,0.94)' }}
          >
            {ux.primaryAction}
          </div>
        </div>

        {symbolic ? (
          <aside className="fi text-xs leading-relaxed mt-3" data-testid="vault-symbolic-limitation">
            {/* Safety context is returned localized and must survive prose filtering. */}
            <p>{reading.limitation}</p>
            <p>{reading.confidence_explanation}</p>
          </aside>
        ) : null}

        <div className="mt-2.5 flex flex-wrap items-end gap-x-4 gap-y-2">
          {bestWindowLabel ? (
            <div
              className="min-w-0 flex-1"
              data-testid="vault-reading-hero-window"
            >
              {bestWindowLabelTitle ? (
                <div
                  className="fi text-[9px] uppercase tracking-[0.16em] mb-0.5"
                  style={LABEL}
                >
                  {bestWindowLabelTitle}
                </div>
              ) : null}
              <div
                className="fi text-[13px] leading-tight"
                style={{ color: 'rgba(255,255,255,0.82)' }}
              >
                {bestWindowLabel}
              </div>
            </div>
          ) : null}

          {!symbolic && (confidenceLabel || confidenceLevel) ? (
            <div
              className="w-full min-w-[9rem] sm:w-[11rem] sm:flex-none"
              data-testid="vault-reading-hero-confidence"
            >
              {confidenceLabel ? (
                <div
                  className="fi text-[9px] uppercase tracking-[0.16em] mb-1"
                  style={LABEL}
                  data-vault-power-confidence="true"
                >
                  {confidenceLabel}
                </div>
              ) : null}
              {confidenceLevel ? (
                <ConfidenceMeter level={confidenceLevel} />
              ) : null}
            </div>
          ) : null}
        </div>

        <div
          className="mt-2 pt-2"
          style={{ borderTop: '1px solid rgba(212,175,55,0.10)' }}
          data-testid="vault-reading-hero-risk"
          data-section-key="mainRisk"
        >
          <div
            className="fi text-[9px] uppercase tracking-[0.16em] mb-0.5"
            style={{ color: 'rgba(212,175,55,0.42)' }}
          >
            {ux.riskLabel}
          </div>
          <div
            className="fi text-[11px] leading-snug"
            style={{ color: 'rgba(242, 180, 120, 0.78)' }}
          >
            {ux.primaryRisk}
          </div>
        </div>
      </section>

      {windowsSlot ? (
        <section className="mb-4" data-testid="vault-reading-windows">
          {windowsSlot}
        </section>
      ) : null}

      {ux.whyBullets.length > 0 ? (
        <section
          className="mb-3"
          data-testid="vault-reading-section-overallSituation"
          data-section-key="overallSituation"
        >
          <SectionLabel>{ux.whyTitle}</SectionLabel>
          <BulletList items={ux.whyBullets} testId="vault-reading-why-bullets" />
        </section>
      ) : null}

      {ux.actionItems.length > 0 ? (
        <section
          className="mb-3 rounded-lg px-2.5 py-2"
          style={{ background: 'rgba(212,175,55,0.04)' }}
          data-testid="vault-reading-section-recommendedActions"
          data-section-key="recommendedActions"
        >
          <SectionLabel>{ux.actionTitle}</SectionLabel>
          <BulletList
            items={ux.actionItems}
            testId="vault-reading-action-items"
            checklist
          />
        </section>
      ) : null}

      {ux.avoidItems.length > 0 ? (
        <section
          className="mb-2"
          data-testid="vault-reading-section-thingsToAvoid"
          data-section-key="thingsToAvoid"
        >
          <SectionLabel>{ux.avoidTitle}</SectionLabel>
          <BulletList
            items={ux.avoidItems}
            testId="vault-reading-avoid-items"
            warning
          />
        </section>
      ) : null}

      {ux.deepSections.length > 0 ? (
        <details
          className="mt-2 pt-2"
          style={{ borderTop: '1px solid rgba(212,175,55,0.12)' }}
          data-testid="vault-reading-deep"
        >
          <summary
            className="fi text-[10px] uppercase tracking-[0.16em] cursor-pointer select-none"
            style={LABEL}
          >
            {ux.deepTitle}
          </summary>
          <div className="mt-3 space-y-3">
            {ux.deepSections.map((section) => (
              <div
                key={section.key}
                data-testid={`vault-reading-deep-section-${section.key}`}
                data-section-key={section.key}
              >
                <SectionLabel>{section.title}</SectionLabel>
                <BulletList
                  items={section.bullets}
                  testId={`vault-reading-deep-${section.key}`}
                />
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
