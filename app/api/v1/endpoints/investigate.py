# app/api/v1/endpoints/investigate.py

import asyncio
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.models.user import User
from app.core.security import get_current_active_user
from app.services.aws_service import aws_service
from typing import Dict, Any

router = APIRouter()

# --- NEW MODELS FOR THE INTELLIGENT CONVERSATION FLOW ---

class StartConversationResponse(BaseModel):
    conversationId: str
    systemMessage: str

class QueryRequest(BaseModel):
    query: str
    conversationId: str

class QueryResponse(BaseModel):
    answer: str

# ---------------------------------------------------------

@router.post("/{claim_id}/start-conversation", response_model=StartConversationResponse)
async def start_conversation(
    claim_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Starts a new, context-aware conversation with the AI Co-pilot for a specific claim.
    This should be called by the frontend when the user first opens the chat window.
    """
    try:
        # This new function reads the context file from S3 and starts the conversation
        response: Dict[str, Any] = await asyncio.to_thread(aws_service.start_q_conversation_with_context, claim_id=claim_id)
        return response
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        print(f"ERROR: Failed to start conversation for claim {claim_id}: {e}")
        raise HTTPException(status_code=503, detail="The AI co-pilot is currently unavailable.")


@router.post("/{claim_id}/query", response_model=QueryResponse)
async def query_conversation(
    claim_id: str, # Retained for URL consistency
    request: QueryRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Sends a follow-up question to an existing, context-aware conversation.
    The frontend MUST send the conversationId received from the 'start-conversation' endpoint.
    """
    try:
        ai_response = await asyncio.to_thread(
            aws_service.query_q_conversation,
            conversation_id=request.conversationId,
            query=request.query
        )
        return {"answer": ai_response}
    except Exception as e:
        print(f"ERROR: Failed during conversation query for claim {claim_id}: {e}")
        raise HTTPException(status_code=503, detail="The AI co-pilot is currently unavailable.")