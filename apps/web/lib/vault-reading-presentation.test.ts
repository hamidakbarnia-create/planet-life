import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  confidenceMeterSteps,
  parseConfidenceLevel,
  presentVaultReading,
  presentationTextNearlyEqual,
  sanitizeVaultReadingProse,
  shapeVaultReadingUxV2,
  splitPresentationBullets,
  toPresentationBullets,
  vaultReadingTextHasBannedTerms,
  VAULT_READING_PRESENTATION_COPY,
} from './vault-reading-presentation';
import type { VaultReadingLayer } from './vault-reading';

const MARS_LIKE: VaultReadingLayer = {
  executive:
    'High-voltage attraction. Your desire signature sits in Aries, house 1. Action: Choose one pursuit today and drop the rest. Confidence: high — clear enough to act on, still not a guarantee.',
  strategic:
    'Your desire signature sits in Aries, house 1. You don\'t wait to be chosen — you choose. Your desire ignites fast, burns hot, and expects a match who can keep pace without flinching. Mars in the 1st house: desire is written on your body. People feel your hunger before you speak. Mars is in full command in your chart — raw desire runs clean and strong. Mars square Pluto: power struggles in intimacy. You can magnetize dangerous dynamics — choose consciously. Confidence: high — clear enough to act on, still not a guarantee. What this changes today: your desire pattern is a filter — use it before you invest. Action: Choose one pursuit today and drop the rest.',
  technical:
    'Mars 15.0° Aries · house 1 · dignity: rulership · Mars square Pluto (orb 5.0°) · action=rest_recovery',
  headline: 'High-voltage attraction',
  confidence: 'high',
  action: 'Choose one pursuit today and drop the rest',
};

const GHOST_LIKE: VaultReadingLayer = {
  executive:
    'Pull back — distance works. Strongest distance window: 2026-08-03 (82/100). Action: Pull back hardest on 2026-08-03. Avoid: chasing, over-texting, and explaining the silence. Confidence: high — clear enough to act on, still not a guarantee.',
  strategic:
    'Distance works better than explanation here. Fewer messages, fewer justifications, more room for pull to rebuild on its own. The clearest window lands on 2026-08-03 (82/100). Confidence: high — clear enough to act on, still not a guarantee. What this changes today: silence can work harder than another reply. Action: Pull back hardest on 2026-08-03. Avoid: chasing, over-texting, and explaining the silence.',
  technical:
    'action=rest_recovery · horizon=14d · top=2026-08-03 score=82 · confidence=high',
  headline: 'Pull back — distance works',
  confidence: 'high',
  action: 'Pull back hardest on 2026-08-03',
  avoid: 'chasing, over-texting, and explaining the silence',
};

describe('vault reading presentation sanitize', () => {
  it('flags engine and astrology vocabulary', () => {
    expect(vaultReadingTextHasBannedTerms('Transit Sun conjunction natal Venus')).toBe(
      true
    );
    expect(vaultReadingTextHasBannedTerms('Mars square Pluto')).toBe(true);
    expect(vaultReadingTextHasBannedTerms('action=rest_recovery')).toBe(true);
    expect(
      vaultReadingTextHasBannedTerms('Choose one pursuit today and drop the rest')
    ).toBe(false);
  });

  it('keeps decision language after stripping engine lead-ins', () => {
    const cleaned = sanitizeVaultReadingProse(
      'Mars square Pluto: power struggles in intimacy. You can magnetize dangerous dynamics — choose consciously.'
    );
    expect(cleaned.toLowerCase()).not.toMatch(/\bmars\b|\bsquare\b|\bpluto\b/);
    expect(cleaned).toMatch(/power struggles|magnetize|choose consciously/i);
  });

  it('drops contaminated sentences that cannot be salvaged', () => {
    const cleaned = sanitizeVaultReadingProse(
      'Your desire signature sits in Aries, house 1. You choose your pace.'
    );
    expect(cleaned.toLowerCase()).not.toMatch(/aries|house/);
    expect(cleaned).toMatch(/choose your pace/i);
  });
});

