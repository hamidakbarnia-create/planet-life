"""Internal generation error types.

These exceptions are not public Conversation API error codes.
Mapping to the product error envelope is owned by a later task (P1-T08).
"""

from __future__ import annotations


class GenerationError(Exception):
    """Base class for internal conversation-generation failures."""


class GenerationConfigurationError(GenerationError):
    """Raised when generation provider configuration cannot be resolved."""


class GenerationProviderError(GenerationError):
    """Raised when a generation provider fails during execution."""


class GenerationValidationError(GenerationError):
    """Raised when provider output fails internal response validation."""
