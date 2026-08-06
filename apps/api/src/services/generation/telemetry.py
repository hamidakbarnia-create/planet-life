"""Internal generation telemetry for the Ask pipeline.

Records provider, model, latency, and prompt version.
Must not appear in the public Conversation API contract.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Protocol, runtime_checkable


@dataclass(frozen=True)
class GenerationTelemetryEvent:
    """One internal generation telemetry record."""

    provider: str
    model: str
    latency_ms: float
    prompt_version: str
    request_id: str = ""


@runtime_checkable
class TelemetryRecorder(Protocol):
    """Sink for internal generation telemetry events."""

    def record(self, event: GenerationTelemetryEvent) -> None:
        """Persist or buffer a telemetry event."""


class InMemoryTelemetryRecorder:
    """Process-local telemetry buffer for tests and local diagnostics."""

    def __init__(self, *, max_events: int = 256) -> None:
        self._max_events = max_events
        self._events: list[GenerationTelemetryEvent] = []

    @property
    def events(self) -> tuple[GenerationTelemetryEvent, ...]:
        return tuple(self._events)

    @property
    def last_event(self) -> GenerationTelemetryEvent | None:
        if not self._events:
            return None
        return self._events[-1]

    def record(self, event: GenerationTelemetryEvent) -> None:
        self._events.append(event)
        if len(self._events) > self._max_events:
            overflow = len(self._events) - self._max_events
            del self._events[:overflow]

    def clear(self) -> None:
        self._events.clear()


# Default shared recorder — internal only; never exposed via HTTP schemas.
_DEFAULT_RECORDER = InMemoryTelemetryRecorder()


def get_default_telemetry_recorder() -> InMemoryTelemetryRecorder:
    return _DEFAULT_RECORDER


@dataclass
class ProviderTelemetryIdentity:
    """Optional identity metadata read from a GenerationProvider instance."""

    provider: str = "unknown"
    model: str = "unknown"


def resolve_provider_identity(provider: object) -> ProviderTelemetryIdentity:
    """Extract provider/model labels without requiring Protocol changes."""
    provider_name = getattr(provider, "provider_name", None)
    model_name = getattr(provider, "model_name", None)
    return ProviderTelemetryIdentity(
        provider=provider_name if isinstance(provider_name, str) and provider_name else "unknown",
        model=model_name if isinstance(model_name, str) and model_name else "unknown",
    )


@dataclass
class NullTelemetryRecorder:
    """No-op recorder for callers that disable telemetry."""

    discarded: int = field(default=0, init=False)

    def record(self, event: GenerationTelemetryEvent) -> None:
        _ = event
        self.discarded += 1
