/**
 * PR-2 path (mocked API):
 * first required answer → create Case → same case_id → complete → evaluate → history
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureCaseAndSaveAnswers, loadCaseResult } from './session';
import * as api from './api-client';
import { assertPackageRenderContract } from './demo-stub-fixture';
import demoFixture from './fixtures/car-interview-stub-package.demo.json';

vi.mock('./api-client', async () => {
  const actual = await vi.importActual<typeof import('./api-client')>(
    './api-client'
  );
  return {
    ...actual,
    createDecisionCase: vi.fn(),
    saveIntakeAnswers: vi.fn(),
    completeIntake: vi.fn(),
    evaluateDecisionCase: vi.fn(),
    getDecisionCase: vi.fn(),
    getDecisionCaseHistory: vi.fn(),
    listDecisionCaseEvaluations: vi.fn(),
    getEvaluation: vi.fn(),
    updateDecisionCaseFraming: vi.fn(),
  };
});

describe('car-interview PR-2 Case API path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('keeps package authority on the backend evaluation boundary', async () => {
    vi.mocked(api.createDecisionCase).mockResolvedValue({
      case_id: 'case-e2e',
      owner_subject_id: 'e5-dev-owner',
      decision_type_id: 'car-interview',
      family_id: 'visibility',
      title: 'Attend job interview',
      state: 'draft',
      activation_phase: 'draft',
      mode: 'none',
      precision_level: 'L1',
      case_version: 1,
      created_at: '2026-08-07T10:00:00Z',
      updated_at: '2026-08-07T10:00:00Z',
    });
    vi.mocked(api.saveIntakeAnswers).mockResolvedValue({
      case: {
        case_id: 'case-e2e',
        owner_subject_id: 'e5-dev-owner',
        decision_type_id: 'car-interview',
        family_id: 'visibility',
        title: 'Attend job interview',
        state: 'intake',
        activation_phase: 'intake',
        mode: 'evaluate_date',
        precision_level: 'L1',
        case_version: 3,
        created_at: '2026-08-07T10:00:00Z',
        updated_at: '2026-08-07T10:00:01Z',
      },
      intake: { target_date: '2026-08-10', role: 'Designer' },
      missing_required: [],
      is_complete: true,
    });

    const saved = await ensureCaseAndSaveAnswers({
      answers: { target_date: '2026-08-10', role: 'Designer' },
    });
    expect(saved.case.case_id).toBe('case-e2e');

    const evidenceReady = {
      ...saved.case,
      state: 'evidence_ready' as const,
      case_version: 4,
      intake: {
        ...saved.intake,
        decision_frame: {
          operation: 'evaluate',
          time_scope: 'specific_date',
          date: '2026-08-10',
        },
      },
    };
    vi.mocked(api.getDecisionCase).mockResolvedValue(evidenceReady);
    vi.mocked(api.updateDecisionCaseFraming).mockResolvedValue({
      case: evidenceReady,
      intake: evidenceReady.intake,
      framing: evidenceReady.intake.decision_frame,
    });
    vi.mocked(api.listDecisionCaseEvaluations).mockResolvedValue({
      evaluations: [],
    });
    const realPackage = {
      ...demoFixture,
      engine_id: 'decision-engine-car-interview-v1',
      confidence: {
        ...demoFixture.confidence,
        penalties: [
          {
            code: 'CONFIDENCE_UNAVAILABLE',
            message: 'Upstream scoring did not supply a reasoning confidence value.',
          },
        ],
      },
      counter_recommendation: {
        ...demoFixture.counter_recommendation,
        summary: '',
      },
    };
    vi.mocked(api.evaluateDecisionCase).mockResolvedValue({
      evaluation_id: 'eval-e2e',
      case_id: 'case-e2e',
      case_version: 3,
      evaluation_version: 1,
      package_contract_version: '1.0.0',
      engine_id: 'decision-engine-car-interview-v1',
      dq_status: 'pass',
      created_at: '2026-08-07T10:00:02Z',
      package: realPackage as never,
    });
    vi.mocked(api.getDecisionCaseHistory).mockResolvedValue({
      events: [
        {
          history_id: 'h1',
          case_id: 'case-e2e',
          at: '2026-08-07T10:00:00Z',
          actor: 'system',
          event: 'case_created',
          from_state: null,
          to_state: null,
          case_version: 1,
          payload: {},
        },
        {
          history_id: 'h2',
          case_id: 'case-e2e',
          at: '2026-08-07T10:00:02Z',
          actor: 'system',
          event: 'evaluation_created',
          from_state: 'evidence_ready',
          to_state: 'evaluated',
          case_version: 5,
          payload: {},
        },
      ],
    });

    const result = await loadCaseResult('case-e2e');
    expect(api.evaluateDecisionCase).toHaveBeenCalled();
    assertPackageRenderContract(result.evaluation.package);
    expect(result.evaluation.package.engine_id).toBe(
      'decision-engine-car-interview-v1'
    );
    expect(result.evaluation.package.engine_id).not.toBe(
      'decision-engine-stub-v1'
    );
    expect(result.history.map((e) => e.event)).toContain('evaluation_created');
    expect(localStorage.length).toBe(0);
  });
});
