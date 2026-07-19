"""Conversation generation provider selection (internal only).

Owned outside ``services.generation`` so generation modules do not embed
deployment configuration. No secrets, model names, or vendor endpoints.
"""

from __future__ import annotations

# Default P1 implementation key resolved by services.generation.factory.
CONVERSATION_GENERATION_PROVIDER = "static"
