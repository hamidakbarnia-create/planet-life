export type AuthMethod = 'email' | 'phone' | 'google' | 'apple';

export interface AuthSession {
  method: AuthMethod;
  identifier: string;
  verifiedAt: number;
}

const STORAGE_KEY = 'planet-life-auth';

export function loadSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function isAuthed(): boolean {
  return loadSession() != null;
}