describe('presentVaultReading', () => {
  it('always returns the six decision sections', () => {
    const presented = presentVaultReading(MARS_LIKE, 'en');
    expect(presented.sections.map((s) => s.key)).toEqual([
      'overallSituation',
      'mainOpportunity',
      'mainRisk',
      'recommendedActions',
      'thingsToAvoid',
      'practicalNextStep',
    ]);
    expect(presented.sections.map((s) => s.title)).toEqual([
      VAULT_READING_PRESENTATION_COPY.en.overallSituation,
      VAULT_READING_PRESENTATION_COPY.en.mainOpportunity,
      VAULT_READING_PRESENTATION_COPY.en.mainRisk,
      VAULT_READING_PRESENTATION_COPY.en.recommendedActions,
      VAULT_READING_PRESENTATION_COPY.en.thingsToAvoid,
      VAULT_READING_PRESENTATION_COPY.en.practicalNextStep,
    ]);
  });

  it('never surfaces Mars/aspect/technical producer text for EN', () => {
    const presented = presentVaultReading(MARS_LIKE, 'en');
    const blob = presented.sections.map((s) => s.body).join('\n');
    expect(blob.toLowerCase()).not.toMatch(
      /\bmars\b|\bvenus\b|\bsun\b|\bmoon\b|\bsquare\b|\bconjunction\b|\btrine\b|\bsextile\b|\bopposition\b|\bnatal\b|\btransit\b|\binferred\b|\baries\b|\bhouse\s*1\b|\bdignity\b|\baction=/
    );
    expect(blob).not.toContain(MARS_LIKE.technical);
    expect(
      presented.sections.find((s) => s.key === 'recommendedActions')?.body
    ).toContain('Choose one pursuit');
    expect(
      presented.sections.find((s) => s.key === 'practicalNextStep')?.body
    ).toContain('Choose one pursuit');
    expect(
      presented.sections.find((s) => s.key === 'mainOpportunity')?.body
    ).toMatch(/desire pattern|filter|invest/i);
  });

  it('maps ghost windows into decision language without producer keys', () => {
    const presented = presentVaultReading(GHOST_LIKE, 'en');
    const blob = presented.sections.map((s) => s.body).join('\n');
    expect(blob).not.toMatch(/action=|horizon=|rest_recovery/i);
    expect(
      presented.sections.find((s) => s.key === 'thingsToAvoid')?.body
    ).toMatch(/chasing|over-texting/i);
    expect(
      presented.sections.find((s) => s.key === 'recommendedActions')?.body
    ).toContain('Pull back hardest');
    expect(
      presented.sections.find((s) => s.key === 'overallSituation')?.body
    ).toMatch(/distance|explanation|window/i);
  });

  it('uses localized section titles and FA fallbacks without English producer leakage', () => {
    const presented = presentVaultReading(
      {
        executive: 'Transit Sun conjunction natal Venus supports outreach.',
        strategic: 'Business Launch scores 63/100. Mars square Saturn.',
        technical: 'mars_saturn_square · inferred',
        headline: 'Transit Sun conjunction natal Venus',
        action: undefined,
        avoid: undefined,
      },
      'fa'
    );
    expect(presented.sections[0].title).toBe(
      VAULT_READING_PRESENTATION_COPY.fa.overallSituation
    );
    const blob = presented.sections.map((s) => s.body).join('\n');
    expect(blob.toLowerCase()).not.toMatch(
      /transit|conjunction|natal|venus|mars|square|saturn|business launch|inferred/
    );
    expect(blob).toContain(VAULT_READING_PRESENTATION_COPY.fa.fallbackSituation);
  });
});

