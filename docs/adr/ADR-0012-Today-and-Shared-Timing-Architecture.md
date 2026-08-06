# ADR-0012 — Today and Shared Timing Architecture

- Status: Proposed
- Date: 2026-07-28
- Decision owners: Product and Engineering
- Scope: Web client architecture for Today, Calendar, timing scores, and transit access

## Context

The current web client centralizes several unrelated responsibilities in:

`apps/web/lib/calendar-scores.ts`

Repository inspection confirms that the module currently contains:

- shared API base configuration;
- score and transit domain types;
- request payload construction;
- network clients for day, month, hourly, and transit data;
- backend response parsing and mapping;
- local calendar cache handling;
- score-band and time-label presentation helpers;
- golden-hour and danger-hour presentation classifications.

The same module is consumed, directly or indirectly, by multiple product areas,
including Today/Home, Calendar, Ask, Pathfinder, Synergy, Vault, World,
Conversation, and chart-related clients.

The module therefore acts as a shared client boundary rather than only a
calendar-score utility.

Changing it without an explicit compatibility strategy risks breaking multiple
product surfaces.

## Decision

### 1. This ADR defines architecture only

This ADR authorizes no code extraction, migration, endpoint change, scoring
change, or UI rewrite.

Each future implementation change requires its own reviewed task and commit.

### 2. Today boundary

Today is responsible for presenting a daily decision brief.

Today may consume:

- daily decision signals;
- timing windows;
- relevant reasoning;
- relationship alerts;
- one recommended next action.

Today does not own:

- score computation;
- transit computation;
- shared network transport;
- calendar cache;
- shared response parsing;
- score threshold definitions.

### 3. Calendar boundary

Calendar owns exploration across:

- dates;
- months;
- hours;
- timing patterns;
- decision windows;
- calendar heatmaps.

Calendar is the primary surface for detailed timing exploration.

Today may summarize timing output but must not duplicate Calendar computation
or client logic.

### 4. Shared timing boundary

The current responsibilities will eventually be separated into these logical
boundaries:

- API configuration
- score transport client
- transit transport client
- response mapping
- location/request payload construction
- calendar cache
- timing and score presentation
- compatibility facade

The physical filenames are not locked by this ADR. The responsibility
boundaries are locked.

### 5. Decision-signal boundary

The architecture distinguishes decision signals from client infrastructure.

Decision signals include:

- score;
- timing;
- decision windows;
- reasoning;
- breakdown;
- confidence or evidence metadata when available.

Client infrastructure includes:

- API base configuration;
- HTTP transport;
- request serialization;
- response parsing;
- caching;
- date and hour formatting;
- visual styles.

Decision signals may be governed by the Reading Contract and related product
constraints.

Transport, formatting, and caching are not themselves readings, although they
must preserve the meaning and integrity of reading-derived data.

### 6. Compatibility facade

During migration, `calendar-scores.ts` remains available as a compatibility
facade.

Existing consumers must not be migrated all at once.

The facade may re-export extracted functions and types until all consumers have
moved to the new boundaries.

### 7. No scoring changes

This architecture decision does not alter:

- backend scoring;
- score thresholds;
- score bands;
- golden-hour thresholds;
- danger-hour thresholds;
- API endpoints;
- response contracts.

Any such change requires separate product and contract approval.

### 8. Today positioning

Today will move incrementally from a score-first presentation toward a
decision-brief-first presentation.

This does not require deleting score data.

The intended hierarchy is:

1. Primary focus
2. Recommended next move
3. Best available timing window
4. What to watch
5. Supporting reasoning
6. Score or detailed timing data as secondary evidence

Terms such as “golden” and “danger” are presentation choices and are not treated
as backend domain concepts unless separately established by an approved
contract.

## Consequences

### Positive

- Shared client responsibilities become explicit.
- Today and Calendar have clearer ownership boundaries.
- Refactoring can proceed incrementally.
- Existing consumers remain compatible.
- Presentation changes can be separated from backend scoring changes.
- Reading-derived signals can be distinguished from transport and formatting.

### Negative

- The compatibility facade temporarily preserves technical debt.
- Some types may remain shared during migration.
- Duplicate imports may exist temporarily.
- Full simplification requires several small implementation tasks.

## Migration constraints

Future extraction work must:

- preserve public behavior;
- preserve API request payloads;
- preserve endpoint paths;
- preserve fallback behavior;
- preserve location and timezone handling;
- retain or expand focused tests;
- use one responsibility extraction per reviewed commit;
- avoid simultaneous Today UI redesign and shared-client extraction.

## Proposed migration sequence

1. Extract shared API base configuration.
2. Extract pure presentation helpers.
3. Extract calendar cache utilities.
4. Extract transit types and client.
5. Extract score request construction and clients.
6. Convert `calendar-scores.ts` into a compatibility facade.
7. Migrate consumers incrementally.
8. Redesign Today presentation in a separate product task.

## Out of scope

- Backend architecture
- Reading Contract acceptance
- New Today API endpoint
- Changes to scoring mathematics
- Calendar redesign
- Pathfinder redesign
- Vault redesign
- Full removal of astrology terminology across the product
- New persistence or memory behavior

## Evidence

Primary repository evidence:

- `apps/web/lib/calendar-scores.ts`
- `apps/web/components/home/DailyBriefView.tsx`
- `apps/web/app/home/page.tsx`
- direct repository references to `fetchDayScore`, `fetchHourlyScores`,
  `scoreToBand`, `API_BASE`, and `fetchTransitSnapshot`

## Open questions

- Whether score thresholds remain presentation-only or become explicit domain
  contract values.
- Which decision signals are formally governed by the Reading Contract.
- Whether Today eventually receives a dedicated backend presenter endpoint.
- Whether shared API configuration should remain frontend-global or become
  client-specific.
