"""Decision API Contract v1 routes (ADR-0006)."""

from __future__ import annotations

import asyncio
import json
from typing import Any

from fastapi import APIRouter, Request
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from schemas.decision_execute import (
    DecisionApiErrorBody,
    DecisionApiErrorResponse,
    DecisionExecuteRequest,
    DecisionExecuteResponse,
)
from services.decision_execute_boundary import execute_decision_boundary

router = APIRouter()

EXECUTION_BUDGET_SECONDS = 4.0
DECISION_API_PATH_PREFIX = "/api/v1/decision"


def _is_decision_api_path(path: str) -> bool:
    """True for ADR-0006 Decision API paths only (not /api/v1/decision-cases)."""
    return path == DECISION_API_PATH_PREFIX or path.startswith(
        DECISION_API_PATH_PREFIX + "/"
    )


def _error_response(
    *,
    status_code: int,
    code: str,
    message: str,
    request_id: str,
) -> JSONResponse:
    body = DecisionApiErrorResponse(
        error=DecisionApiErrorBody(
            code=code,
            message=message,
            requestId=request_id,
        )
    )
    return JSONResponse(status_code=status_code, content=body.model_dump(by_alias=True))


def extract_request_id_from_body(body: bytes) -> str:
    try:
        data = json.loads(body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return ""
    if not isinstance(data, dict):
        return ""
    request_id = data.get("request_id")
    return request_id if isinstance(request_id, str) else ""


def _validation_error_message(exc: RequestValidationError) -> str:
    errors = exc.errors()
    if not errors:
        return "Request contract validation failure"
    first = errors[0]
    loc = ".".join(str(part) for part in first.get("loc", ()) if part != "body")
    msg = first.get("msg", "Request contract validation failure")
    if loc:
        return f"{loc}: {msg}"
    return str(msg)


def register_decision_exception_handlers(app: Any) -> None:
    @app.exception_handler(RequestValidationError)
    async def decision_request_validation_handler(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        if not _is_decision_api_path(request.url.path):
            return await request_validation_exception_handler(request, exc)
        body = await request.body()
        return _error_response(
            status_code=400,
            code="VALIDATION_ERROR",
            message=_validation_error_message(exc),
            request_id=extract_request_id_from_body(body),
        )


def register_decision_openapi_filter(app: Any) -> None:
    original_openapi = app.openapi

    def filtered_openapi() -> dict[str, Any]:
        schema = original_openapi()
        path_item = schema.get("paths", {}).get("/api/v1/decision/execute", {})
        post = path_item.get("post", {})
        post.get("responses", {}).pop("422", None)
        return schema

    app.openapi = filtered_openapi


@router.post(
    "/execute",
    response_model=DecisionExecuteResponse,
    response_model_by_alias=True,
    responses={
        400: {
            "model": DecisionApiErrorResponse,
            "description": "Request contract validation failure",
        },
        500: {
            "model": DecisionApiErrorResponse,
            "description": "Internal execution failure",
        },
    },
)
async def execute_decision(request: DecisionExecuteRequest) -> DecisionExecuteResponse | JSONResponse:
    request_id = request.request_id
    try:
        return await asyncio.wait_for(
            asyncio.to_thread(execute_decision_boundary, request),
            timeout=EXECUTION_BUDGET_SECONDS,
        )
    except asyncio.TimeoutError:
        return _error_response(
            status_code=500,
            code="EXECUTION_TIMEOUT",
            message="Decision execution timed out",
            request_id=request_id,
        )
    except ValidationError:
        return _error_response(
            status_code=500,
            code="INTERNAL_ERROR",
            message="Internal decision execution failure",
            request_id=request_id,
        )
    except Exception:
        return _error_response(
            status_code=500,
            code="INTERNAL_ERROR",
            message="Internal decision execution failure",
            request_id=request_id,
        )
