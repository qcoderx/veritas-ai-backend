# app/api/v1/endpoints/claims.py

from fastapi import APIRouter, Depends, HTTPException, status
from app.models.claim import Claim, ClaimCreate, ClaimCreateResponse
from app.models.user import User
from app.db.session import get_db_collection
from app.services.aws_service import aws_service
from app.core.security import get_current_active_user
from app.services.analysis_service import analyze_claim_bundle
from motor.motor_asyncio import AsyncIOMotorCollection
import uuid
from datetime import datetime
from typing import List

router = APIRouter()

@router.post("/", response_model=ClaimCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_claim(
    claim_in: ClaimCreate,
    claims_collection: AsyncIOMotorCollection = Depends(lambda: get_db_collection("claims")),
    current_user: User = Depends(get_current_active_user)
):
    """
    Creates a new claim record and generates presigned S3 URLs for file uploads.
    The number of URLs generated is based on the file_count provided.
    """
    new_claim_id = str(uuid.uuid4())
    upload_urls = []

    for i in range(claim_in.file_count):
        # Generate a unique key for each file to prevent overwrites.
        # The frontend will be responsible for uploading the file to this key.
        object_name = f"claims/{new_claim_id}/file_{uuid.uuid4().hex}"
        presigned_data = aws_service.generate_presigned_post_url(object_name)
        if not presigned_data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not generate S3 upload URL."
            )
        upload_urls.append(presigned_data)

    claim_data = {
        "id": new_claim_id,
        "adjuster_id": current_user.id,
        "status": "upload_in_progress", # New status indicating files are being uploaded
        "file_count": claim_in.file_count,
        "additional_info": claim_in.additional_info,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    await claims_collection.insert_one(claim_data)

    return {"claim_id": new_claim_id, "upload_urls": upload_urls}

@router.post("/{claim_id}/trigger-analysis", response_model=Claim, status_code=status.HTTP_202_ACCEPTED)
async def trigger_claim_analysis(
    claim_id: str,
    claims_collection: AsyncIOMotorCollection = Depends(lambda: get_db_collection("claims")),
    documents_collection: AsyncIOMotorCollection = Depends(lambda: get_db_collection("documents")),
    current_user: User = Depends(get_current_active_user)
):
    """
    Triggers the final, deep analysis for a claim after files have been uploaded.
    This is called by the adjuster when they are ready to proceed.
    """
    claim = await claims_collection.find_one({"id": claim_id, "adjuster_id": current_user.id})
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found or you do not have access.")

    # Set status to 'analyzing' to provide feedback to the frontend
    await claims_collection.update_one({"id": claim_id}, {"$set": {"status": "analyzing"}})

    # 1. Gather all available data from the individually processed documents in MongoDB
    all_docs_cursor = documents_collection.find({"claim_id": claim_id, "analysis_status": "completed"})
    all_docs_list = await all_docs_cursor.to_list(length=100) # Cap at 100 documents per claim

    texts_for_analysis = [doc['extracted_text'] for doc in all_docs_list if doc.get('extracted_text')]
    images_for_analysis = []
    for doc in all_docs_list:
        if doc.get('image_analysis_results'):
            images_for_analysis.append({
                "filename": doc['original_filename'],
                "results": doc['image_analysis_results'],
                "reverse_search": doc.get('reverse_image_search_results', {}),
                "metadata": doc.get('image_metadata', {})
            })

    adjuster_notes = claim.get('additional_info')

    # 2. Run the final, deep analysis using the synthesis service
    final_report = await analyze_claim_bundle(
        texts_for_analysis,
        images_for_analysis,
        adjuster_notes
    )

    # 3. Update the main claim object with the final report from the AI
    update_data = {
        "summary": final_report.get("summary"),
        "fraud_risk_score": final_report.get("fraud_risk_score"),
        "key_risk_factors": final_report.get("key_risk_factors"),
        "status": "ready_for_review",
        "updated_at": datetime.utcnow()
    }
    await claims_collection.update_one({"id": claim_id}, {"$set": update_data})

    # Return the fully updated claim to the frontend
    updated_claim = await claims_collection.find_one({"id": claim_id})
    return updated_claim

@router.get("/{claim_id}", response_model=Claim)
async def get_claim(
    claim_id: str,
    claims_collection: AsyncIOMotorCollection = Depends(lambda: get_db_collection("claims")),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieves a claim's details and analysis results.
    """
    claim = await claims_collection.find_one({"id": claim_id, "adjuster_id": current_user.id})
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found."
        )
    return claim