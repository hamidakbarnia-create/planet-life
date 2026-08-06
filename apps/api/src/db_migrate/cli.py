"""Explicit CLI for DB-003 migrate apply / status / verify."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from .discovery import default_migrations_dir
from .errors import MigrationError
from .runner import apply_migrations, status_migrations, verify_migrations

DATABASE_URL_ENV = "METIORO_DATABASE_URL"


def _resolve_database_url(cli_value: str | None) -> str:
    url = (cli_value or os.environ.get(DATABASE_URL_ENV, "")).strip()
    if not url:
        raise MigrationError(
            f"Database URL required via --database-url or {DATABASE_URL_ENV}"
        )
    return url


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="db_migrate",
        description=(
            "METIORO versioned PostgreSQL SQL migrations (DB-003). "
            "Explicit operational tool — never run from API startup."
        ),
    )
    parser.add_argument(
        "--database-url",
        default=None,
        help=f"PostgreSQL URL (default: env {DATABASE_URL_ENV})",
    )
    parser.add_argument(
        "--migrations-dir",
        type=Path,
        default=None,
        help=f"Migrations directory (default: {default_migrations_dir()})",
    )

    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("apply", help="Apply pending migrations (fail-closed)")
    sub.add_parser("status", help="Show applied and pending migrations")
    sub.add_parser(
        "verify",
        help="Verify applied migrations against files/checksums (no apply)",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        database_url = _resolve_database_url(args.database_url)
        migrations_dir = args.migrations_dir

        if args.command == "status":
            report = status_migrations(database_url, migrations_dir)
            print(f"migrations_dir={report.migrations_dir}")
            print(f"applied={len(report.applied)}")
            for row in report.applied:
                print(f"  A {row.version}\t{row.filename}\t{row.checksum}")
            print(f"pending={len(report.pending)}")
            for mig in report.pending:
                print(f"  P {mig.version}\t{mig.filename}\t{mig.checksum}")
            return 0

        if args.command == "verify":
            report = verify_migrations(database_url, migrations_dir)
            print(f"migrations_dir={report.migrations_dir}")
            print(f"applied={len(report.applied)} pending={len(report.pending)}")
            if report.ok:
                print("verify=OK")
                return 0
            print("verify=FAIL")
            for err in report.errors:
                print(f"  ERROR: {err}")
            return 1

        if args.command == "apply":
            report = apply_migrations(database_url, migrations_dir)
            print(f"migrations_dir={report.migrations_dir}")
            print(f"already_applied={len(report.already_applied)}")
            print(f"applied_now={len(report.applied_now)}")
            for mig in report.applied_now:
                print(f"  + {mig.version}\t{mig.filename}")
            return 0

        raise MigrationError(f"Unknown command: {args.command}")
    except MigrationError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
