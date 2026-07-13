"""Conversation request-boundary acceptance.

Enforces the 32 KiB raw-body ceiling before JSON parsing and before Pydantic
validation.

Generates the product-owned request_id.

This module performs request acceptance only.

Public HTTP routing is implemented separately by the authorised Conversation
router.
"""

from __future__ import annotations

import json
import uuid
from dataclasses import dataclass

from pydantic import ValidationError

from schemas.conversation import (
    MAX_REQUEST_PAYLOAD_BYTES,
    ConversationApiErrorBody,
    ConversationApiErrorResponse,
    ConversationRequest,
)


def generate_conversation_request_id() -> str:
    """Return a product-owned request identifier."""
    return str(uuid.uuid4())


@dataclass(frozen=True)
class AcceptedConversationRequest:
    request: ConversationRequest
    request_id: str


@dataclass(frozen=True)
class ConversationAcceptanceError:
    status_code: int
    code: str
    message: str
    request_id: str

    def to_error_response(self) -> ConversationApiErrorResponse:
        return ConversationApiErrorResponse(
            error=ConversationApiErrorBody(
                code=self.code,
                message=self.message,
                requestId=self.request_id,
            )
        )

    def to_envelope_dict(self) -> dict:
        return self.to_error_response().model_dump(by_alias=True)


def _validation_error_message(exc: ValidationError) -> str:
    errors = exc.errors()
    if not errors:
        return "Request contract validation failure"
    first = errors[0]
    loc = ".".join(str(part) for part in first.get("loc", ()))
    msg = first.get("msg", "Request contract validation failure")
    if loc:
        return f"{loc}: {msg}"
    return str(msg)


def accept_conversation_request_body(
    raw_body: bytes,
    *,
    request_id: str | None = None,
) -> AcceptedConversationRequest | ConversationAcceptanceError:
    """Accept raw request bytes under ADR-0007 contract ceilings.

    Order of operations is mandatory:
    1. Bind/generate product-owned request_id
    2. Reject when raw body length exceeds 32 KiB (actual bytes, not Content-Length)
    3. Parse JSON
    4. Validate ConversationRequest with Pydantic
    """
    bound_request_id = request_id or generate_conversation_request_id()

    # Do not trust Content-Length. Measure actual body bytes before any parse.
    if len(raw_body) > MAX_REQUEST_PAYLOAD_BYTES:
        return ConversationAcceptanceError(
            status_code=400,
            code="VALIDATION_ERROR",
            message=(
                f"Request payload must not exceed {MAX_REQUEST_PAYLOAD_BYTES} bytes"
            ),
            request_id=bound_request_id,
        )

    try:
        data = json.loads(raw_body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return ConversationAcceptanceError(
            status_code=400,
            code="VALIDATION_ERROR",
            message="Request contract validation failure",
            request_id=bound_request_id,
        )

    if not isinstance(data, dict):
        return ConversationAcceptanceError(
            status_code=400,
            code="VALIDATION_ERROR",
            message="Request contract validation failure",
            request_id=bound_request_id,
        )

    # Client-supplied request_id is not part of ConversationRequest.
    data.pop("request_id", None)

    try:
        parsed = ConversationRequest.model_validate(data)
    except ValidationError as exc:
        return ConversationAcceptanceError(
            status_code=400,
            code="VALIDATION_ERROR",
            message=_validation_error_message(exc),
            request_id=bound_request_id,
        )

    return AcceptedConversationRequest(request=parsed, request_id=bound_request_id)
