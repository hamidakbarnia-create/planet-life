import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  PEOPLE_CHANGED_EVENT,
  PEOPLE_STORAGE_KEY,
  addPerson,
  loadPeople,
  removePerson,
  savePeople,
  updatePerson,
  type Person,
} from './people-storage';

function samplePerson(overrides: Partial<Person> = {}): Person {
  return {
    id: 'p1',
    name: 'Ada',
    birth_date: '1990-01-15',
    birth_time: '12:00',
    location: 'London',
    relationship: 'friend',
    createdAt: 1,
    ...overrides,
  };
}

describe('People storage change events', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('dispatches exactly one PEOPLE_CHANGED_EVENT after successful savePeople', () => {
    const spy = vi.fn();
    window.addEventListener(PEOPLE_CHANGED_EVENT, spy);
    const ok = savePeople([samplePerson()]);
    window.removeEventListener(PEOPLE_CHANGED_EVENT, spy);
    expect(ok).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(PEOPLE_STORAGE_KEY)).toBeTruthy();
  });

  it('does not dispatch when persistence fails', () => {
    const spy = vi.fn();
    window.addEventListener(PEOPLE_CHANGED_EVENT, spy);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    const ok = savePeople([samplePerson()]);
    window.removeEventListener(PEOPLE_CHANGED_EVENT, spy);
    expect(ok).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it('add/update/remove each inherit exactly one event through savePeople', () => {
    const spy = vi.fn();
    window.addEventListener(PEOPLE_CHANGED_EVENT, spy);

    const created = addPerson({
      name: 'Ada',
      birth_date: '1990-01-15',
      birth_time: '12:00',
      location: 'London',
      relationship: 'friend',
    });
    expect(created).toBeTruthy();
    expect(spy).toHaveBeenCalledTimes(1);

    const updated = updatePerson(created!.id, { name: 'Ada Lovelace' });
    expect(updated?.name).toBe('Ada Lovelace');
    expect(spy).toHaveBeenCalledTimes(2);

    removePerson(created!.id);
    expect(spy).toHaveBeenCalledTimes(3);

    window.removeEventListener(PEOPLE_CHANGED_EVENT, spy);
  });

  it('does not dispatch when loading People', () => {
    savePeople([samplePerson()]);
    const spy = vi.fn();
    window.addEventListener(PEOPLE_CHANGED_EVENT, spy);
    const list = loadPeople();
    window.removeEventListener(PEOPLE_CHANGED_EVENT, spy);
    expect(list).toHaveLength(1);
    expect(spy).not.toHaveBeenCalled();
  });
});
