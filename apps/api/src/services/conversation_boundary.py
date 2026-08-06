"""Conversation API contract boundary (ADR-0007 P1-T02 / T04-02).

Maps accepted public requests to the internal generation port and back.
Does not select providers, load prompts from disk, assemble derived context,
persist state, or invoke tools.

Stateless processing (ADR-0007 Decision D2):
- Each invocation processes exclusively from the client-supplied request body.
- No server-side conversation history, conversation state, or conversational
  memory is read or written.
- User-facing output MUST NOT represent absent persistence as temporary memory
  or implied continuity across requests.
"""

from __future__ import annotations

from schemas.conversation import ConversationRequest, ConversationResponse
from services.generation.ports import GenerationInput, GenerationMessage, GenerationResult
from services.generation.service import ConversationService

# ADR-0007 D2: intentionally no module-level conversation store, cache, session
# map, or other cross-request conversational state.


def _to_generation_input(
    request: ConversationRequest,
    *,
    request_id: str,
) -> GenerationInput:
    return GenerationInput(
        request_id=request_id,
        messages=tuple(
            GenerationMessage(role=message.role, content=message.content)
            for message in request.messages
        ),
        locale=request.locale,
        conversation_id=request.conversation_id,
    )


def _to_conversation_response(result: GenerationResult) -> ConversationResponse:
    return ConversationResponse(
        type=result.response_type,
        message=result.message,
        sources=list(result.sources),
        request_id=result.request_id,
        reasoning=result.reasoning,
        uncertainty=result.uncertainty,
    )


def execute_conversation_boundary(
    request: ConversationRequest,
    *,
    request_id: str,
) -> ConversationResponse:
    """Execute conversation generation through the internal service boundary.

    Processing uses only the client-supplied request body for this invocation.
    ``conversation_id`` is intentionally unused for persistence and MUST NOT
    load or store conversational state (ADR-0007 D2, D6).
    ``request_id`` is the product-owned identifier generated at the request
    boundary for this invocation only.
    """
    generation_input = _to_generation_input(request, request_id=request_id)
    result = ConversationService().execute(generation_input)
    return _to_conversation_response(result)
