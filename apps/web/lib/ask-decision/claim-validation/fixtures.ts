/**
 * Controllable GroundingBundle fixtures for claim-validation tests.
 */

import {
  EVIDENCE_ITEM_VERSION,
  GROUNDING_PROVENANCE_VERSION,
  type ClaimContainer,
  type Evidence,
  type GroundingProvenance,
} from '../grounding';
import type { GroundingBundle } from './types';

export const FIXED_BUILT_AT = '2026-07-22T16:00:00.000Z';

export function makeEvidence(
  partial: Pick<Evidence, 'id' | 'kind'> &
    Partial<Omit<Evidence, 'id' | 'kind' | 'version'>>
): Evidence {
  return {
    version: EVIDENCE_ITEM_VERSION,
    source: partial.source ?? 'current_question',
    ...partial,
  };
}

export function makeClaim(
  partial: Pick<ClaimContainer, 'id' | 'fieldPath'> &
    Partial<Omit<ClaimContainer, 'id' | 'fieldPath'>>
): ClaimContainer {
  return {
    textDigest: partial.textDigest === undefined ? 'abcd1234' : partial.textDigest,
    evidenceRefs: partial.evidenceRefs ?? [],
    status: 'unknown',
    ...partial,
  };
}

export function makeBundle(args: {
  evidence?: Evidence[];
  claims?: ClaimContainer[];
  status?: GroundingProvenance['status'];
}): GroundingBundle {
  return {
    version: GROUNDING_PROVENANCE_VERSION,
    builtAt: FIXED_BUILT_AT,
    evidence: args.evidence ?? [],
    claims: args.claims ?? [],
    status: args.status ?? 'used',
  };
}

/** Inventory with question/fact/plan/analysis — supports recommendation. */
export function supportedRecommendationBundle(): GroundingBundle {
  const evidence = [
    makeEvidence({ id: 'ev.q', kind: 'question', key: 'question.original' }),
    makeEvidence({ id: 'ev.f', kind: 'fact', key: 'current_option' }),
    makeEvidence({ id: 'ev.a', kind: 'analysis', key: 'intent' }),
    makeEvidence({ id: 'ev.p', kind: 'plan', key: 'planId', source: 'reasoning_plan' }),
  ];
  return makeBundle({
    evidence,
    claims: [
      makeClaim({
        id: 'cl.rec',
        fieldPath: 'recommendation',
        evidenceRefs: [
          { evidenceId: 'ev.q' },
          { evidenceId: 'ev.f' },
          { evidenceId: 'ev.a' },
          { evidenceId: 'ev.p' },
        ],
      }),
    ],
  });
}

/** Timing claim with plan/fact only — partial (missing timing kind). */
export function partialTimingBundle(): GroundingBundle {
  const evidence = [
    makeEvidence({ id: 'ev.p', kind: 'plan', key: 'planId', source: 'reasoning_plan' }),
    makeEvidence({ id: 'ev.f', kind: 'fact', key: 'option' }),
  ];
  return makeBundle({
    evidence,
    claims: [
      makeClaim({
        id: 'cl.timing',
        fieldPath: 'scores.timing.rationale',
        evidenceRefs: [{ evidenceId: 'ev.p' }, { evidenceId: 'ev.f' }],
      }),
    ],
  });
}

/** Claim refs only unrelated kinds for that field. */
export function unsupportedUnrelatedBundle(): GroundingBundle {
  const evidence = [
    makeEvidence({
      id: 'ev.conv',
      kind: 'conversation',
      key: 'conversation[0]',
      source: 'conversation',
    }),
  ];
  return makeBundle({
    evidence,
    claims: [
      makeClaim({
        id: 'cl.rec',
        fieldPath: 'recommendation',
        evidenceRefs: [{ evidenceId: 'ev.conv' }],
      }),
    ],
  });
}

/** Empty claim text → unknown. */
export function unknownEmptyClaimBundle(): GroundingBundle {
  const evidence = [
    makeEvidence({ id: 'ev.q', kind: 'question' }),
    makeEvidence({ id: 'ev.f', kind: 'fact' }),
  ];
  return makeBundle({
    evidence,
    claims: [
      makeClaim({
        id: 'cl.empty',
        fieldPath: 'recommendation',
        textDigest: null,
        evidenceRefs: [{ evidenceId: 'ev.q' }, { evidenceId: 'ev.f' }],
      }),
    ],
  });
}

/** Missing inventory for expected direct kinds + empty refs. */
export function missingEvidenceBundle(): GroundingBundle {
  return makeBundle({
    evidence: [],
    claims: [
      makeClaim({
        id: 'cl.rec',
        fieldPath: 'recommendation',
        evidenceRefs: [],
      }),
    ],
  });
}

/** Duplicate refs to the same evidence id. */
export function duplicateEvidenceBundle(): GroundingBundle {
  const evidence = [
    makeEvidence({ id: 'ev.q', kind: 'question' }),
    makeEvidence({ id: 'ev.f', kind: 'fact' }),
    makeEvidence({ id: 'ev.a', kind: 'analysis' }),
    makeEvidence({ id: 'ev.p', kind: 'plan', source: 'reasoning_plan' }),
  ];
  return makeBundle({
    evidence,
    claims: [
      makeClaim({
        id: 'cl.rec',
        fieldPath: 'recommendation',
        evidenceRefs: [
          { evidenceId: 'ev.q' },
          { evidenceId: 'ev.q' },
          { evidenceId: 'ev.f' },
          { evidenceId: 'ev.a' },
          { evidenceId: 'ev.p' },
        ],
      }),
    ],
  });
}

/** Broken evidence references. */
export function brokenReferencesBundle(): GroundingBundle {
  const evidence = [
    makeEvidence({ id: 'ev.q', kind: 'question' }),
  ];
  return makeBundle({
    evidence,
    claims: [
      makeClaim({
        id: 'cl.rec',
        fieldPath: 'recommendation',
        evidenceRefs: [
          { evidenceId: 'ev.q' },
          { evidenceId: 'ev.missing' },
        ],
      }),
    ],
  });
}