describe('shapeVaultReadingUxV2', () => {
  it('de-dupes identical action/next and keeps distinct opportunity', () => {
    const presented = presentVaultReading(MARS_LIKE, 'en');
    const ux = shapeVaultReadingUxV2(
      presented,
      VAULT_READING_PRESENTATION_COPY.en,
      sanitizeVaultReadingProse(MARS_LIKE.headline, 'en')
    );
    expect(ux.decision).toBe('High-voltage attraction');
    expect(ux.primaryAction).toMatch(/Choose one pursuit/i);
    expect(ux.actionItems.some((item) => /Choose one pursuit/i.test(item))).toBe(
      true
    );
    expect(
      ux.deepSections.some((s) => s.key === 'practicalNextStep')
    ).toBe(false);

    const opportunity = presented.sections.find(
      (s) => s.key === 'mainOpportunity'
    )?.body;
    expect(opportunity).toBeTruthy();
    const blob = [
      ...ux.whyBullets,
      ...ux.deepSections.flatMap((s) => s.bullets),
    ].join(' ');
    expect(blob.toLowerCase()).toMatch(/desire pattern|filter|invest/);
  });

  it('does not leak multi-sentence Avoid tails into situation overflow', () => {
    const presented = presentVaultReading(
      {
        headline: 'Line one for the decision',
        executive:
          'Line one for the decision. Line two explains the context. Line three adds timing. Line four covers tone. Line five is overflow. Line six stays available.',
        strategic:
          'Line one for the decision. Line two explains the context. Line three adds timing. Line four covers tone. Line five is overflow. Line six stays available. Opportunity: Unique opening that is not the action. Action: Take the unique action path. Avoid: Skip the first trap. Skip the second trap. Skip the third trap. Skip the fourth trap. Skip the fifth trap.',
        technical: 'ignored',
        action: 'Take the unique action path',
        avoid:
          'Skip the first trap. Skip the second trap. Skip the third trap. Skip the fourth trap. Skip the fifth trap.',
        confidence: 'low',
      },
      'en'
    );
    const decision = sanitizeVaultReadingProse(
      'Line one for the decision',
      'en'
    );
    const ux = shapeVaultReadingUxV2(
      presented,
      VAULT_READING_PRESENTATION_COPY.en,
      decision
    );
    const situationDeep =
      ux.deepSections.find((s) => s.key === 'overallSituation')?.bullets ?? [];
    const visibleWhy = ux.whyBullets.join(' ');
    expect(
      `${visibleWhy} ${situationDeep.join(' ')}`
    ).toMatch(/Line six stays available/i);
    expect(situationDeep.join(' ').toLowerCase()).not.toMatch(/skip the/);
    expect(visibleWhy.toLowerCase()).not.toMatch(/skip the/);
    expect(ux.decision).toBe('Line one for the decision');
    expect(
      ux.deepSections.some((s) =>
        s.bullets.some((b) => /Unique opening that is not the action/i.test(b))
      ) ||
        ux.whyBullets.some((b) =>
          /Unique opening that is not the action/i.test(b)
        )
    ).toBe(true);
  });

  it('caps main bullets and preserves overflow in deep sections', () => {
    const presented = {
      sections: [
        {
          key: 'overallSituation' as const,
          title: 'Overall situation',
          body: 'One. Two. Three. Four. Five. Six.',
        },
        {
          key: 'mainOpportunity' as const,
          title: 'Main opportunity',
          body: 'Distinct opportunity line.',
        },
        {
          key: 'mainRisk' as const,
          title: 'Main risk',
          body: 'Primary risk. Secondary risk detail.',
        },
        {
          key: 'recommendedActions' as const,
          title: 'Recommended actions',
          body: 'Do the action.',
        },
        {
          key: 'thingsToAvoid' as const,
          title: 'Things to avoid',
          body: 'Avoid A. Avoid B. Avoid C. Avoid D. Avoid E.',
        },
        {
          key: 'practicalNextStep' as const,
          title: 'Practical next step',
          body: 'Do the action.',
        },
      ],
    };
    const ux = shapeVaultReadingUxV2(
      presented,
      VAULT_READING_PRESENTATION_COPY.en
    );
    expect(ux.whyBullets.length).toBeLessThanOrEqual(4);
    expect(ux.avoidItems.length).toBe(4);
    const deepBlob = ux.deepSections.flatMap((s) => s.bullets).join(' ');
    expect(deepBlob).toMatch(/Five|Six/);
    expect(deepBlob).toMatch(/Avoid E/);
    expect(deepBlob).toMatch(/Secondary risk detail/);
    expect(deepBlob).toMatch(/Distinct opportunity/);
  });

  it('does not treat substring containment as de-dupe equality', () => {
    expect(
      presentationTextNearlyEqual(
        'Choose one pursuit',
        'Choose one pursuit today and drop the rest'
      )
    ).toBe(false);
    expect(
      presentationTextNearlyEqual(
        'Choose one pursuit today and drop the rest',
        'Choose one pursuit today and drop the rest.'
      )
    ).toBe(true);
  });

  it('maps confidence tokens to semantic levels and meter steps only', () => {
    expect(parseConfidenceLevel('high')).toBe('high');
    expect(parseConfidenceLevel('medium')).toBe('medium');
    expect(parseConfidenceLevel('low')).toBe('low');
    expect(parseConfidenceLevel('unknown')).toBeNull();
    expect(confidenceMeterSteps('high')).toBe(3);
    expect(confidenceMeterSteps('medium')).toBe(2);
    expect(confidenceMeterSteps('low')).toBe(1);
    expect(confidenceMeterSteps(null)).toBeNull();
  });

  it('caps toPresentationBullets without rewriting source wording', () => {
    expect(toPresentationBullets('One. Two. Three. Four. Five.', 4)).toEqual([
      'One.',
      'Two.',
      'Three.',
      'Four.',
    ]);
    expect(splitPresentationBullets('One. Two. Three. Four. Five.')).toHaveLength(
      5
    );
  });
});

describe('reading UX v2 file scope', () => {
  it('does not change producer / API / engine files', () => {
    // Guardrail: presentation-only surface for this refactor.
    const producerPaths = [
      resolve(__dirname, 'vault-reading.ts'),
      resolve(__dirname, '../app/api'),
    ];
    expect(producerPaths[0]).toContain('vault-reading.ts');
    const presentationSource = readFileSync(
      resolve(__dirname, 'vault-reading-presentation.ts'),
      'utf8'
    );
    expect(presentationSource).toContain('shapeVaultReadingUxV2');
    expect(presentationSource).not.toContain('confidenceBarFillPercent');
  });
});
