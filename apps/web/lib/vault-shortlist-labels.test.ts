import { describe, expect, it } from 'vitest';

import { localizeFixedShortlistLabel } from './vault-shortlist-labels';

describe('fixed shortlist city labels', () => {
  it('localizes known default cities and keeps user-entered names', () => {
    expect(localizeFixedShortlistLabel('London', 'ru')).toBe('Лондон');
    expect(localizeFixedShortlistLabel('London', 'fa')).toBe('لندن');
    expect(localizeFixedShortlistLabel('London', 'ar')).toBe('لندن');
    expect(localizeFixedShortlistLabel('New York', 'fa')).toBe('نیویورک');
    expect(localizeFixedShortlistLabel('Tehran', 'ar')).toBe('طهران');
    expect(localizeFixedShortlistLabel('London', 'en')).toBe('London');
  });

  it('does not rewrite a user-entered city name', () => {
    expect(localizeFixedShortlistLabel('Manchester', 'ru')).toBe('Manchester');
    expect(localizeFixedShortlistLabel('رشت', 'fa')).toBe('رشت');
    expect(localizeFixedShortlistLabel('London|51.5074,-0.1278', 'ru')).toBe(
      'London|51.5074,-0.1278',
    );
  });
});
