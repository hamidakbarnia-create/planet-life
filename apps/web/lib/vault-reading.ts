import { API_BASE } from './calendar-scores';
import { chartPreferenceFields } from './app-settings';
import type { BirthProfile } from './birth-profile';
import { loadPeople } from './people-storage';

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

export type VaultGhostDaysResponse = {
  planet: string;
  action_type: string;
  lang: string;
  windows: Array<{ date: string; score: number; rating?: string }>;
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

export async function fetchVaultGhostDaysReading(
  profile: BirthProfile,
  lang: string,
): Promise<VaultGhostDaysResponse> {
  const prefs = chartPreferenceFields();
  const res = await fetch(`${API_BASE}/api/vault/ghost-days`, {
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
  return res.json() as Promise<VaultGhostDaysResponse>;
}

export type VaultHotAttractionDaysResponse = VaultGhostDaysResponse;

export async function fetchVaultHotAttractionDaysReading(
  profile: BirthProfile,
  lang: string,
): Promise<VaultHotAttractionDaysResponse> {
  const prefs = chartPreferenceFields();
  const res = await fetch(`${API_BASE}/api/vault/hot-attraction-days`, {
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
  return res.json() as Promise<VaultHotAttractionDaysResponse>;
}

export type VaultMoneyAskDaysResponse = VaultGhostDaysResponse;

export async function fetchVaultMoneyAskDaysReading(
  profile: BirthProfile,
  lang: string,
): Promise<VaultMoneyAskDaysResponse> {
  const prefs = chartPreferenceFields();
  const res = await fetch(`${API_BASE}/api/vault/money-ask-days`, {
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
  return res.json() as Promise<VaultMoneyAskDaysResponse>;
}

export type VaultTodaysColorResponse = {
  planet: string;
  lang: string;
  verdict: Record<string, unknown>;
  reading: VaultReadingLayer;
};

export type VaultYesDayResponse = VaultTodaysColorResponse;

export async function fetchVaultYesDayReading(
  profile: BirthProfile,
  lang: string,
): Promise<VaultYesDayResponse> {
  const prefs = chartPreferenceFields();
  const res = await fetch(`${API_BASE}/api/vault/yes-day`, {
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
  return res.json() as Promise<VaultYesDayResponse>;
}

export async function fetchVaultTodaysColorReading(
  profile: BirthProfile,
  lang: string,
): Promise<VaultTodaysColorResponse> {
  const prefs = chartPreferenceFields();
  const res = await fetch(`${API_BASE}/api/vault/todays-color`, {
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
  return res.json() as Promise<VaultTodaysColorResponse>;
}

export type VaultTodaysPerfumeResponse = VaultTodaysColorResponse;

export async function fetchVaultTodaysPerfumeReading(
  profile: BirthProfile,
  lang: string,
): Promise<VaultTodaysPerfumeResponse> {
  const prefs = chartPreferenceFields();
  const res = await fetch(`${API_BASE}/api/vault/todays-perfume`, {
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
  return res.json() as Promise<VaultTodaysPerfumeResponse>;
}

export type VaultLiveReelTimeResponse = VaultTodaysColorResponse;

export async function fetchVaultLiveReelTimeReading(
  profile: BirthProfile,
  lang: string,
): Promise<VaultLiveReelTimeResponse> {
  const prefs = chartPreferenceFields();
  const res = await fetch(`${API_BASE}/api/vault/live-reel-time`, {
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
  return res.json() as Promise<VaultLiveReelTimeResponse>;
}

export type VaultDateOutfitResponse = VaultTodaysColorResponse;

export async function fetchVaultDateOutfitReading(
  profile: BirthProfile,
  lang: string,
): Promise<VaultDateOutfitResponse> {
  const prefs = chartPreferenceFields();
  const res = await fetch(`${API_BASE}/api/vault/date-outfit`, {
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
  return res.json() as Promise<VaultDateOutfitResponse>;
}

/** Default shortlist uses lat,lon so ranking never depends on Nominatim. */
const BEST_COUNTRIES_DEFAULT_SHORTLIST = [
  'London|51.5074,-0.1278',
  'Dubai|25.2048,55.2708',
  'New York|40.7128,-74.0060',
  'Tokyo|35.6762,139.6503',
  'Tehran|35.6892,51.3890',
];

export type VaultBestCountriesResponse = {
  planet: string;
  lang: string;
  goal: string;
  goal_area: string;
  ranked: Array<Record<string, unknown>>;
  missing_inputs: string[];
  verdict: Record<string, unknown>;
  reading: VaultReadingLayer;
};

export async function fetchVaultBestCountriesReading(
  profile: BirthProfile,
  lang: string,
  goal: string = 'relationship',
  locations?: string[],
): Promise<VaultBestCountriesResponse> {
  const prefs = chartPreferenceFields();
  const shortlist =
    locations && locations.length > 0
      ? locations
      : BEST_COUNTRIES_DEFAULT_SHORTLIST;
  const cur = profile.current_location;
  let currentLocation: string | undefined;
  if (cur?.latitude != null && cur?.longitude != null) {
    const label = cur.country ? `${cur.city}, ${cur.country}` : cur.city;
    currentLocation = `${label}|${cur.latitude},${cur.longitude}`;
  }
  const res = await fetch(`${API_BASE}/api/vault/best-countries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      location: profile.location,
      lang,
      house_system: prefs.house_system,
      zodiac: prefs.zodiac,
      goal,
      locations: shortlist,
      current_location: currentLocation,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { detail?: string }).detail ?? `Vault API error ${res.status}`,
    );
  }
  return res.json() as Promise<VaultBestCountriesResponse>;
}

export type VaultBusinessGeographyResponse = VaultBestCountriesResponse;

export async function fetchVaultBusinessGeographyReading(
  profile: BirthProfile,
  lang: string,
  goal: string = 'expansion',
  locations?: string[],
): Promise<VaultBusinessGeographyResponse> {
  const prefs = chartPreferenceFields();
  const shortlist =
    locations && locations.length > 0
      ? locations
      : BEST_COUNTRIES_DEFAULT_SHORTLIST;
  const cur = profile.current_location;
  let currentLocation: string | undefined;
  if (cur?.latitude != null && cur?.longitude != null) {
    const label = cur.country ? `${cur.city}, ${cur.country}` : cur.city;
    currentLocation = `${label}|${cur.latitude},${cur.longitude}`;
  }
  const res = await fetch(`${API_BASE}/api/vault/business-geography`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      location: profile.location,
      lang,
      house_system: prefs.house_system,
      zodiac: prefs.zodiac,
      goal,
      locations: shortlist,
      current_location: currentLocation,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { detail?: string }).detail ?? `Vault API error ${res.status}`,
    );
  }
  return res.json() as Promise<VaultBusinessGeographyResponse>;
}

export type VaultPartnerProfileResponse = {
  planet: string;
  lang: string;
  goal: string;
  mode: string;
  missing_inputs: string[];
  synastry_score: number | null;
  verdict: Record<string, unknown>;
  reading: VaultReadingLayer;
};

export async function fetchVaultPartnerProfileReading(
  profile: BirthProfile,
  lang: string,
  goal: string = 'romantic',
): Promise<VaultPartnerProfileResponse> {
  const prefs = chartPreferenceFields();
  const people = loadPeople();
  const partner = people.find(
    (p) => p.birth_date && p.birth_time && p.location,
  );
  const res = await fetch(`${API_BASE}/api/vault/partner-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      location: profile.location,
      lang,
      house_system: prefs.house_system,
      zodiac: prefs.zodiac,
      goal,
      partner_birth_date: partner?.birth_date,
      partner_birth_time: partner?.birth_time,
      partner_location: partner?.location,
      partner_relationship: partner?.relationship,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { detail?: string }).detail ?? `Vault API error ${res.status}`,
    );
  }
  return res.json() as Promise<VaultPartnerProfileResponse>;
}

export type VaultCompatibilityResponse = {
  planet: string;
  lang: string;
  relationship_type: string;
  missing_inputs: string[];
  overall_score: number | null;
  dimensions: Record<string, unknown>;
  verdict: Record<string, unknown>;
  reading: VaultReadingLayer;
};

export async function fetchVaultCompatibilityReading(
  profile: BirthProfile,
  lang: string,
  relationshipType: string = 'romantic',
  concern?: string,
): Promise<VaultCompatibilityResponse> {
  const prefs = chartPreferenceFields();
  const people = loadPeople();
  const partner = people.find(
    (p) => p.birth_date && p.location,
  );
  const partnerTimeKnown = Boolean(partner?.birth_time);
  const res = await fetch(`${API_BASE}/api/vault/compatibility`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      location: profile.location,
      lang,
      house_system: prefs.house_system,
      zodiac: prefs.zodiac,
      relationship_type: relationshipType,
      partner_birth_date: partner?.birth_date,
      partner_birth_time: partner?.birth_time,
      partner_location: partner?.location,
      concern,
      user_birth_time_known: Boolean(profile.birth_time),
      partner_birth_time_known: partnerTimeKnown,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { detail?: string }).detail ?? `Vault API error ${res.status}`,
    );
  }
  return res.json() as Promise<VaultCompatibilityResponse>;
}

export type VaultShadowSynastryResponse = {
  planet: string;
  lang: string;
  relationship_type: string;
  mode: string;
  missing_inputs: string[];
  signals: Record<string, unknown>;
  planet_roles?: Record<string, unknown>;
  observed?: string[];
  inferred?: string[];
  unknown?: string[];
  behaviors?: string[];
  questions?: string[];
  verdict: Record<string, unknown>;
  reading: VaultReadingLayer;
};

export type VaultCheatingRadarResponse = VaultShadowSynastryResponse;
export type VaultTrustPatternsResponse = VaultShadowSynastryResponse;
export type VaultCommunicationRiskResponse = VaultShadowSynastryResponse;

async function fetchVaultShadowSynastryReading(
  endpoint: 'cheating-radar' | 'trust-patterns' | 'communication-risk',
  profile: BirthProfile,
  lang: string,
  relationshipType: string = 'romantic',
  concern?: string,
): Promise<VaultShadowSynastryResponse> {
  const prefs = chartPreferenceFields();
  const people = loadPeople();
  const partner = people.find((p) => p.birth_date && p.location);
  const partnerTimeKnown = Boolean(partner?.birth_time);
  const res = await fetch(`${API_BASE}/api/vault/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      location: profile.location,
      lang,
      house_system: prefs.house_system,
      zodiac: prefs.zodiac,
      relationship_type: relationshipType,
      partner_birth_date: partner?.birth_date,
      partner_birth_time: partner?.birth_time,
      partner_location: partner?.location,
      concern,
      user_birth_time_known: Boolean(profile.birth_time),
      partner_birth_time_known: partnerTimeKnown,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { detail?: string }).detail ?? `Vault API error ${res.status}`,
    );
  }
  return res.json() as Promise<VaultShadowSynastryResponse>;
}

export async function fetchVaultCheatingRadarReading(
  profile: BirthProfile,
  lang: string,
  relationshipType: string = 'romantic',
  concern?: string,
): Promise<VaultCheatingRadarResponse> {
  return fetchVaultShadowSynastryReading(
    'cheating-radar',
    profile,
    lang,
    relationshipType,
    concern,
  );
}

export async function fetchVaultTrustPatternsReading(
  profile: BirthProfile,
  lang: string,
  relationshipType: string = 'romantic',
  concern?: string,
): Promise<VaultTrustPatternsResponse> {
  return fetchVaultShadowSynastryReading(
    'trust-patterns',
    profile,
    lang,
    relationshipType,
    concern,
  );
}

export async function fetchVaultCommunicationRiskReading(
  profile: BirthProfile,
  lang: string,
  relationshipType: string = 'romantic',
  concern?: string,
): Promise<VaultCommunicationRiskResponse> {
  return fetchVaultShadowSynastryReading(
    'communication-risk',
    profile,
    lang,
    relationshipType,
    concern,
  );
}
