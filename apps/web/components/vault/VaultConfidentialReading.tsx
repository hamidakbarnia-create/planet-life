'use client';

import { useMemo, type CSSProperties, type ReactNode } from 'react';
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
import {
  collapseRepeatedReason,
  interpretationRepeatsAction,
  localizedStatementAlreadyOwned,
  statementAlreadyPresent,
  uniqueSentences,
  validityWarningAlreadyPresent,
} from '@/lib/vault-reading-safeguards';
import { VAULT_COMPARISON_COPY, VAULT_STYLE_TIMING_COPY } from '@/lib/vault-section-i18n';
import { splitPaletteNames, swatchHexForPaletteName } from '@/lib/vault-color-swatches';
import { localizeFixedShortlistLabel } from '@/lib/vault-shortlist-labels';
import { useVaultWindowClock } from '@/lib/use-vault-window-clock';
import {
  describeWindowWhen,
  parseTimedWindowValue,
  splitNoteGroups,
  windowBoundaryTimes,
  type WindowBoundary,
} from '@/lib/vault-window-when';

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
  /** Optional Ask / Commit / Sign (or similar) rows directly under the headline. */
  timingSlot?: ReactNode;
  /** Test clock for Style Timing window labels. Live UI omits this. */
  now?: Date;
  className?: string;
  style?: CSSProperties;
};

const PALETTE_LABELS = new Set(['Palette', 'Палитра', 'پالت', 'الألوان']);
const NOTES_LABELS = new Set(['Scent notes', 'Ноты аромата', 'نت‌های رایحه', 'النغمات العطرية']);
const ACCESSORY_LABELS = new Set(['Accessory', 'Аксессуар', 'اکسسوری', 'الإكسسوار']);
const DATE_LABELS = new Set(['Date', 'Дата', 'تاریخ', 'التاريخ']);
const TIMEZONE_LABELS = new Set(['Timezone', 'Часовой пояс', 'منطقه زمانی', 'المنطقة الزمنية']);

