import { API_BASE } from './api-config';
import { chartPreferenceFields } from './app-settings';
import type { BirthProfile } from './birth-profile';
import type { Person } from './people-storage';
import {
  partnerRelationshipForVaultApi,
  type VaultPartnerProfileGoal,
  type VaultRelationshipType,
} from './vault-selected-partner';

/** Omit blank optional partner date/time so the API is not sent "". */
export function optionalVaultBirthField(
  value: string | undefined | null,
): string | null {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed || null;
}

/**
 * Vault HTTP contract:
 * - 401: unauthenticated / session recovery
 * - 403: authenticated but forbidden (signing in again will not grant access)
 * - 422: FastAPI/Pydantic request validation (format, required, enum/pattern)
 * - 400: handler ValueError after a parsed body (not every 400 is birth data)
 * - 429: rate limited
 * - 5xx: service failure
 * - status 0 / fetch transport throw ("Failed to fetch", NetworkError, Load failed):
 *   network. A generic TypeError is a service failure, not a connection error.
 */
export type VaultRequestErrorKind =
  | 'auth'
  | 'forbidden'
  | 'validation'
  | 'rejected'
  | 'rateLimit'
  | 'service'
  | 'network';

export function classifyVaultRequestStatus(
  status: number,
): VaultRequestErrorKind {
  if (status === 401) return 'auth';
  if (status === 403) return 'forbidden';
  if (status === 429) return 'rateLimit';
  if (status === 422) return 'validation';
  if (status === 400) return 'rejected';
  if (status >= 500 && status <= 599) return 'service';
  if (status === 0) return 'network';
  return 'service';
}

export class VaultRequestError extends Error {
  readonly status: number;
  readonly kind: VaultRequestErrorKind;

  constructor(status: number, message?: string) {
    super(message || `Vault API error ${status}`);
    this.name = 'VaultRequestError';
    this.status = status;
    this.kind = classifyVaultRequestStatus(status);
  }
}

const VAULT_NETWORK_MESSAGE =
  /failed to fetch|networkerror|load failed|network request failed/i;

export function isVaultNetworkFailure(err: unknown): boolean {
  if (err instanceof VaultRequestError) return err.kind === 'network';
  if (!err || typeof err !== 'object') return false;
  const message = 'message' in err ? String(err.message) : '';
  // Only fetch/transport messages. A bare TypeError is a programming/service fault.
  return VAULT_NETWORK_MESSAGE.test(message);
}

export function vaultLiveErrorKind(err: unknown): VaultRequestErrorKind {
  if (err instanceof VaultRequestError) return err.kind;
  if (isVaultNetworkFailure(err)) return 'network';
  return 'service';
}

function vaultFetchError(status: number, detail: unknown): VaultRequestError {
  const message =
    typeof detail === 'string' ? detail : `Vault API error ${status}`;
  return new VaultRequestError(status, message);
}

async function postVaultJson<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    if (err instanceof VaultRequestError) throw err;
    if (isVaultNetworkFailure(err)) {
      throw new VaultRequestError(
        0,
        err instanceof Error ? err.message : 'Network error',
      );
    }
    throw new VaultRequestError(
      500,
      err instanceof Error ? err.message : 'Vault request failed',
    );
  }
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw vaultFetchError(res.status, (payload as { detail?: unknown }).detail);
  }
  return res.json() as Promise<T>;
}

export type VaultReadingLayer = {
  executive: string;
  strategic: string;
  technical: string;
  headline?: string;
  intensity?: string;
  sign?: string;
  house?: number;
  /** @deprecated For symbolic readings use evidence_status and data_completeness. */
  confidence?: string;
  /** Legacy confidence enum is not calibrated accuracy for symbolic readings. */
  confidence_basis?: 'unvalidated_symbolic_guidance';
  confidence_explanation?: string;
  limitation?: string;
  evidence_status?: 'unvalidated';
  data_completeness?: 'complete' | 'not_assessed' | 'supplied_unverified' | 'incomplete';
  interpretation?: string;
  details?: Array<{ label: string; value: string; reason?: string; direction?: "ltr" | "rtl" | "auto" }>;
  strongest_window?: VaultPowerDayWindow | null;
  secondary_windows?: VaultPowerDayWindow[];
  action?: string;
  avoid?: string;
  score_formula?: string;
  place_scope?: string;
};

export type VaultMarsResponse = {
  planet: string;
  lang: string;
  verdict: Record<string, unknown>;
  reading: VaultReadingLayer;
};

/** Calendar-day window item for Power hot / money / ghost producers. */
export type VaultPowerDayWindow = {
  date: string;
  score: number;
  rating?: string | null;
};

