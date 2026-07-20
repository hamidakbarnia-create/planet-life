"""Internal provider-agnostic conversation generation boundary (ADR-0007 D1).

Public HTTP schemas and routes MUST NOT import concrete providers from here.

Ask intelligence pipeline stages (intent → context → grounding → prompt v2 →
provider → validation → telemetry) remain internal implementation details.
"""

from __future__ import annotations

from services.generation.service import ConversationService

__all__ = ["ConversationService"]
