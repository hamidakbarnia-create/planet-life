"""HTTP transport models for Conversation API Contract v1.0 (ADR-0007).

This module defines transport models only.

Public route authorisation is defined by ADR-0007 Amendment A1 and implemented
separately in the Conversation router.

No provider, prompt, persistence or derived-context models are defined here.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

# ADR-0007 D7: reuse ADR-0006 four-value locale definition (no second locale model).
ConversationLocale = Literal["en", "ru", "fa", "ar"]
ConversationRole = Literal["user", "assistant"]
ConversationResponseType = Literal["decision", "conversational"]

MAX_CONVERSATION_MESSAGES = 20
MAX_REQUEST_PAYLOAD_BYTES = 32 * 1024


class ConversationMessage(BaseModel):
    """Public ConversationMessage schema (ADR-0007 D3, D4)."""

    role: ConversationRole
    content: str = Field(..., min_length=1)
    id: str | None = None
    timestamp: str | None = None
    metadata: dict[str, Any] | None = None


class ConversationRequest(BaseModel):
    """Public ConversationRequest schema (ADR-0007 D3, D5, D6, D7).

    ``request_id`` is intentionally absent: ADR-0007 does not define a
    client-supplied request_id on ConversationRequest. The product-owned
    request_id is generated at the request boundary.
    """

    messages: list[ConversationMessage] = Field(
        ...,
        min_length=1,
        max_length=MAX_CONVERSATION_MESSAGES,
    )
    locale: ConversationLocale
    conversation_id: str | None = None

    @field_validator("messages")
    @classmethod
    def _enforce_message_ceiling(
        cls, value: list[ConversationMessage]
    ) -> list[ConversationMessage]:
        if len(value) > MAX_CONVERSATION_MESSAGES:
            raise ValueError(
                f"Conversation messages must not exceed {MAX_CONVERSATION_MESSAGES}"
            )
        return value


class ConversationResponse(BaseModel):
    """Public ConversationResponse schema (ADR-0007 D9, D10)."""

    type: ConversationResponseType
    message: str = Field(..., min_length=1)
    sources: list[Any]
    request_id: str = Field(..., min_length=1)
    reasoning: str | None = None
    uncertainty: str | None = None

    @model_validator(mode="after")
    def _enforce_discriminator_fields(self) -> ConversationResponse:
        if self.type == "decision":
            if self.reasoning is None:
                raise ValueError(
                    "reasoning is required and must be non-null for decision responses"
                )
            if self.uncertainty is None:
                raise ValueError(
                    "uncertainty is required and must be non-null for decision responses"
                )
        return self


class ConversationApiErrorBody(BaseModel):
    """Standard Conversation API error body (product-wide envelope convention)."""

    model_config = ConfigDict(populate_by_name=True)

    code: str
    message: str
    request_id: str = Field(alias="requestId")


class ConversationApiErrorResponse(BaseModel):
    error: ConversationApiErrorBody
