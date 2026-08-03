"""Discover and order versioned SQL migration files."""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from .checksums import sha256_file
from .errors import MigrationError

# Deterministic naming: 0001__description.sql
MIGRATION_FILENAME_RE = re.compile(r"^(\d+)__([a-z0-9_]+)\.sql$")


@dataclass(frozen=True)
class MigrationFile:
    version: str
    version_int: int
    name: str
    path: Path
    filename: str
    checksum: str


def default_migrations_dir() -> Path:
    """Canonical directory: apps/api/migrations."""
    return Path(__file__).resolve().parents[2] / "migrations"


def discover_migrations(migrations_dir: Path) -> list[MigrationFile]:
    if not migrations_dir.is_dir():
        raise MigrationError(
            f"Migrations directory does not exist: {migrations_dir}"
        )

    found: list[MigrationFile] = []
    versions_seen: dict[int, str] = {}

    for path in sorted(migrations_dir.iterdir(), key=lambda p: p.name):
        if not path.is_file():
            continue
        if path.name.startswith("."):
            continue
        # Allow operator docs beside SQL; only *.sql are migrations.
        if path.suffix.lower() == ".md":
            continue
        if path.suffix != ".sql":
            raise MigrationError(
                f"Non-SQL file in migrations directory is forbidden: {path.name}"
            )
        match = MIGRATION_FILENAME_RE.match(path.name)
        if not match:
            raise MigrationError(
                "Invalid migration filename "
                f"{path.name!r}; expected NNNN__snake_name.sql"
            )
        version_str, name = match.group(1), match.group(2)
        version_int = int(version_str)
        if version_int in versions_seen:
            raise MigrationError(
                "Duplicate migration version "
                f"{version_int}: {versions_seen[version_int]} and {path.name}"
            )
        versions_seen[version_int] = path.name
        found.append(
            MigrationFile(
                version=str(version_int),
                version_int=version_int,
                name=name,
                path=path,
                filename=path.name,
                checksum=sha256_file(path),
            )
        )

    found.sort(key=lambda m: m.version_int)
    return found
