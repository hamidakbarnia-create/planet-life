"""Dependency wiring for Decision Case HTTP API (E5)."""

from __future__ import annotations

import os
from collections.abc import Iterator
from uuid import uuid4

import psycopg
from fastapi import Request
from psycopg import Connection

from decision_case.repository import DecisionCaseRepository

DATABASE_URL_ENV = "METIORO_DATABASE_URL"
OWNER_SUBJECT_ENV = "METIORO_E5_OWNER_SUBJECT_ID"
DEFAULT_OWNER_SUBJECT_ID = "e5-dev-owner"


def get_e5_owner_subject_id() -> str:
    value = os.environ.get(OWNER_SUBJECT_ENV, DEFAULT_OWNER_SUBJECT_ID).strip()
    return value or DEFAULT_OWNER_SUBJECT_ID


def get_database_url() -> str:
    url = os.environ.get(DATABASE_URL_ENV, "").strip()
    if not url:
        raise RuntimeError(f"{DATABASE_URL_ENV} is required for Decision Case API")
    return url


def get_request_id(request: Request) -> str:
    existing = getattr(request.state, "request_id", None)
    if isinstance(existing, str) and existing:
        return existing
    request_id = str(uuid4())
    request.state.request_id = request_id
    return request_id


def get_decision_case_repository() -> Iterator[DecisionCaseRepository]:
    conn: Connection = psycopg.connect(get_database_url())
    try:
        yield DecisionCaseRepository(conn)
    finally:
        conn.close()
