import { describe, expect, it } from 'vitest';
import {
  CANONICAL_INVESTOR_MEETING_REQUIRED_FIELD_IDS,
  investorMissingRequiredFields,
  investorRequiredFieldsPresent,
  mergeInvestorMeetingFormAnswers,
} from './investor-meeting-form';

describe('investor-meeting-form helpers', () => {
  it('requires target_date and meeting_goal only', () => {
    expect(CANONICAL_INVESTOR_MEETING_REQUIRED_FIELD_IDS).toEqual([
      'target_date',
      'meeting_goal',
    ]);
    expect(
      investorRequiredFieldsPresent({
        target_date: '2026-08-18',
        meeting_goal: 'Raise seed',
      })
    ).toBe(true);
    expect(
      investorMissingRequiredFields({ target_date: '2026-08-18' })
    ).toEqual(['meeting_goal']);
  });

  it('does not invent meeting_goal when merging answers', () => {
    const merged = mergeInvestorMeetingFormAnswers(
      { target_date: '2026-08-18' },
      { investor_name: 'Acme Ventures' }
    );
    expect(merged.meeting_goal).toBeUndefined();
    expect(merged.investor_name).toBe('Acme Ventures');
  });
});
