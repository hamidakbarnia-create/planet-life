"""Thin FastAPI router for Decision Case API (E5). Transport only."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, Request, Response
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from decision_case.deps import (
    get_decision_case_repository,
    get_e5_owner_subject_id,
    get_request_id,
)
from decision_case.mapping import (
    sort_cases_for_list,
    to_case_resource,
    to_evaluation_list_item,
    to_evaluation_resource,
    to_history_event,
)
from decision_case.repository import DecisionCaseRepository
from decision_case.repository.errors import (
    CaseNotFoundError,
    DuplicateCaseError,
    IllegalTransitionError,
    MissingRelationError,
    RepositoryError,
    StaleVersionError,
)
from decision_case.schemas.cases import (
    CaseVersionCommandRequest,
    CreateCaseFromFramingRequest,
    CreateDecisionCaseRequest,
    CreateEvaluationRequest,
    DecisionApiErrorBody,
    DecisionApiErrorResponse,
    DecisionCaseDetailResource,
    DecisionCaseListEnvelope,
    DecisionCaseResource,
    DecisionEvaluationListEnvelope,
    DecisionEvaluationResource,
    DecisionHistoryEnvelope,
    FramingMutationResponse,
    IntakeAnswersRequest,
    IntakeCompleteRequest,
    IntakeMutationResponse,
    UpdateCaseFramingRequest,
)
from decision_case.services.car_interview_intake import (
    IntakeIncompleteError,
    RuntimeFramingError,
    RuntimeProviderError,
    RuntimeUnsupportedOperationError,
    UnsupportedDecisionTypeError,
    complete_car_interview_intake,
    evaluate_car_interview_case,
    save_car_interview_answers,
)
from decision_case.services.evaluate_runtime import (
    EvaluateIntakeIncompleteError,
    UnsupportedEvaluateDecisionTypeError,
    evaluate_decision_case,
)
from decision_case.services.intake_runtime import (
    complete_intake,
    save_intake_answers,
)
from decision_case.services.decision_frame import (
    FramingUnresolvedError,
    FramingValidationError,
    create_case_with_framing,
    extract_framing_from_intake,
    update_case_framing,
)
from packages.decision_engine.registry import (
    EntryModeUnavailableError,
    UnknownDecisionTypeError,
    resolve_decision_type,
)

router = APIRouter()

CASE_API_PATH_PREFIX = "/api/v1/decision-cases"

_RESERVED_OPENAPI_PATHS: frozenset[str] = frozenset(
    {
        "/api/v1/decision-cases/{case_id}/comparisons",
    }
)

_ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    400: {
        "model": DecisionApiErrorResponse,
        "description": "Validation or semantic client error",
    },
    404: {
        "model": DecisionApiErrorResponse,
        "description": "Case or evaluation not found",
    },
    409: {
        "model": DecisionApiErrorResponse,
        "description": "Version conflict, duplicate, or illegal transition",
    },
    500: {
        "model": DecisionApiErrorResponse,
        "description": "Internal failure",
    },
}


def _error_response(
    *,
    status_code: int,
    code: str,
    message: str,
    request_id: str,
    details: dict[str, Any] | None = None,
) -> JSONResponse:
    body = DecisionApiErrorResponse(
        error=DecisionApiErrorBody(
            code=code,
            message=message,
            requestId=request_id,
            details=details or {},
        )
    )
    return JSONResponse(
        status_code=status_code,
        content=body.model_dump(by_alias=True),
    )


def _validation_fields(exc: RequestValidationError) -> dict[str, str]:
    fields: dict[str, str] = {}
    for err in exc.errors():
        loc_parts = [str(p) for p in err.get("loc", ()) if p != "body"]
        name = ".".join(loc_parts) if loc_parts else "body"
        fields[name] = str(err.get("msg", "invalid"))
    return fields


def _safe_message(code: str) -> str:
    return {
        "VALIDATION_ERROR": "Request validation failed",
        "UNKNOWN_DECISION_TYPE": "Unknown decision_type_id",
        "ENTRY_MODE_UNAVAILABLE": "entry_mode is not available",
        "CASE_NOT_FOUND": "Decision case not found",
        "EVALUATION_NOT_FOUND": "Evaluation not found",
        "VERSION_CONFLICT": "Case version conflict",
        "ILLEGAL_TRANSITION": "Illegal case lifecycle transition",
        "DUPLICATE_CASE": "Duplicate decision case",
        "INTAKE_INCOMPLETE": "Intake is incomplete",
        "UNSUPPORTED_DECISION_TYPE": "Decision type is not supported for this operation",
        "FRAMING_UNRESOLVED": "Decision Frame is unresolved",
        "FRAMING_INVALID": "Decision Frame failed validation",
        "FRAMING_REQUIRED": "Decision Frame is required for evaluation",
        "OPERATION_NOT_IMPLEMENTED": "Requested decision operation is not implemented",
        "PROVIDER_FAILURE": "Evidence provider failed",
        "INTERNAL_ERROR": "Internal server error",
    }.get(code, "Request failed")


def _to_case_detail(
    repo: DecisionCaseRepository,
    case_id: UUID,
    owner_subject_id: str,
) -> DecisionCaseDetailResource:
    case = repo.get_case(case_id, owner_subject_id)
    version = repo.get_current_version(case_id, owner_subject_id)
    base = to_case_resource(case)
    return DecisionCaseDetailResource(
        **base.model_dump(),
        intake=dict(version.intake or {}),
    )


def _current_version_details(
    repo: DecisionCaseRepository,
    case_id: UUID,
    owner_subject_id: str,
    expected_case_version: int,
) -> dict[str, Any]:
    try:
        case = repo.get_case(case_id, owner_subject_id)
        return {
            "expected_case_version": expected_case_version,
            "current_case_version": case.current_case_version,
        }
    except CaseNotFoundError:
        return {"expected_case_version": expected_case_version}


def _map_repository_error(
    exc: Exception,
    *,
    request_id: str,
    repo: DecisionCaseRepository | None = None,
    case_id: UUID | None = None,
    owner_subject_id: str | None = None,
    expected_case_version: int | None = None,
) -> JSONResponse:
    if isinstance(exc, CaseNotFoundError):
        return _error_response(
            status_code=404,
            code="CASE_NOT_FOUND",
            message=_safe_message("CASE_NOT_FOUND"),
            request_id=request_id,
        )
    if isinstance(exc, StaleVersionError):
        details: dict[str, Any] = {}
        if (
            repo is not None
            and case_id is not None
            and owner_subject_id is not None
            and expected_case_version is not None
        ):
            details = _current_version_details(
                repo, case_id, owner_subject_id, expected_case_version
            )
        return _error_response(
            status_code=409,
            code="VERSION_CONFLICT",
            message=_safe_message("VERSION_CONFLICT"),
            request_id=request_id,
            details=details,
        )
    if isinstance(exc, IllegalTransitionError):
        details = {}
        if repo is not None and case_id is not None and owner_subject_id is not None:
            try:
                details = {"state": repo.get_case(case_id, owner_subject_id).state}
            except CaseNotFoundError:
                details = {}
        return _error_response(
            status_code=409,
            code="ILLEGAL_TRANSITION",
            message=_safe_message("ILLEGAL_TRANSITION"),
            request_id=request_id,
            details=details,
        )
    if isinstance(exc, DuplicateCaseError):
        return _error_response(
            status_code=409,
            code="DUPLICATE_CASE",
            message=_safe_message("DUPLICATE_CASE"),
            request_id=request_id,
        )
    if isinstance(exc, RepositoryError):
        return _error_response(
            status_code=500,
            code="INTERNAL_ERROR",
            message=_safe_message("INTERNAL_ERROR"),
            request_id=request_id,
        )
    return _error_response(
        status_code=500,
        code="INTERNAL_ERROR",
        message=_safe_message("INTERNAL_ERROR"),
        request_id=request_id,
    )


def register_decision_case_exception_handlers(app: Any) -> None:
    previous = app.exception_handlers.get(RequestValidationError)

    @app.exception_handler(RequestValidationError)
    async def decision_case_validation_handler(
        request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        if request.url.path.startswith(CASE_API_PATH_PREFIX):
            request_id = get_request_id(request)
            return _error_response(
                status_code=400,
                code="VALIDATION_ERROR",
                message=_safe_message("VALIDATION_ERROR"),
                request_id=request_id,
                details={"fields": _validation_fields(exc)},
            )
        if previous is not None:
            result = previous(request, exc)
            if hasattr(result, "__await__"):
                return await result  # type: ignore[misc]
            return result  # type: ignore[return-value]
        return await request_validation_exception_handler(request, exc)


def register_decision_case_openapi_filter(app: Any) -> None:
    original_openapi = app.openapi

    def filtered_openapi() -> dict[str, Any]:
        schema = original_openapi()
        paths = schema.get("paths", {})
        for reserved in _RESERVED_OPENAPI_PATHS:
            paths.pop(reserved, None)
        for path, path_item in list(paths.items()):
            if not path.startswith(CASE_API_PATH_PREFIX):
                continue
            if not isinstance(path_item, dict):
                continue
            for method_item in path_item.values():
                if isinstance(method_item, dict):
                    method_item.get("responses", {}).pop("422", None)
                    method_item.get("responses", {}).pop("403", None)
        return schema

    app.openapi = filtered_openapi


@router.post(
    "/from-framing",
    response_model=FramingMutationResponse,
    status_code=201,
    responses=_ERROR_RESPONSES,
)
def create_decision_case_from_framing(
    body: CreateCaseFromFramingRequest,
    request: Request,
    response: Response,
    repo: DecisionCaseRepository = Depends(get_decision_case_repository),
    owner_subject_id: str = Depends(get_e5_owner_subject_id),
) -> FramingMutationResponse | JSONResponse:
    """Persist resolved Decision Frame onto a new Case. No runtime execution."""
    request_id = get_request_id(request)
    try:
        case, intake = create_case_with_framing(
            repo,
            owner_subject_id=owner_subject_id,
            decision_type_id=body.decision_type_id,
            title=body.title,
            framing_raw=body.framing.model_dump(),
        )
        framing = extract_framing_from_intake(intake) or {}
        response.headers["Location"] = f"{CASE_API_PATH_PREFIX}/{case.case_id}"
        return FramingMutationResponse(
            case=to_case_resource(case),
            intake=intake,
            framing=framing,
        )
    except FramingUnresolvedError as exc:
        return _error_response(
            status_code=400,
            code="FRAMING_UNRESOLVED",
            message=str(exc) or _safe_message("FRAMING_UNRESOLVED"),
            request_id=request_id,
        )
    except FramingValidationError as exc:
        return _error_response(
            status_code=400,
            code="VALIDATION_ERROR",
            message=str(exc) or _safe_message("VALIDATION_ERROR"),
            request_id=request_id,
            details=exc.details,
        )
    except UnknownDecisionTypeError:
        return _error_response(
            status_code=400,
            code="UNKNOWN_DECISION_TYPE",
            message=_safe_message("UNKNOWN_DECISION_TYPE"),
            request_id=request_id,
        )
    except EntryModeUnavailableError:
        return _error_response(
            status_code=400,
            code="ENTRY_MODE_UNAVAILABLE",
            message=_safe_message("ENTRY_MODE_UNAVAILABLE"),
            request_id=request_id,
        )
    except Exception as exc:
        return _map_repository_error(exc, request_id=request_id)


@router.post(
    "",
    response_model=DecisionCaseResource,
    status_code=201,
    responses=_ERROR_RESPONSES,
)
def create_decision_case(
    body: CreateDecisionCaseRequest,
    request: Request,
    response: Response,
    repo: DecisionCaseRepository = Depends(get_decision_case_repository),
    owner_subject_id: str = Depends(get_e5_owner_subject_id),
) -> DecisionCaseResource | JSONResponse:
    request_id = get_request_id(request)
    try:
        resolution = resolve_decision_type(
            body.decision_type_id or "",
            body.entry_mode,
        )
        created = repo.create_case(
            owner_subject_id=owner_subject_id,
            decision_type_id=resolution.decision_type_id,
            family_id=resolution.family_id,
            title=body.title,
            mode=resolution.mode,
        )
    except UnknownDecisionTypeError:
        return _error_response(
            status_code=400,
            code="UNKNOWN_DECISION_TYPE",
            message=_safe_message("UNKNOWN_DECISION_TYPE"),
            request_id=request_id,
        )
    except EntryModeUnavailableError:
        return _error_response(
            status_code=400,
            code="ENTRY_MODE_UNAVAILABLE",
            message=_safe_message("ENTRY_MODE_UNAVAILABLE"),
            request_id=request_id,
        )
    except Exception as exc:
        return _map_repository_error(exc, request_id=request_id)
    response.headers["Location"] = f"{CASE_API_PATH_PREFIX}/{created.case_id}"
    return to_case_resource(created)


@router.get(
    "",
    response_model=DecisionCaseListEnvelope,
    responses=_ERROR_RESPONSES,
)
def list_decision_cases(
    request: Request,
    repo: DecisionCaseRepository = Depends(get_decision_case_repository),
    owner_subject_id: str = Depends(get_e5_owner_subject_id),
) -> DecisionCaseListEnvelope | JSONResponse:
    request_id = get_request_id(request)
    try:
        cases = sort_cases_for_list(repo.list_cases(owner_subject_id))
        return DecisionCaseListEnvelope(cases=[to_case_resource(c) for c in cases])
    except Exception as exc:
        return _map_repository_error(exc, request_id=request_id)


@router.get(
    "/{case_id}",
    response_model=DecisionCaseDetailResource,
    responses=_ERROR_RESPONSES,
)
def get_decision_case(
    case_id: UUID,
    request: Request,
    repo: DecisionCaseRepository = Depends(get_decision_case_repository),
    owner_subject_id: str = Depends(get_e5_owner_subject_id),
) -> DecisionCaseDetailResource | JSONResponse:
    request_id = get_request_id(request)
    try:
        return _to_case_detail(repo, case_id, owner_subject_id)
    except Exception as exc:
        return _map_repository_error(
            exc,
            request_id=request_id,
            repo=repo,
            case_id=case_id,
            owner_subject_id=owner_subject_id,
        )


@router.put(
    "/{case_id}/framing",
    response_model=FramingMutationResponse,
    responses=_ERROR_RESPONSES,
)
def put_decision_case_framing(
    case_id: UUID,
    body: UpdateCaseFramingRequest,
    request: Request,
    repo: DecisionCaseRepository = Depends(get_decision_case_repository),
    owner_subject_id: str = Depends(get_e5_owner_subject_id),
) -> FramingMutationResponse | JSONResponse:
    """Update persisted Decision Frame on an existing Case (CAS). No runtime."""
    request_id = get_request_id(request)
    try:
        case, intake = update_case_framing(
            repo,
            case_id=case_id,
            owner_subject_id=owner_subject_id,
            expected_case_version=body.expected_case_version,
            framing_raw=body.framing.model_dump(),
        )
        framing = extract_framing_from_intake(intake) or {}
        return FramingMutationResponse(
            case=to_case_resource(case),
            intake=intake,
            framing=framing,
        )
    except FramingUnresolvedError as exc:
        return _error_response(
            status_code=400,
            code="FRAMING_UNRESOLVED",
            message=str(exc) or _safe_message("FRAMING_UNRESOLVED"),
            request_id=request_id,
        )
    except FramingValidationError as exc:
        return _error_response(
            status_code=400,
            code="VALIDATION_ERROR",
            message=str(exc) or _safe_message("VALIDATION_ERROR"),
            request_id=request_id,
            details=exc.details,
        )
    except Exception as exc:
        return _map_repository_error(
            exc,
            request_id=request_id,
            repo=repo,
            case_id=case_id,
            owner_subject_id=owner_subject_id,
            expected_case_version=body.expected_case_version,
        )


@router.post(
    "/{case_id}/intake/answers",
    response_model=IntakeMutationResponse,
    responses=_ERROR_RESPONSES,
)
def post_intake_answers(
    case_id: UUID,
    body: IntakeAnswersRequest,
    request: Request,
    repo: DecisionCaseRepository = Depends(get_decision_case_repository),
    owner_subject_id: str = Depends(get_e5_owner_subject_id),
) -> IntakeMutationResponse | JSONResponse:
    request_id = get_request_id(request)
    try:
        case, intake, missing, is_complete = save_intake_answers(
            repo,
            case_id=case_id,
            owner_subject_id=owner_subject_id,
            expected_case_version=body.expected_case_version,
            answers=body.answers,
        )
        return IntakeMutationResponse(
            case=to_case_resource(case),
            intake=intake,
            missing_required=missing,
            is_complete=is_complete,
        )
    except IntakeIncompleteError as exc:
        return _error_response(
            status_code=400,
            code="INTAKE_INCOMPLETE",
            message=_safe_message("INTAKE_INCOMPLETE"),
            request_id=request_id,
            details={"missing_required": list(exc.missing_required)},
        )
    except UnsupportedDecisionTypeError as exc:
        return _error_response(
            status_code=400,
            code="UNSUPPORTED_DECISION_TYPE",
            message=_safe_message("UNSUPPORTED_DECISION_TYPE"),
            request_id=request_id,
            details={"decision_type_id": exc.decision_type_id},
        )
    except Exception as exc:
        return _map_repository_error(
            exc,
            request_id=request_id,
            repo=repo,
            case_id=case_id,
            owner_subject_id=owner_subject_id,
            expected_case_version=body.expected_case_version,
        )


@router.post(
    "/{case_id}/intake/complete",
    response_model=IntakeMutationResponse,
    responses=_ERROR_RESPONSES,
)
def post_intake_complete(
    case_id: UUID,
    body: IntakeCompleteRequest,
    request: Request,
    repo: DecisionCaseRepository = Depends(get_decision_case_repository),
    owner_subject_id: str = Depends(get_e5_owner_subject_id),
) -> IntakeMutationResponse | JSONResponse:
    request_id = get_request_id(request)
    try:
        case, intake, missing, is_complete = complete_intake(
            repo,
            case_id=case_id,
            owner_subject_id=owner_subject_id,
            expected_case_version=body.expected_case_version,
        )
        return IntakeMutationResponse(
            case=to_case_resource(case),
            intake=intake,
            missing_required=missing,
            is_complete=is_complete,
        )
    except IntakeIncompleteError as exc:
        return _error_response(
            status_code=400,
            code="INTAKE_INCOMPLETE",
            message=_safe_message("INTAKE_INCOMPLETE"),
            request_id=request_id,
            details={"missing_required": list(exc.missing_required)},
        )
    except UnsupportedDecisionTypeError as exc:
        return _error_response(
            status_code=400,
            code="UNSUPPORTED_DECISION_TYPE",
            message=_safe_message("UNSUPPORTED_DECISION_TYPE"),
            request_id=request_id,
            details={"decision_type_id": exc.decision_type_id},
        )
    except Exception as exc:
        return _map_repository_error(
            exc,
            request_id=request_id,
            repo=repo,
            case_id=case_id,
            owner_subject_id=owner_subject_id,
            expected_case_version=body.expected_case_version,
        )


@router.post(
    "/{case_id}/evaluations",
    response_model=DecisionEvaluationResource,
    status_code=201,
    responses=_ERROR_RESPONSES,
)
def create_decision_case_evaluation(
    case_id: UUID,
    body: CreateEvaluationRequest,
    request: Request,
    repo: DecisionCaseRepository = Depends(get_decision_case_repository),
    owner_subject_id: str = Depends(get_e5_owner_subject_id),
) -> DecisionEvaluationResource | JSONResponse:
    request_id = get_request_id(request)
    try:
        record = evaluate_decision_case(
            repo,
            case_id=case_id,
            owner_subject_id=owner_subject_id,
            expected_case_version=body.expected_case_version,
        )
        return to_evaluation_resource(record)
    except EvaluateIntakeIncompleteError as exc:
        return _error_response(
            status_code=400,
            code="INTAKE_INCOMPLETE",
            message=_safe_message("INTAKE_INCOMPLETE"),
            request_id=request_id,
            details={"missing_required": list(exc.missing_required)},
        )
    except RuntimeUnsupportedOperationError as exc:
        return _error_response(
            status_code=400,
            code="OPERATION_NOT_IMPLEMENTED",
            message=_safe_message("OPERATION_NOT_IMPLEMENTED"),
            request_id=request_id,
            details={"operation": exc.operation},
        )
    except RuntimeFramingError as exc:
        return _error_response(
            status_code=400,
            code="FRAMING_REQUIRED",
            message=str(exc) or _safe_message("FRAMING_REQUIRED"),
            request_id=request_id,
            details=exc.details,
        )
    except RuntimeProviderError as exc:
        return _error_response(
            status_code=502,
            code="PROVIDER_FAILURE",
            message=_safe_message("PROVIDER_FAILURE"),
            request_id=request_id,
            details=exc.details,
        )
    except UnsupportedEvaluateDecisionTypeError as exc:
        return _error_response(
            status_code=400,
            code="UNSUPPORTED_DECISION_TYPE",
            message=_safe_message("UNSUPPORTED_DECISION_TYPE"),
            request_id=request_id,
            details={"decision_type_id": exc.decision_type_id},
        )
    except Exception as exc:
        return _map_repository_error(
            exc,
            request_id=request_id,
            repo=repo,
            case_id=case_id,
            owner_subject_id=owner_subject_id,
            expected_case_version=body.expected_case_version,
        )


@router.post(
    "/{case_id}/complete",
    response_model=DecisionCaseResource,
    responses=_ERROR_RESPONSES,
)
def complete_decision_case(
    case_id: UUID,
    body: CaseVersionCommandRequest,
    request: Request,
    repo: DecisionCaseRepository = Depends(get_decision_case_repository),
    owner_subject_id: str = Depends(get_e5_owner_subject_id),
) -> DecisionCaseResource | JSONResponse:
    request_id = get_request_id(request)
    try:
        case = repo.complete_case_composite(
            case_id,
            owner_subject_id,
            expected_case_version=body.expected_case_version,
        )
        return to_case_resource(case)
    except Exception as exc:
        return _map_repository_error(
            exc,
            request_id=request_id,
            repo=repo,
            case_id=case_id,
            owner_subject_id=owner_subject_id,
            expected_case_version=body.expected_case_version,
        )


@router.post(
    "/{case_id}/archive",
    response_model=DecisionCaseResource,
    responses=_ERROR_RESPONSES,
)
def archive_decision_case(
    case_id: UUID,
    body: CaseVersionCommandRequest,
    request: Request,
    repo: DecisionCaseRepository = Depends(get_decision_case_repository),
    owner_subject_id: str = Depends(get_e5_owner_subject_id),
) -> DecisionCaseResource | JSONResponse:
    request_id = get_request_id(request)
    try:
        case = repo.archive_case_composite(
            case_id,
            owner_subject_id,
            expected_case_version=body.expected_case_version,
        )
        return to_case_resource(case)
    except Exception as exc:
        return _map_repository_error(
            exc,
            request_id=request_id,
            repo=repo,
            case_id=case_id,
            owner_subject_id=owner_subject_id,
            expected_case_version=body.expected_case_version,
        )


@router.get(
    "/{case_id}/history",
    response_model=DecisionHistoryEnvelope,
    responses=_ERROR_RESPONSES,
)
def get_decision_case_history(
    case_id: UUID,
    request: Request,
    repo: DecisionCaseRepository = Depends(get_decision_case_repository),
    owner_subject_id: str = Depends(get_e5_owner_subject_id),
) -> DecisionHistoryEnvelope | JSONResponse:
    request_id = get_request_id(request)
    try:
        events = repo.get_history(case_id, owner_subject_id)
        return DecisionHistoryEnvelope(events=[to_history_event(e) for e in events])
    except Exception as exc:
        return _map_repository_error(
            exc,
            request_id=request_id,
            repo=repo,
            case_id=case_id,
            owner_subject_id=owner_subject_id,
        )


@router.get(
    "/{case_id}/evaluations",
    response_model=DecisionEvaluationListEnvelope,
    responses=_ERROR_RESPONSES,
)
def list_decision_case_evaluations(
    case_id: UUID,
    request: Request,
    repo: DecisionCaseRepository = Depends(get_decision_case_repository),
    owner_subject_id: str = Depends(get_e5_owner_subject_id),
) -> DecisionEvaluationListEnvelope | JSONResponse:
    request_id = get_request_id(request)
    try:
        evaluations = repo.list_evaluations(case_id, owner_subject_id)
        return DecisionEvaluationListEnvelope(
            evaluations=[to_evaluation_list_item(e) for e in evaluations]
        )
    except Exception as exc:
        return _map_repository_error(
            exc,
            request_id=request_id,
            repo=repo,
            case_id=case_id,
            owner_subject_id=owner_subject_id,
        )


@router.get(
    "/{case_id}/evaluations/{evaluation_id}",
    response_model=DecisionEvaluationResource,
    responses=_ERROR_RESPONSES,
)
def get_decision_case_evaluation(
    case_id: UUID,
    evaluation_id: UUID,
    request: Request,
    repo: DecisionCaseRepository = Depends(get_decision_case_repository),
    owner_subject_id: str = Depends(get_e5_owner_subject_id),
) -> DecisionEvaluationResource | JSONResponse:
    request_id = get_request_id(request)
    try:
        record = repo.get_evaluation(case_id, evaluation_id, owner_subject_id)
        return to_evaluation_resource(record)
    except CaseNotFoundError as exc:
        return _map_repository_error(
            exc,
            request_id=request_id,
            repo=repo,
            case_id=case_id,
            owner_subject_id=owner_subject_id,
        )
    except MissingRelationError:
        # get_evaluation raises MissingRelationError only for unknown evaluation_id
        # after owner-scoped case lookup succeeds. Do not map other MissingRelationError
        # sites through a shared flag or message parse.
        return _error_response(
            status_code=404,
            code="EVALUATION_NOT_FOUND",
            message=_safe_message("EVALUATION_NOT_FOUND"),
            request_id=request_id,
        )
    except Exception as exc:
        return _map_repository_error(
            exc,
            request_id=request_id,
            repo=repo,
            case_id=case_id,
            owner_subject_id=owner_subject_id,
        )
