# app/api/v1/endpoints/investigate.py

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.models.user import User
from app.core.security import get_current_active_user
from app.services.aws_service import aws_service
import asyncio

router = APIRouter()

class StartConversationResponse(BaseModel):
    conversationId: str
    systemMessage: str
    systemMessageId: str # <-- This was already correct

class QueryRequest(BaseModel):
    query: str
    conversationId: str
    parentMessageId: str # <-- This was already correct

class QueryResponse(BaseModel):
    answer: str
    systemMessageId: str # <-- This was already correct

@router.post("/{claim_id}/start-conversation", response_model=StartConversationResponse)
async def start_conversation(claim_id: str, current_user: User = Depends(get_current_active_user)):
    """
    Starts a new conversation with Amazon Q, seeded with the claim's context.
    """
    try:
        # We use asyncio.to_thread to run the synchronous boto3 call in a separate thread
        # without blocking the FastAPI event loop.
        response = await asyncio.to_thread(aws_service.start_q_conversation_with_context, claim_id=claim_id)
        return response
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        print(f"ERROR: Failed to start Q conversation for claim {claim_id}: {e}")
        raise HTTPException(status_code=503, detail=f"The AI co-pilot is currently unavailable. Error: {e}")

@router.post("/{claim_id}/query", response_model=QueryResponse)
async def query_conversation(claim_id: str, request: QueryRequest, current_user: User = Depends(get_current_active_user)):
    """
    Sends a follow-up query to an existing Amazon Q conversation.
    """
    try:
        ai_response = await asyncio.to_thread(
            aws_service.query_q_conversation,
            conversation_id=request.conversationId,
            parent_message_id=request.parentMessageId, # <-- Pass the parent ID to the service
            query=request.query
        )
        return ai_response
    except Exception as e:
        print(f"ERROR: Failed during conversation query for claim {claim_id}: {e}")
        raise HTTPException(status_code=503, detail=f"The AI co-pilot encountered an error. Error: {e}")