export type VaultGhostDaysResponse = {
  planet: string;
  action_type: string;
  lang: string;
  windows: VaultPowerDayWindow[];
  verdict: Record<string, unknown>;
  reading: VaultReadingLayer;
};

export async function fetchVaultMarsReading(
  profile: BirthProfile,
  lang: string,
): Promise<VaultMarsResponse> {
  const prefs = chartPreferenceFields();
  return postVaultJson<VaultMarsResponse>("/api/vault/mars", {
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      location: profile.location,
      lang,
      house_system: prefs.house_system,
      zodiac: prefs.zodiac,
    });
}

export async function fetchVaultGhostDaysReading(
  profile: BirthProfile,
  lang: string,
): Promise<VaultGhostDaysResponse> {
  const prefs = chartPreferenceFields();
  return postVaultJson<VaultGhostDaysResponse>("/api/vault/ghost-days", {
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      location: profile.location,
      lang,
      house_system: prefs.house_system,
      zodiac: prefs.zodiac,
    });
}

export type VaultHotAttractionDaysResponse = VaultGhostDaysResponse;

export async function fetchVaultHotAttractionDaysReading(
  profile: BirthProfile,
  lang: string,
): Promise<VaultHotAttractionDaysResponse> {
  const prefs = chartPreferenceFields();
  return postVaultJson<VaultHotAttractionDaysResponse>("/api/vault/hot-attraction-days", {
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      location: profile.location,
      lang,
      house_system: prefs.house_system,
      zodiac: prefs.zodiac,
    });
}

export type VaultMoneyAskDaysResponse = VaultGhostDaysResponse;

export async function fetchVaultMoneyAskDaysReading(
  profile: BirthProfile,
  lang: string,
): Promise<VaultMoneyAskDaysResponse> {
  const prefs = chartPreferenceFields();
  return postVaultJson<VaultMoneyAskDaysResponse>("/api/vault/money-ask-days", {
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      location: profile.location,
      lang,
      house_system: prefs.house_system,
      zodiac: prefs.zodiac,
    });
}

export type VaultTodaysColorResponse = {
  planet: string;
  lang: string;
  verdict: Record<string, unknown>;
  reading: VaultReadingLayer;
};

/** Yes Day slot — not a top-level windows[] item. */
export type VaultYesDaySlot = {
  /** Localized display copy; legacy rating remains a stable API value. */
  rating_label?: string | null;
  date: string;
  score: number;
  rating?: string | null;
  /** @deprecated Retained because normalizeYesSlot requires a nonempty legacy value. */
  confidence: string;
  action_type: string;
};

export type VaultYesDayVerdict = {
  ask: VaultYesDaySlot;
  commit: VaultYesDaySlot;
  sign: VaultYesDaySlot;
  horizon_days?: number;
  confidence?: string;
  avoid?: string;
  reason?: string;
  [key: string]: unknown;
};

export type VaultYesDayResponse = {
  planet: string;
  lang: string;
  verdict: VaultYesDayVerdict;
  reading: VaultReadingLayer;
};

export async function fetchVaultYesDayReading(
  profile: BirthProfile,
  lang: string,
): Promise<VaultYesDayResponse> {
  const prefs = chartPreferenceFields();
  return postVaultJson<VaultYesDayResponse>("/api/vault/yes-day", {
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      location: profile.location,
      lang,
      house_system: prefs.house_system,
      zodiac: prefs.zodiac,
    });
}

export async function fetchVaultTodaysColorReading(
  profile: BirthProfile,
  lang: string,
): Promise<VaultTodaysColorResponse> {
  const prefs = chartPreferenceFields();
  return postVaultJson<VaultTodaysColorResponse>("/api/vault/todays-color", {
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      location: profile.location,
      lang,
      house_system: prefs.house_system,
      zodiac: prefs.zodiac,
    });
}

export type VaultTodaysPerfumeResponse = VaultTodaysColorResponse;

export async function fetchVaultTodaysPerfumeReading(
  profile: BirthProfile,
  lang: string,
): Promise<VaultTodaysPerfumeResponse> {
  const prefs = chartPreferenceFields();
  return postVaultJson<VaultTodaysPerfumeResponse>("/api/vault/todays-perfume", {
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      location: profile.location,
      lang,
      house_system: prefs.house_system,
      zodiac: prefs.zodiac,
    });
}

export type VaultLiveReelTimeResponse = VaultTodaysColorResponse;

export async function fetchVaultLiveReelTimeReading(
  profile: BirthProfile,
  lang: string,
): Promise<VaultLiveReelTimeResponse> {
  const prefs = chartPreferenceFields();
  return postVaultJson<VaultLiveReelTimeResponse>("/api/vault/live-reel-time", {
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      location: profile.location,
      lang,
      house_system: prefs.house_system,
      zodiac: prefs.zodiac,
    });
}

