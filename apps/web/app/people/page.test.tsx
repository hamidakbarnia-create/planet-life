import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  PEOPLE_STORAGE_KEY,
  addPerson,
  loadPeople,
} from '@/lib/people-storage';

import PeoplePage from './page';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock('@/components/AppShell', () => ({
  AppShell: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
});

beforeEach(() => {
  localStorage.clear();
});

function openAddForm() {
  render(<PeoplePage />);
  fireEvent.click(screen.getByRole('button', { name: /add person/i }));
}

describe('People input integrity', () => {
  it('does not prefill 1990-01-15 or 12:00 on a new person', () => {
    openAddForm();
    expect((screen.getByLabelText('Birth date') as HTMLInputElement).value).toBe('');
    expect(screen.getByTestId('people-time-unknown')).toHaveProperty('checked', true);
    expect(screen.queryByLabelText('hour')).toBeNull();
  });

  it('keeps a cleared date as a validation error and does not save 1990-01-15', () => {
    openAddForm();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByPlaceholderText('Type a city name…'), {
      target: { value: 'London' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByTestId('people-date-error').textContent).toBe('Birth date is required.');
    expect(loadPeople()).toEqual([]);
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Ada');
    expect((screen.getByPlaceholderText('Type a city name…') as HTMLInputElement).value).toBe(
      'London',
    );
  });

  it('does not restore the previous city after the user clears it', async () => {
    addPerson({
      name: 'Ada',
      birth_date: '1988-04-02',
      birth_time: '08:30',
      location: 'London',
      relationship: 'friend',
    });
    render(<PeoplePage />);
    await waitFor(() => expect(screen.getByText('Ada')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const city = screen.getByPlaceholderText('Type a city name…') as HTMLInputElement;
    expect(city.value).toBe('London');
    fireEvent.change(city, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByTestId('people-city-error').textContent).toBe('Birth city is required.');
    expect(city.value).toBe('');
    expect(loadPeople()[0]?.location).toBe('London');
  });

  it('saves unknown time as empty and reopens it as unknown', async () => {
    openAddForm();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByLabelText('Birth date'), { target: { value: '1988-04-02' } });
    fireEvent.change(screen.getByPlaceholderText('Type a city name…'), {
      target: { value: 'London' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const stored = JSON.parse(localStorage.getItem(PEOPLE_STORAGE_KEY) ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].birth_date).toBe('1988-04-02');
    expect(stored[0].birth_time).toBe('');
    expect(stored[0].location).toBe('London');

    cleanup();
    render(<PeoplePage />);
    await waitFor(() => expect(screen.getByText('Ada')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByTestId('people-time-unknown')).toHaveProperty('checked', true);
    expect((screen.getByLabelText('Birth date') as HTMLInputElement).value).toBe('1988-04-02');
  });

  it('leaves hour blank when only minute 30 is selected and Save fails', () => {
    openAddForm();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByLabelText('Birth date'), { target: { value: '1988-04-02' } });
    fireEvent.change(screen.getByPlaceholderText('Type a city name…'), {
      target: { value: 'London' },
    });
    fireEvent.click(screen.getByTestId('people-time-unknown'));
    fireEvent.change(screen.getByLabelText('minute'), { target: { value: '30' } });
    expect((screen.getByLabelText('hour') as HTMLSelectElement).value).toBe('');
    expect((screen.getByLabelText('minute') as HTMLSelectElement).value).toBe('30');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByTestId('people-time-error').textContent).toBe(
      'Enter a birth time, or mark it unknown.',
    );
    expect(loadPeople()).toEqual([]);
  });

  it('leaves minute blank when only hour 12 is selected and Save fails', () => {
    openAddForm();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByLabelText('Birth date'), { target: { value: '1988-04-02' } });
    fireEvent.change(screen.getByPlaceholderText('Type a city name…'), {
      target: { value: 'London' },
    });
    fireEvent.click(screen.getByTestId('people-time-unknown'));
    fireEvent.change(screen.getByLabelText('hour'), { target: { value: '12' } });
    expect((screen.getByLabelText('hour') as HTMLSelectElement).value).toBe('12');
    expect((screen.getByLabelText('minute') as HTMLSelectElement).value).toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByTestId('people-time-error').textContent).toBe(
      'Enter a birth time, or mark it unknown.',
    );
    expect(loadPeople()).toEqual([]);
  });

  it('fails Save after clearing either component of an existing time', async () => {
    addPerson({
      name: 'Ada',
      birth_date: '1988-04-02',
      birth_time: '12:00',
      location: 'London',
      relationship: 'friend',
    });
    render(<PeoplePage />);
    await waitFor(() => expect(screen.getByText('Ada')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText('hour'), { target: { value: '' } });
    expect((screen.getByLabelText('minute') as HTMLSelectElement).value).toBe('00');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByTestId('people-time-error').textContent).toBe(
      'Enter a birth time, or mark it unknown.',
    );
    expect(loadPeople()[0]?.birth_time).toBe('12:00');

    fireEvent.change(screen.getByLabelText('hour'), { target: { value: '12' } });
    fireEvent.change(screen.getByLabelText('minute'), { target: { value: '' } });
    expect((screen.getByLabelText('hour') as HTMLSelectElement).value).toBe('12');
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByTestId('people-time-error').textContent).toBe(
      'Enter a birth time, or mark it unknown.',
    );
    expect(loadPeople()[0]?.birth_time).toBe('12:00');
  });

  it('saves 12:00 as known noon and reopens it as known noon', async () => {
    openAddForm();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByLabelText('Birth date'), { target: { value: '1988-04-02' } });
    fireEvent.change(screen.getByPlaceholderText('Type a city name…'), {
      target: { value: 'London' },
    });
    fireEvent.click(screen.getByTestId('people-time-unknown'));
    fireEvent.change(screen.getByLabelText('hour'), { target: { value: '12' } });
    fireEvent.change(screen.getByLabelText('minute'), { target: { value: '00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(loadPeople()[0]?.birth_time).toBe('12:00');

    cleanup();
    render(<PeoplePage />);
    await waitFor(() => expect(screen.getByText('Ada')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByTestId('people-time-unknown')).toHaveProperty('checked', false);
    expect((screen.getByLabelText('hour') as HTMLSelectElement).value).toBe('12');
    expect((screen.getByLabelText('minute') as HTMLSelectElement).value).toBe('00');
  });

  it('changes a known time to unknown and reopens it as unknown', async () => {
    addPerson({
      name: 'Ada',
      birth_date: '1988-04-02',
      birth_time: '12:00',
      location: 'London',
      relationship: 'friend',
    });
    render(<PeoplePage />);
    await waitFor(() => expect(screen.getByText('Ada')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByTestId('people-time-unknown'));
    expect(screen.getByTestId('people-time-unknown')).toHaveProperty('checked', true);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(loadPeople()[0]?.birth_time).toBe('');

    cleanup();
    render(<PeoplePage />);
    await waitFor(() => expect(screen.getByText('Ada')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByTestId('people-time-unknown')).toHaveProperty('checked', true);
    expect(screen.queryByLabelText('hour')).toBeNull();
  });

  it('keeps a cleared edit date in the draft and does not overwrite stored data', async () => {
    addPerson({
      name: 'Ada',
      birth_date: '1988-04-02',
      birth_time: '08:30',
      location: 'London',
      relationship: 'friend',
    });
    render(<PeoplePage />);
    await waitFor(() => expect(screen.getByText('Ada')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const date = screen.getByLabelText('Birth date') as HTMLInputElement;
    fireEvent.change(date, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByTestId('people-date-error').textContent).toBe('Birth date is required.');
    expect(date.value).toBe('');
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Ada');
    expect(loadPeople()[0]?.birth_date).toBe('1988-04-02');
    expect(loadPeople()[0]?.birth_time).toBe('08:30');
    expect(loadPeople()[0]?.location).toBe('London');
  });
});
