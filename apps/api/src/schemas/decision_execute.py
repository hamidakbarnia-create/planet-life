"""HTTP transport models for Decision API Contract v1 (ADR-0006)."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

DecisionLocale = Literal["en", "ru", "fa", "ar"]
DecisionBoundarySource = Literal["decision_api_boundary"]


class DecisionExecuteProfile(BaseModel):
    birth_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    birth_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    location: str = Field(..., min_length=1)
    latitude: float
    longitude: float
    action_type: str = Field(..., min_length=1)


class DecisionExecuteRequest(BaseModel):
    request_id: str = Field(..., min_length=1)
    display_text: str = Field(..., min_length=1)
    action_type: str = Field(..., min_length=1)
    guided_question_id: str = Field(..., min_length=1)
    category_id: str = Field(..., min_length=1)
    needs_time: bool
    locale: DecisionLocale
    profile: DecisionExecuteProfile


class DecisionExecuteResult(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    request_id: str = Field(alias="requestId")
    action_type: str = Field(alias="actionType")
    guided_question_id: str = Field(alias="guidedQuestionId")
    category_id: str = Field(alias="categoryId")
    needs_time: bool = Field(alias="needsTime")
    summary: str
    source: DecisionBoundarySource


class DecisionExecuteResponse(BaseModel):
    status: Literal["completed"] = "completed"
    result: DecisionExecuteResult


class DecisionApiErrorBody(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    code: str
    message: str
    request_id: str = Field(alias="requestId")


class DecisionApiErrorResponse(BaseModel):
    error: DecisionApiErrorBody
