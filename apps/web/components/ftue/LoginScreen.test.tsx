import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { LoginScreen } from '@/components/ftue/LoginScreen';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    replace.mockClear();
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders FTUE sign-in title and tablist', async () => {
    render(<LoginScreen />);
    expect(await screen.findByRole('heading', { name: /sign in to continue/i })).toBeTruthy();
    expect(screen.getByRole('tablist', { name: /sign-in method/i })).toBeTruthy();
    const emailTab = screen.getByRole('tab', { name: /email/i });
    expect(emailTab.getAttribute('aria-selected')).toBe('true');
  });

  it('shows validation error for invalid email', async () => {
    render(<LoginScreen />);
    const input = await screen.findByLabelText(/email address/i);
    fireEvent.change(input, { target: { value: 'not-an-email' } });
    fireEvent.click(screen.getByRole('button', { name: /send code/i }));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/valid email/i);
  });

  it('tracks oauth unavailable without signing in', async () => {
    render(<LoginScreen />);
    await screen.findByRole('heading', { name: /sign in to continue/i });
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));
    expect(screen.getByRole('status').textContent).toMatch(/coming soon/i);
    const queue = localStorage.getItem('planet-life-ftue-events');
    expect(queue).toContain('ftue_auth_oauth_unavailable');
  });

  it('shows clickable Terms of Service and Privacy Policy links', async () => {
    render(<LoginScreen />);
    await screen.findByRole('heading', { name: /sign in to continue/i });
    const terms = screen.getByRole('link', { name: /terms of service/i });
    const privacy = screen.getByRole('link', { name: /privacy policy/i });
    expect(terms.getAttribute('href')).toBe('/terms');
    expect(privacy.getAttribute('href')).toBe('/privacy');
    expect(screen.getByText(/by continuing, you agree to the/i)).toBeTruthy();
    expect(screen.getByText(/and acknowledge the/i)).toBeTruthy();
  });
});
