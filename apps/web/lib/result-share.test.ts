import { describe, expect, it } from 'vitest';
import { buildResultShareText, getResultCopy } from './ftue-i18n';

describe('buildResultShareText', () => {
  const profileLeakMarkers = [
    'New York',
    'United States',
    '40.7128',
    '-74.006',
    '1990-06-15',
    '14:30',
    'Alex',
    'birth_place',
    'birth_date',
    'birth_time',
    'latitude',
    'longitude',
    'Rafsanjan',
    'coordinates',
  ];

  it('includes only safe insight content', () => {
    const copy = getResultCopy('en');
    const text = buildResultShareText(copy, 'What should I focus on this week?');

    expect(text).toContain('Your Journey Begins');
    expect(text).toContain(copy.questionLabel);
    expect(text).toContain('What should I focus on this week?');
    expect(text).toContain(copy.insightEyebrow);
    expect(text).toContain(copy.insightBody);
    expect(text).toContain(copy.previewNote);
  });

  it('excludes location and profile fields', () => {
    const copy = getResultCopy('en');
    const text = buildResultShareText(copy, 'What should I focus on this week?');

    for (const marker of profileLeakMarkers) {
      expect(text.toLowerCase()).not.toContain(marker.toLowerCase());
    }
  });

  it('localizes share content with the active locale', () => {
    const faCopy = getResultCopy('fa');
    const text = buildResultShareText(faCopy, 'سؤال من');

    expect(text).toContain('آغاز مسیر شما');
    expect(text).toContain(faCopy.questionLabel);
    expect(text).toContain(faCopy.insightBody);
  });
});
