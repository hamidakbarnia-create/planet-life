"""Conversation API contract boundary (ADR-0007 P1-T02).

Returns a contract-valid conversational response from request fields only.
Does not invoke providers, prompts, derived context, persistence, or tools.

Stateless processing (ADR-0007 Decision D2):
- Each invocation processes exclusively from the client-supplied request body.
- No server-side conversation history, conversation state, or conversational
  memory is read or written.
- User-facing output MUST NOT represent absent persistence as temporary memory
  or implied continuity across requests.
"""

from __future__ import annotations

from schemas.conversation import ConversationRequest, ConversationResponse

# ADR-0007 D2: intentionally no module-level conversation store, cache, session
# map, or other cross-request conversational state.


def execute_conversation_boundary(
    request: ConversationRequest,
    *,
    request_id: str,
) -> ConversationResponse:
    """Emit a provider-independent contract-valid conversational response.

    Processing uses only the client-supplied request body for this invocation.
    ``conversation_id`` is intentionally unused and MUST NOT load or store
    conversational state (ADR-0007 D2, D6).
    ``request_id`` is the product-owned identifier generated at the request
    boundary for this invocation only.
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
