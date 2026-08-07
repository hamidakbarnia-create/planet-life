import registryDocument from './data/decision-types.v1.json';
import type {
  DecisionTypeRecord,
  DecisionTypeRegistryDocument,
} from './types';

function isDecisionTypeRecord(value: unknown): value is DecisionTypeRecord {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.decision_type_id === 'string' &&
    typeof row.family_id === 'string' &&
    typeof row.label === 'string'
  );
}

function normalizeRegistry(
  doc: DecisionTypeRegistryDocument | null | undefined
): DecisionTypeRecord[] {
  if (!doc || !Array.isArray(doc.decision_types)) return [];
  return doc.decision_types.filter(isDecisionTypeRecord);
}

/** Thin TS consumer of the Decision Type Registry JSON. */
export function listDecisionTypes(): DecisionTypeRecord[] {
  return normalizeRegistry(registryDocument as DecisionTypeRegistryDocument);
}

export function getDecisionType(
  decisionTypeId: string
): DecisionTypeRecord | undefined {
  return listDecisionTypes().find(
    (row) => row.decision_type_id === decisionTypeId
  );
}

export function registryById(): Map<string, DecisionTypeRecord> {
  return new Map(
    listDecisionTypes().map((row) => [row.decision_type_id, row])
  );
}

export function hasDecisionTypeRegistry(): boolean {
  return listDecisionTypes().length > 0;
}
