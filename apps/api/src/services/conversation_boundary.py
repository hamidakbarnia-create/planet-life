"""Conversation API contract boundary (ADR-0007 P1-T01).

Returns a contract-valid conversational response from request fields only.
Does not invoke providers, prompts, derived context, persistence, or tools.
"""

from __future__ import annotations

from schemas.conversation import ConversationRequest, ConversationResponse


def execute_conversation_boundary(
    request: ConversationRequest,
    *,
    request_id: str,
) -> ConversationResponse:
    """Emit a provider-independent contract-valid conversational response.

    ``conversation_id`` is intentionally unused (ADR-0007 D6).
    ``request_id`` is the product-owned identifier generated at the request boundary.
    """
    _ = request.conversation_id
    _ = request.locale
    _ = request.messages

    return ConversationResponse(
        type="conversational",
        message="Conversation request accepted under the P1 contract surface.",
        sources=[],
        request_id=request_id,
    )
