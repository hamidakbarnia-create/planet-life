"""Versioned PostgreSQL SQL migration runner (DB-003).

Explicit operational tool. Must never be invoked from API startup.
"""

from .errors import MigrationError
from .runner import apply_migrations, status_migrations, verify_migrations

__all__ = [
    "MigrationError",
    "apply_migrations",
    "status_migrations",
    "verify_migrations",
]
