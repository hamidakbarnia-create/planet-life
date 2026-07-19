"""Internal provider-agnostic conversation generation boundary (ADR-0007 D1).

Public HTTP schemas and routes MUST NOT import concrete providers from here.
"""

from __future__ import annotations

from services.generation.service import ConversationService

__all__ = ["ConversationService"]
