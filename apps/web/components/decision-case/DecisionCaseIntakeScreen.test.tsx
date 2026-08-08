import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DecisionCaseIntakeScreen } from './DecisionCaseIntakeScreen';
import * as api from '@/lib/decision-case/api-client';
import { completeCaseIntake } from '@/lib/decision-case/session';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

vi.mock('@/lib/decision-case/api-client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/decision-case/api-client')>(
    '@/lib/decision-case/api-client'
  );
  return {
    ...actual,
    getDecisionCase: vi.fn(),
    saveIntakeAnswers: vi.fn(),
  };
});

vi.mock('@/lib/decision-case/session', async () => {
  const actual = await vi.importActual<typeof import('@/lib/decision-case/session')>(
    '@/lib/decision-case/session'
  );
  return {
    ...actual,
    completeCaseIntake: vi.fn(),
  };
});

afterEach(() => {
  cleanup();
  push.mockReset();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DecisionCaseIntakeScreen', () => {
  it('renders car interview fields for car-interview cases', async () => {
    vi.mocked(api.getDecisionCase).mockResolvedValue({
      case_id: 'case-car',
      owner_subject_id: 'owner',
      decision_type_id: 'car-interview',
      family_id: 'visibility',
      title: 'Attend job interview',
      state: 'intake',
      activation_phase: 'intake',
      mode: 'evaluate_date',
      precision_level: 'L1',
      case_version: 2,
      created_at: '2026-08-07T10:00:00Z',
      updated_at: '2026-08-07T10:00:00Z',
      intake: {
        decision_frame: {
          operation: 'evaluate',
          time_scope: 'specific_date',
          date: '2026-08-18',
        },
      },
    });

    render(<DecisionCaseIntakeScreen lang="en" caseId="case-car" />);

    await waitFor(() => {
      expect(screen.getByTestId('car-interview-intake-form')).toBeTruthy();
    });
    expect(screen.getByTestId('intake-role')).toBeTruthy();
    const date = screen.getByTestId('intake-target_date') as HTMLInputElement;
    expect(date.value).toBe('2026-08-18');
  });

  it('renders investor required fields and prefills date only', async () => {
    vi.mocked(api.getDecisionCase).mockResolvedValue({
      case_id: 'case-inv',
      owner_subject_id: 'owner',
      decision_type_id: 'bus-investor-meeting',
      family_id: 'visibility',
      title: 'Meet an investor',
      state: 'intake',
      activation_phase: 'intake',
      mode: 'evaluate_date',
      precision_level: 'L1',
      case_version: 2,
      created_at: '2026-08-07T10:00:00Z',
      updated_at: '2026-08-07T10:00:00Z',
      intake: {
        decision_frame: {
          operation: 'evaluate',
          time_scope: 'specific_date',
          date: '2026-08-20',
          raw_intent: 'Is August 20 good for pitching?',
        },
      },
    });

    render(<DecisionCaseIntakeScreen lang="en" caseId="case-inv" />);

    await waitFor(() => {
      expect(screen.getByTestId('investor-meeting-intake-form')).toBeTruthy();
    });
    const date = screen.getByTestId('intake-target_date') as HTMLInputElement;
    const goal = screen.getByTestId('intake-meeting_goal') as HTMLInputElement;
    expect(date.value).toBe('2026-08-20');
    expect(goal.value).toBe('');
  });

  it('fails closed for unknown decision types', async () => {
    vi.mocked(api.getDecisionCase).mockResolvedValue({
      case_id: 'case-x',
      owner_subject_id: 'owner',
      decision_type_id: 'mar-wedding-date',
      family_id: 'timing_opt',
      title: 'Wedding',
      state: 'intake',
      activation_phase: 'intake',
      mode: 'none',
      precision_level: 'L1',
      case_version: 1,
      created_at: '2026-08-07T10:00:00Z',
      updated_at: '2026-08-07T10:00:00Z',
      intake: {},
    });

    render(<DecisionCaseIntakeScreen lang="en" caseId="case-x" />);

    await waitFor(() => {
      expect(screen.getByTestId('intake-error')).toBeTruthy();
    });
    expect(screen.queryByTestId('car-interview-intake-form')).toBeNull();
    expect(screen.queryByTestId('investor-meeting-intake-form')).toBeNull();
  });

  it('investor save → complete → result navigation', async () => {
    vi.mocked(api.getDecisionCase).mockResolvedValue({
      case_id: 'case-inv',
      owner_subject_id: 'owner',
      decision_type_id: 'bus-investor-meeting',
      family_id: 'visibility',
      title: 'Meet an investor',
      state: 'intake',
      activation_phase: 'intake',
      mode: 'evaluate_date',
      precision_level: 'L1',
      case_version: 2,
      created_at: '2026-08-07T10:00:00Z',
      updated_at: '2026-08-07T10:00:00Z',
      intake: { target_date: '2026-08-20' },
    });
    vi.mocked(api.saveIntakeAnswers).mockResolvedValue({
      case: {
        case_id: 'case-inv',
        owner_subject_id: 'owner',
        decision_type_id: 'bus-investor-meeting',
        family_id: 'visibility',
        title: 'Meet an investor',
        state: 'intake',
        activation_phase: 'intake',
        mode: 'evaluate_date',
        precision_level: 'L1',
        case_version: 3,
        created_at: '2026-08-07T10:00:00Z',
        updated_at: '2026-08-07T10:00:01Z',
      },
      intake: {
        target_date: '2026-08-20',
        meeting_goal: 'Raise seed',
      },
      missing_required: [],
      is_complete: true,
    });
    vi.mocked(completeCaseIntake).mockResolvedValue({
      case: {
        case_id: 'case-inv',
        owner_subject_id: 'owner',
        decision_type_id: 'bus-investor-meeting',
        family_id: 'visibility',
        title: 'Meet an investor',
        state: 'evidence_ready',
        activation_phase: 'evidence_ready',
        mode: 'evaluate_date',
        precision_level: 'L1',
        case_version: 4,
        created_at: '2026-08-07T10:00:00Z',
        updated_at: '2026-08-07T10:00:02Z',
      },
      intake: {
        target_date: '2026-08-20',
        meeting_goal: 'Raise seed',
      },
      missing_required: [],
      is_complete: true,
    });

    render(<DecisionCaseIntakeScreen lang="en" caseId="case-inv" />);
    await waitFor(() => {
      expect(screen.getByTestId('intake-meeting_goal')).toBeTruthy();
    });

    fireEvent.change(screen.getByTestId('intake-meeting_goal'), {
      target: { value: 'Raise seed' },
    });
    fireEvent.click(screen.getByTestId('intake-complete'));

    await waitFor(() => {
      expect(api.saveIntakeAnswers).toHaveBeenCalled();
      expect(completeCaseIntake).toHaveBeenCalledWith({
        caseId: 'case-inv',
        caseVersion: 3,
      });
      expect(push).toHaveBeenCalledWith('/decision-cases/case-inv/result');
    });
  });

  it('car save → complete → result navigation still works', async () => {
    vi.mocked(api.getDecisionCase).mockResolvedValue({
      case_id: 'case-car',
      owner_subject_id: 'owner',
      decision_type_id: 'car-interview',
      family_id: 'visibility',
      title: 'Attend job interview',
      state: 'intake',
      activation_phase: 'intake',
      mode: 'evaluate_date',
      precision_level: 'L1',
      case_version: 2,
      created_at: '2026-08-07T10:00:00Z',
      updated_at: '2026-08-07T10:00:00Z',
      intake: { target_date: '2026-08-18' },
    });
    vi.mocked(api.saveIntakeAnswers).mockResolvedValue({
      case: {
        case_id: 'case-car',
        owner_subject_id: 'owner',
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
      intake: { target_date: '2026-08-18', role: 'Engineer' },
      missing_required: [],
      is_complete: true,
    });
    vi.mocked(completeCaseIntake).mockResolvedValue({
      case: {
        case_id: 'case-car',
        owner_subject_id: 'owner',
        decision_type_id: 'car-interview',
        family_id: 'visibility',
        title: 'Attend job interview',
        state: 'evidence_ready',
        activation_phase: 'evidence_ready',
        mode: 'evaluate_date',
        precision_level: 'L1',
        case_version: 4,
        created_at: '2026-08-07T10:00:00Z',
        updated_at: '2026-08-07T10:00:02Z',
      },
      intake: { target_date: '2026-08-18', role: 'Engineer' },
      missing_required: [],
      is_complete: true,
    });

    render(<DecisionCaseIntakeScreen lang="en" caseId="case-car" />);
    await waitFor(() => {
      expect(screen.getByTestId('intake-role')).toBeTruthy();
    });
    fireEvent.change(screen.getByTestId('intake-role'), {
      target: { value: 'Engineer' },
    });
    fireEvent.click(screen.getByTestId('intake-complete'));

    await waitFor(() => {
      expect(completeCaseIntake).toHaveBeenCalled();
      expect(push).toHaveBeenCalledWith('/decision-cases/case-car/result');
    });
  });
});
