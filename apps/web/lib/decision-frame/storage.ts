import type { DecisionFrameV1 } from './types';
import { DECISION_FRAME_SCHEMA_VERSION } from './types';

const FRAME_KEY = 'planet-life-decision-frame-v1';

export function saveDecisionFrame(frame: DecisionFrameV1): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(FRAME_KEY, JSON.stringify(frame));
}

export function loadDecisionFrame(): DecisionFrameV1 | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(FRAME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DecisionFrameV1;
    if (parsed.schema_version !== DECISION_FRAME_SCHEMA_VERSION) return null;
    if (!parsed.raw_intent || !parsed.operation || !parsed.time) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearDecisionFrame(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(FRAME_KEY);
}
