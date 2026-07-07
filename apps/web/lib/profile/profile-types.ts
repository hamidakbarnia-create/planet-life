export interface ProfileBirthPlace {
  name: string;
  short: string;
  lat: number;
  lon: number;
  country?: string;
}

export interface ProfileRecord {
  birth_date: string;
  birth_time: string;
  birth_place: ProfileBirthPlace;
  name?: string;
  action_type: string;
}

export interface ProfileDraft {
  birth_date: string;
  birth_time: string;
  city_search: string;
  selected_city: ProfileBirthPlace | null;
  name?: string;
  updated_at: number;
}

export const EMPTY_PROFILE_DRAFT = (): ProfileDraft => ({
  birth_date: '',
  birth_time: '',
  city_search: '',
  selected_city: null,
  name: '',
  updated_at: Date.now(),
});