export type VaultDateOutfitResponse = VaultTodaysColorResponse;

export async function fetchVaultDateOutfitReading(
  profile: BirthProfile,
  lang: string,
): Promise<VaultDateOutfitResponse> {
  const prefs = chartPreferenceFields();
  return postVaultJson<VaultDateOutfitResponse>("/api/vault/date-outfit", {
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      location: profile.location,
      lang,
      house_system: prefs.house_system,
      zodiac: prefs.zodiac,
    });
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
  return postVaultJson<VaultBestCountriesResponse>("/api/vault/best-countries", {
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      location: profile.location,
      lang,
      house_system: prefs.house_system,
      zodiac: prefs.zodiac,
      goal,
      locations: shortlist,
      current_location: currentLocation,
    });
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
  return postVaultJson<VaultBusinessGeographyResponse>("/api/vault/business-geography", {
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      location: profile.location,
      lang,
      house_system: prefs.house_system,
      zodiac: prefs.zodiac,
      goal,
      locations: shortlist,
      current_location: currentLocation,
    });
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
  partner: Person | null,
  goal: VaultPartnerProfileGoal,
): Promise<VaultPartnerProfileResponse> {
  const prefs = chartPreferenceFields();
  const partnerRelationship = partnerRelationshipForVaultApi(
    partner?.relationship,
  );
  return postVaultJson<VaultPartnerProfileResponse>("/api/vault/partner-profile", {
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      location: profile.location,
      lang,
      house_system: prefs.house_system,
      zodiac: prefs.zodiac,
      goal,
      partner_birth_date: optionalVaultBirthField(partner?.birth_date),
      partner_birth_time: optionalVaultBirthField(partner?.birth_time),
      partner_location: partner?.location || null,
      ...(partnerRelationship
        ? { partner_relationship: partnerRelationship }
        : {}),
    });
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
  partner: Person | null,
  relationshipType: VaultRelationshipType,
  concern?: string,
): Promise<VaultCompatibilityResponse> {
  const prefs = chartPreferenceFields();
  const partnerTimeKnown = Boolean(partner?.birth_time);
  return postVaultJson<VaultCompatibilityResponse>("/api/vault/compatibility", {
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      location: profile.location,
      lang,
      house_system: prefs.house_system,
      zodiac: prefs.zodiac,
      relationship_type: relationshipType,
      partner_birth_date: optionalVaultBirthField(partner?.birth_date),
      partner_birth_time: optionalVaultBirthField(partner?.birth_time),
      partner_location: partner?.location || null,
      concern,
      user_birth_time_known: Boolean(profile.birth_time),
      partner_birth_time_known: partnerTimeKnown,
    });
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
  partner: Person | null,
  relationshipType: VaultRelationshipType,
  concern?: string,
): Promise<VaultShadowSynastryResponse> {
  const prefs = chartPreferenceFields();
  const partnerTimeKnown = Boolean(partner?.birth_time);
  return postVaultJson<VaultShadowSynastryResponse>(`/api/vault/${endpoint}`, {
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      location: profile.location,
      lang,
      house_system: prefs.house_system,
      zodiac: prefs.zodiac,
      relationship_type: relationshipType,
      partner_birth_date: optionalVaultBirthField(partner?.birth_date),
      partner_birth_time: optionalVaultBirthField(partner?.birth_time),
      partner_location: partner?.location || null,
      concern,
      user_birth_time_known: Boolean(profile.birth_time),
      partner_birth_time_known: partnerTimeKnown,
    });
}

export async function fetchVaultCheatingRadarReading(
  profile: BirthProfile,
  lang: string,
  partner: Person | null,
  relationshipType: VaultRelationshipType,
  concern?: string,
): Promise<VaultCheatingRadarResponse> {
  return fetchVaultShadowSynastryReading(
    'cheating-radar',
    profile,
    lang,
    partner,
    relationshipType,
    concern,
  );
}

export async function fetchVaultTrustPatternsReading(
  profile: BirthProfile,
  lang: string,
  partner: Person | null,
  relationshipType: VaultRelationshipType,
  concern?: string,
): Promise<VaultTrustPatternsResponse> {
  return fetchVaultShadowSynastryReading(
    'trust-patterns',
    profile,
    lang,
    partner,
    relationshipType,
    concern,
  );
}

export async function fetchVaultCommunicationRiskReading(
  profile: BirthProfile,
  lang: string,
  partner: Person | null,
  relationshipType: VaultRelationshipType,
  concern?: string,
): Promise<VaultCommunicationRiskResponse> {
  return fetchVaultShadowSynastryReading(
    'communication-risk',
    profile,
    lang,
    partner,
    relationshipType,
    concern,
  );
}
