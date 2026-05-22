import { API_BASE } from './calendar-scores';
import { chartPreferenceFields } from './app-settings';
import type { BirthProfile } from './birth-profile';

export type VaultReadingLayer = {
  executive: string;
  strategic: string;
  technical: string;
  headline?: string;
  intensity?: string;
  sign?: string;
  house?: number;
};

export type VaultMarsResponse = {
  planet: string;
  lang: string;
  verdict: Record<string, unknown>;
  reading: VaultReadingLayer;
};

export async function fetchVaultMarsReading(
  profile: BirthProfile,
  lang: string,
): Promise<VaultMarsResponse> {
  const prefs = chartPreferenceFields();
  const res = await fetch(`${API_BASE}/api/vault/mars`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      location: profile.location,
      lang,
      house_system: prefs.house_system,
      zodiac: prefs.zodiac,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { detail?: string }).detail ?? `Vault API error ${res.status}`,
    );
  }
  return res.json() as Promise<VaultMarsResponse>;
}
