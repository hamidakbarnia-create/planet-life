"""Migration runner errors (fail-closed)."""

from __future__ import annotations


class MigrationError(RuntimeError):
    """Raised when discovery, apply, status, or verify cannot complete safely."""
