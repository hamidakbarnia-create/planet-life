import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CarInterviewIntakeForm } from './CarInterviewIntakeForm';
import { DecisionCaseIntakeScreen } from './DecisionCaseIntakeScreen';
import { buildDecisionFrame, toPersistedFraming } from '@/lib/decision-frame';
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

describe('Ask → Frame date extraction for carry-forward', () => {
  it('extracts ISO evaluate date from typed interview Ask', () => {
    const frame = buildDecisionFrame(
      'Is September 12 good for my job interview?',
      {
        decision_type_id: 'car-interview',
        reference_year: 2026,
      }
    );
    expect(frame.time.scope).toBe('specific_date');
    expect(frame.time.dates).toEqual(['2026-09-12']);
    const persisted = toPersistedFraming({
      ...frame,
      operation: 'evaluate',
    });
    expect(persisted.date).toBe('2026-09-12');
  });

  it('leaves date missing when Ask has no trustworthy date', () => {
    const frame = buildDecisionFrame('Is my interview timing good?', {
      decision_type_id: 'car-interview',
    });
    expect(frame.time.dates ?? []).toHaveLength(0);
  });
});

describe('intake carry-forward UX', () => {
  it('marks known date and focuses missing role', () => {
    render(
      <CarInterviewIntakeForm
        lang="en"
        initialIntake={{ target_date: '2026-09-12' }}
        caseMode="evaluate_date"
        onSubmitAnswers={vi.fn()}
        onComplete={vi.fn()}
      />
    );

    expect(
      (screen.getByTestId('intake-target_date') as HTMLInputElement).value
    ).toBe('2026-09-12');
    expect(screen.getByTestId('intake-known-hint').textContent).toMatch(
      /understood from your question/i
    );
    expect(
      screen.getByTestId('intake-role').closest('label')?.getAttribute('data-focus-missing')
    ).toBe('true');
    expect(screen.getByTestId('intake-status').textContent).toMatch(/Role/i);
  });

  it('persists edited prefilled date on Save', async () => {
    vi.mocked(api.getDecisionCase).mockResolvedValue({
      case_id: 'case-edit',
      owner_subject_id: 'owner',
      decision_type_id: 'car-interview',
      family_id: 'visibility',
      title: 'Interview',
      state: 'intake',
      activation_phase: 'intake',
      mode: 'evaluate_date',
      precision_level: 'L1',
      case_version: 2,
      created_at: '2026-08-07T10:00:00Z',
      updated_at: '2026-08-07T10:00:00Z',
      intake: {
        target_date: '2026-09-12',
        decision_frame: {
          operation: 'evaluate',
          time_scope: 'specific_date',
          date: '2026-09-12',
        },
      },
    });
    vi.mocked(api.saveIntakeAnswers).mockResolvedValue({
      case: {
        case_id: 'case-edit',
        owner_subject_id: 'owner',
        decision_type_id: 'car-interview',
        family_id: 'visibility',
        title: 'Interview',
        state: 'intake',
        activation_phase: 'intake',
        mode: 'evaluate_date',
        precision_level: 'L1',
        case_version: 3,
        created_at: '2026-08-07T10:00:00Z',
        updated_at: '2026-08-07T10:00:00Z',
      },
      intake: {
        target_date: '2026-09-15',
        role: 'Engineer',
        decision_frame: {
          operation: 'evaluate',
          time_scope: 'specific_date',
          date: '2026-09-12',
        },
      },
      is_complete: true,
      missing_required: [],
    });

    render(<DecisionCaseIntakeScreen lang="en" caseId="case-edit" />);
    await waitFor(() => {
      expect(screen.getByTestId('intake-target_date')).toBeTruthy();
    });

    fireEvent.change(screen.getByTestId('intake-target_date'), {
      target: { value: '2026-09-15' },
    });
    fireEvent.change(screen.getByTestId('intake-role'), {
      target: { value: 'Engineer' },
    });
    fireEvent.click(screen.getByTestId('intake-save'));

    await waitFor(() => {
      expect(api.saveIntakeAnswers).toHaveBeenCalledWith(
        expect.objectContaining({
          caseId: 'case-edit',
          expectedCaseVersion: 2,
          answers: expect.objectContaining({
            target_date: '2026-09-15',
            role: 'Engineer',
          }),
        })
      );
    });
  });

  it('Continue still saves then completes', async () => {
    vi.mocked(api.getDecisionCase).mockResolvedValue({
      case_id: 'case-go',
      owner_subject_id: 'owner',
      decision_type_id: 'car-interview',
      family_id: 'visibility',
      title: 'Interview',
      state: 'intake',
      activation_phase: 'intake',
      mode: 'evaluate_date',
      precision_level: 'L1',
      case_version: 2,
      created_at: '2026-08-07T10:00:00Z',
      updated_at: '2026-08-07T10:00:00Z',
      intake: {
        target_date: '2026-09-12',
        decision_frame: {
          operation: 'evaluate',
          time_scope: 'specific_date',
          date: '2026-09-12',
        },
      },
    });
    vi.mocked(api.saveIntakeAnswers).mockResolvedValue({
      case: {
        case_id: 'case-go',
        owner_subject_id: 'owner',
        decision_type_id: 'car-interview',
        family_id: 'visibility',
        title: 'Interview',
        state: 'intake',
        activation_phase: 'intake',
        mode: 'evaluate_date',
        precision_level: 'L1',
        case_version: 3,
        created_at: '2026-08-07T10:00:00Z',
        updated_at: '2026-08-07T10:00:00Z',
      },
      intake: {
        target_date: '2026-09-12',
        role: 'Engineer',
      },
      is_complete: true,
      missing_required: [],
    });
    vi.mocked(completeCaseIntake).mockResolvedValue({
      case: {
        case_id: 'case-go',
        owner_subject_id: 'owner',
        decision_type_id: 'car-interview',
        family_id: 'visibility',
        title: 'Interview',
        state: 'evidence_ready',
        activation_phase: 'evidence',
        mode: 'evaluate_date',
        precision_level: 'L1',
        case_version: 4,
        created_at: '2026-08-07T10:00:00Z',
        updated_at: '2026-08-07T10:00:00Z',
      },
    } as never);

    render(<DecisionCaseIntakeScreen lang="en" caseId="case-go" />);
    await waitFor(() => {
      expect(screen.getByTestId('intake-role')).toBeTruthy();
    });
    fireEvent.change(screen.getByTestId('intake-role'), {
      target: { value: 'Engineer' },
    });
    fireEvent.click(screen.getByTestId('intake-complete'));

    await waitFor(() => {
      expect(api.saveIntakeAnswers).toHaveBeenCalled();
      expect(completeCaseIntake).toHaveBeenCalled();
      expect(push).toHaveBeenCalledWith('/decision-cases/case-go/result');
    });
  });
});
