import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ensureCaseAndSaveAnswers,
  loadCaseResult,
} from './session';
import * as api from './api-client';

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

describe('car-interview Decision Case session (PR-2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not create a Case without a first meaningful required answer', async () => {
    await expect(
      ensureCaseAndSaveAnswers({ answers: { company: 'Acme' } })
    ).rejects.toMatchObject({ code: 'INTAKE_INCOMPLETE' });
    expect(api.createDecisionCase).not.toHaveBeenCalled();
  });

  it('creates exactly one backend Case on first required answer and reuses case_id', async () => {
    vi.mocked(api.createDecisionCase).mockResolvedValue({
      case_id: 'case-1',
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
    vi.mocked(api.saveIntakeAnswers)
      .mockResolvedValueOnce({
        case: {
          case_id: 'case-1',
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
        intake: { target_date: '2026-08-10' },
        missing_required: ['role'],
        is_complete: false,
      })
      .mockResolvedValueOnce({
        case: {
          case_id: 'case-1',
          owner_subject_id: 'e5-dev-owner',
          decision_type_id: 'car-interview',
          family_id: 'visibility',
          title: 'Attend job interview',
          state: 'intake',
          activation_phase: 'intake',
          mode: 'evaluate_date',
          precision_level: 'L1',
          case_version: 4,
          created_at: '2026-08-07T10:00:00Z',
          updated_at: '2026-08-07T10:00:02Z',
        },
        intake: { target_date: '2026-08-10', role: 'Engineer' },
        missing_required: [],
        is_complete: true,
      });

    const first = await ensureCaseAndSaveAnswers({
      answers: { target_date: '2026-08-10' },
    });
    expect(api.createDecisionCase).toHaveBeenCalledTimes(1);
    expect(api.saveIntakeAnswers).toHaveBeenCalledWith({
      caseId: 'case-1',
      expectedCaseVersion: 1,
      answers: { target_date: '2026-08-10' },
    });
    expect(first.case.case_id).toBe('case-1');

    const second = await ensureCaseAndSaveAnswers({
      caseId: first.case.case_id,
      caseVersion: first.case.case_version,
      answers: { role: 'Engineer' },
    });
    expect(api.createDecisionCase).toHaveBeenCalledTimes(1);
    expect(second.case.case_id).toBe('case-1');
    expect(api.saveIntakeAnswers).toHaveBeenLastCalledWith({
      caseId: 'case-1',
      expectedCaseVersion: 3,
      answers: { role: 'Engineer' },
    });
  });

  it('does not invent authoritative caseVersion client-side', async () => {
    vi.mocked(api.createDecisionCase).mockResolvedValue({
      case_id: 'case-2',
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
        case_id: 'case-2',
        owner_subject_id: 'e5-dev-owner',
        decision_type_id: 'car-interview',
        family_id: 'visibility',
        title: 'Attend job interview',
        state: 'intake',
        activation_phase: 'intake',
        mode: 'evaluate_date',
        precision_level: 'L1',
        case_version: 9,
        created_at: '2026-08-07T10:00:00Z',
        updated_at: '2026-08-07T10:00:01Z',
      },
      intake: { role: 'PM' },
      missing_required: ['target_date'],
      is_complete: false,
    });

    const result = await ensureCaseAndSaveAnswers({
      answers: { role: 'PM' },
    });
    expect(result.case.case_version).toBe(9);
    expect(api.saveIntakeAnswers).toHaveBeenCalledWith(
      expect.objectContaining({ expectedCaseVersion: 1 })
    );
  });

  it('loads package and history from Case API, not localStorage', async () => {
    vi.mocked(api.getDecisionCase).mockResolvedValue({
      case_id: 'case-3',
      owner_subject_id: 'e5-dev-owner',
      decision_type_id: 'car-interview',
      family_id: 'visibility',
      title: 'Attend job interview',
      state: 'evaluated',
      activation_phase: 'evaluated',
      mode: 'evaluate_date',
      precision_level: 'L3',
      case_version: 5,
      created_at: '2026-08-07T10:00:00Z',
      updated_at: '2026-08-07T10:00:05Z',
      intake: { target_date: '2026-08-10', role: 'Engineer' },
    });
    vi.mocked(api.listDecisionCaseEvaluations).mockResolvedValue({
      evaluations: [
        {
          evaluation_id: 'eval-1',
          case_id: 'case-3',
          case_version: 3,
          evaluation_version: 1,
          package_contract_version: '1.0.0',
          engine_id: 'decision-engine-stub-v1',
          dq_status: 'pass',
          created_at: '2026-08-07T10:00:05Z',
        },
      ],
    });
    vi.mocked(api.getEvaluation).mockResolvedValue({
      evaluation_id: 'eval-1',
      case_id: 'case-3',
      case_version: 3,
      evaluation_version: 1,
      package_contract_version: '1.0.0',
      engine_id: 'decision-engine-stub-v1',
      dq_status: 'pass',
      created_at: '2026-08-07T10:00:05Z',
      package: {
        schema_version: '1.0.0',
        engine_id: 'decision-engine-stub-v1',
      } as never,
    });
    vi.mocked(api.getDecisionCaseHistory).mockResolvedValue({
      events: [
        {
          history_id: 'h1',
          case_id: 'case-3',
          at: '2026-08-07T10:00:00Z',
          actor: 'system',
          event: 'case_created',
          from_state: null,
          to_state: null,
          case_version: 1,
          payload: {},
        },
      ],
    });

    const loaded = await loadCaseResult('case-3');
    expect(api.evaluateDecisionCase).not.toHaveBeenCalled();
    expect(loaded.evaluation.engine_id).toBe('decision-engine-stub-v1');
    expect(loaded.history[0]?.event).toBe('case_created');
    expect(api.getDecisionCaseHistory).toHaveBeenCalledWith('case-3');
  });
});
