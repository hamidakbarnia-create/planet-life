import { API_BASE } from './api-config';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

export function postCalendarAnalyze(
  body: Record<string, unknown>
): Promise<Response> {
  return fetch(`${API_BASE}/api/business/analyze`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
}

export function postCalendarBatch(
  body: Record<string, unknown>
): Promise<Response> {
  return fetch(`${API_BASE}/api/batch`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
}

export function postCalendarBatchHourly(
  body: Record<string, unknown>
): Promise<Response> {
  return fetch(`${API_BASE}/api/batch-hourly`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
}

export function postCalendarTransit(
  body: Record<string, unknown>
): Promise<Response> {
  return fetch(`${API_BASE}/api/transit`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
}