const LABEL: CSSProperties = {
  color: '#C9A227',
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
  timingSlot,
  now,
  className,
  style,
}: Props) {
  const windowBoundaries = useMemo(() => {
    const details = reading.details ?? [];
    const date = details.find((detail) => DATE_LABELS.has(detail.label))?.value ?? null;
    const timezone = details.find((detail) => TIMEZONE_LABELS.has(detail.label))?.value ?? null;
    const bounds: WindowBoundary[] = [];
    for (const detail of details) {
      const parsed = parseTimedWindowValue(detail.value);
      if (!parsed.start) continue;
      const edges = windowBoundaryTimes({
        date,
        start: parsed.start,
        end: parsed.end,
        timezone: parsed.timezone ?? timezone,
      });
      if (edges) bounds.push(edges);
    }
    return bounds;
  }, [reading.details]);
  const clockNow = useVaultWindowClock(now, windowBoundaries);
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
    const comparison = VAULT_COMPARISON_COPY[lang];
    const styleCopy = VAULT_STYLE_TIMING_COPY[lang];
    const details = (reading.details ?? []).filter(
      (detail) => /[\p{L}\p{N}]/u.test(detail.label) && /[\p{L}\p{N}]/u.test(detail.value),
    );
    const readingDate = details.find((detail) => DATE_LABELS.has(detail.label))?.value ?? null;
    const readingTimezone = details.find((detail) => TIMEZONE_LABELS.has(detail.label))?.value ?? null;
    const scoreValues = details
      .map((detail) => detail.value.match(/^(\d+)\s*\/\s*100/)?.[1])
      .filter((value): value is string => !!value);
    const hasDuplicateScores = scoreValues.length > 1 && new Set(scoreValues).size < scoreValues.length;
    const showGeographyTieOrder =
      Boolean(reading.place_scope?.trim()) && hasDuplicateScores;
    const hasPlaces = Boolean(reading.place_scope) || details.some((detail) => Boolean(detail.reason));
    return (
      <div className={className} style={style} dir={lang === 'fa' || lang === 'ar' ? 'rtl' : 'ltr'}
        data-testid="vault-confidential-reading" data-vault-reading-presented="true">
        <section className="fi rounded-xl px-3 py-2.5 mb-3" data-testid="vault-reading-hero"
          style={{ background: 'linear-gradient(165deg, rgba(212,175,55,0.10), rgba(0,0,0,0.28))', border: '1px solid rgba(212,175,55,0.22)' }}>
          <h2 className="fi text-[1.2rem] leading-snug font-medium" data-testid="vault-reading-hero-decision">
            {reading.headline}
          </h2>
          {timingSlot ? (
            <div
              className="mt-3"
              data-testid="vault-yes-slots"
              style={{
                scrollMarginBottom:
                  'calc(var(--metioro-mobile-nav-h) + var(--metioro-safe-bottom) + 16px)',
              }}
            >
              {timingSlot}
            </div>
          ) : null}
          <div className="mt-2" data-testid="vault-reading-hero-action">
            <SectionLabel>{labels.recommendedActions}</SectionLabel>
            <p>{reading.action}</p>
          </div>
          <aside className="fi text-xs leading-relaxed mt-3" data-testid="vault-symbolic-limitation">
            <p>{uniqueSentences([reading.limitation]).join(' ')}</p>
          </aside>
          <div className="fi text-xs leading-relaxed mt-2" data-testid="vault-evidence-status">
            {!validityWarningAlreadyPresent(reading.limitation, copy.evidence) ? (
              <p>{copy.evidence}</p>
            ) : null}
            {!statementAlreadyPresent(
              reading.limitation,
              copy[reading.data_completeness ?? 'not_assessed'],
            ) ? (
              <p data-testid="vault-data-completeness">{copy[reading.data_completeness ?? 'not_assessed']}</p>
            ) : null}
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
        {details.length ? (
          <dl className="mb-3 space-y-1.5" data-testid="vault-reading-details">
            {details.map((detail, index) => {
              const parsedWindow = parseTimedWindowValue(detail.value);
              const when = parsedWindow.start
                ? describeWindowWhen({
                    date: readingDate,
                    start: parsedWindow.start,
                    end: parsedWindow.end,
                    timezone: parsedWindow.timezone ?? readingTimezone,
                    now: clockNow,
                  })
                : null;
              const relationText = when
                ? {
                    past: styleCopy.windowPast,
                    current: styleCopy.windowCurrent,
                    upcoming: styleCopy.windowUpcoming,
                    unknown: styleCopy.windowUnknown,
                  }[when.relation]
                : null;
              return (
              <div key={`${detail.label}-${index}`} className="min-w-0 break-words">
                <dt className="fi text-xs opacity-80 inline-flex flex-wrap items-center gap-2">
                  {hasPlaces ? localizeFixedShortlistLabel(detail.label, lang) : detail.label}
                  {ACCESSORY_LABELS.has(detail.label) ? (
                    <span className="opacity-80" data-testid="vault-accessory-optional">
                      {styleCopy.optionalAccessory}
                    </span>
                  ) : null}
                </dt>
                <dd>
                  {PALETTE_LABELS.has(detail.label) ? (
                    <ul className="m-0 p-0 list-none space-y-1" data-testid="vault-color-swatches">
                      {splitPaletteNames(detail.value).map((name) => {
                        const hex = swatchHexForPaletteName(name);
                        return (
                          <li key={name} className="flex items-center gap-2">
                            {hex ? (
                              <span
                                data-testid="vault-color-swatch"
                                role="img"
                                aria-label={name}
                                title={name}
                                className="inline-block h-4 w-4 shrink-0 rounded-sm"
                                style={{
                                  background: hex,
                                  border: '1px solid rgba(255,255,255,0.55)',
                                }}
                              />
                            ) : null}
                            <bdi
                              dir={detail.direction ?? 'auto'}
                              data-testid={hex ? undefined : 'vault-color-name-fallback'}
                            >
                              {name}
                            </bdi>
                          </li>
                        );
                      })}
                    </ul>
                  ) : NOTES_LABELS.has(detail.label) ? (
                    <div>
                      {!localizedStatementAlreadyOwned(
                        reading.interpretation ?? reading.strategic,
                        styleCopy.scentAlternatives,
                      ) ? (
                      <p className="fi text-xs opacity-70 mb-1" data-testid="vault-scent-alternatives">
                        {styleCopy.scentAlternatives}
                      </p>
                      ) : null}
                      <ul className="m-0 p-0 list-none space-y-1">
                        {splitNoteGroups(detail.value).map((group) => (
                          <li key={group}>
                            <bdi dir={detail.direction ?? 'auto'}>{group}</bdi>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <>
                      <bdi dir={detail.direction ?? 'auto'}>{detail.value}</bdi>
                      {DATE_LABELS.has(detail.label) ? (
                        <p className="fi text-[10px] mt-1 opacity-70" data-testid="vault-date-calendar">
                          {styleCopy.dateCalendar}
                        </p>
                      ) : null}
                    </>
                  )}
                  {when ? (
                    <p className="fi text-xs leading-relaxed mt-1" data-testid="vault-window-when" data-relation={when.relation}>
                      {when.facts ? `${when.facts}. ` : ''}
                      {relationText}
                    </p>
                  ) : null}
                  {detail.reason && <p>{collapseRepeatedReason(detail.reason)}</p>}
                </dd>
              </div>
              );
            })}
          </dl>
        ) : null}
        {reading.score_formula ? (
          <p className="fi text-xs leading-relaxed mb-3" data-testid="vault-overall-formula">{reading.score_formula}</p>
        ) : null}
        {hasPlaces ? (
          <p className="fi text-xs leading-relaxed mb-3" data-testid="vault-place-shortlist">{reading.place_scope ?? comparison.placeShortlist}</p>
        ) : null}
        {showGeographyTieOrder ? (
          <p className="fi text-xs leading-relaxed mb-3" data-testid="vault-tied-scores">{comparison.tiedScores}</p>
        ) : null}
        {interpretationRepeatsAction(
          reading.interpretation ?? reading.strategic,
          reading.action,
        ) ? null : (
        <section className="mb-3" data-testid="vault-reading-interpretation">
          <SectionLabel>{labels.overallSituation}</SectionLabel>
          <p>{reading.interpretation ?? reading.strategic}</p>
        </section>
        )}
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
        {timingSlot ? (
          <div
            className="mt-3"
            data-testid="vault-yes-slots"
            style={{
              scrollMarginBottom:
                'calc(var(--metioro-mobile-nav-h) + var(--metioro-safe-bottom) + 16px)',
            }}
          >
            {timingSlot}
          </div>
        ) : null}

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
            <p>{uniqueSentences([reading.limitation]).join(' ')}</p>
            {!statementAlreadyPresent(reading.limitation, reading.confidence_explanation) ? (
              <p>{uniqueSentences([reading.confidence_explanation]).join(' ')}</p>
            ) : null}
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
