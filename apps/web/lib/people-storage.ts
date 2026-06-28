export type RelationshipType =
  | 'spouse'
  | 'business_partner'
  | 'family'
  | 'friend'
  | 'rival';

export type SynergyBadge = 'aligned' | 'caution' | 'tension';

export interface Person {
  id: string;
  name: string;
  birth_date: string;
  birth_time: string;
  location: string;
  relationship: RelationshipType;
  photoDataUrl?: string;
  synergyScore?: number;
  synergyBadge?: SynergyBadge;
  synergyUpdatedAt?: number;
  createdAt: number;
}

const STORAGE_KEY = 'planet-life-people';

export function loadPeople(): Person[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as Person[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function savePeople(people: Person[]): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(people));
    return true;
  } catch {
    // Most likely a quota error from oversized photos.
    return false;
  }
}

export function addPerson(
  data: Omit<Person, 'id' | 'createdAt' | 'synergyScore' | 'synergyBadge' | 'synergyUpdatedAt'>
): Person | null {
  const person: Person = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  const people = loadPeople();
  people.push(person);
  if (!savePeople(people)) return null;
  return person;
}

export function updatePerson(id: string, patch: Partial<Person>): Person | null {
  const people = loadPeople();
  const idx = people.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  people[idx] = { ...people[idx], ...patch };
  if (!savePeople(people)) return null;
  return people[idx];
}

export function getPerson(id: string): Person | null {
  return loadPeople().find((p) => p.id === id) ?? null;
}

export function removePerson(id: string): void {
  savePeople(loadPeople().filter((p) => p.id !== id));
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
