"""Conversation generation provider selection and OpenAI settings (internal only).

Owned outside ``services.generation`` so generation modules do not embed
deployment configuration. Secrets are read from the environment only.
"""

from __future__ import annotations

import os

# Default P1 implementation key resolved by services.generation.factory.
CONVERSATION_GENERATION_PROVIDER = "static"

# OpenAI settings — no secrets in source; empty key means unset.
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
# Raw env string; validated when constructing OpenAIConversationProvider.
OPENAI_TIMEOUT_SECONDS = os.environ.get("OPENAI_TIMEOUT_SECONDS", "25.0")
