# app/api/v1/endpoints/investigate.py

from fastapi import APIRouter, Depends, HTTPException, status, Body
from motor.motor_asyncio import AsyncIOMotorCollection
from pydantic import BaseModel

from app.models.user import User
from app.core.security import get_current_active_user
from app.services.aws_service import aws_service
from app.db.session import get_db_collection

router = APIRouter()

class QueryRequest(BaseModel):
    query: str = Body(..., embed=True, description="The question for the AI co-pilot.")

class QueryResponse(BaseModel):
    answer: str

@router.post("/{claim_id}/query", response_model=QueryResponse)
async def query_claim_ai_copilot(
    claim_id: str,
    query_request: QueryRequest,
    claims_collection: AsyncIOMotorCollection = Depends(lambda: get_db_collection("claims")),
    current_user: User = Depends(get_current_active_user)
):

    # 1. Verify that the claim exists and the current user has access to it.
    claim = await claims_collection.find_one(
        {"id": claim_id, "adjuster_id": current_user.id}
    )
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found or you do not have permission to access it."
        )

    # 2. Check if the claim is ready for investigation.
    if claim.get("status") != "ready_for_review":
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Claim is still being processed. Current status: {claim.get('status')}"
        )

    # 3. Send the query to the AWS service.
    try:
        # The aws_service handles the direct communication with Amazon Q.
        ai_response = aws_service.query_amazon_q(
            claim_id=claim_id,
            user_id=current_user.id,
            query=query_request.query
        )
        return {"answer": ai_response}
    except Exception as e:
        # Catch potential exceptions from the Boto3 client.
        print(f"Error querying Amazon Q for claim {claim_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The AI co-pilot is currently unavailable. Please try again later."
        )