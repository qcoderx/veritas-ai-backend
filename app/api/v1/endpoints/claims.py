# app/api/v1/endpoints/claims.py

from fastapi import APIRouter, Depends, HTTPException, status
from app.models.claim import Claim, ClaimCreate, ClaimCreateResponse
from app.models.user import User
from app.db.session import get_db_collection
from app.services.aws_service import aws_service
from app.core.security import get_current_active_user
from motor.motor_asyncio import AsyncIOMotorCollection
import uuid
from datetime import datetime
from typing import List

# --- NEW IMPORTS FOR BACKGROUND TASKS ---
from redis import Redis
from rq import Queue
from app.core.config import settings
# -----------------------------------------

router = APIRouter()

@router.post("/", response_model=ClaimCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_claim(
    claim_in: ClaimCreate,
    claims_collection: AsyncIOMotorCollection = Depends(lambda: get_db_collection("claims")),
    current_user: User = Depends(get_current_active_user)
):
    """
    Creates a new claim record and generates presigned S3 URLs for file uploads.
    """
    new_claim_id = str(uuid.uuid4())
    upload_urls = []

    for i in range(claim_in.file_count):
        object_name = f"claims/{new_claim_id}/file_{uuid.uuid4().hex}"
        presigned_data = aws_service.generate_presigned_post_url(object_name)
        if not presigned_data:
            raise HTTPException(
                status_code=500, detail="Could not generate S3 upload URL."
            )
        upload_urls.append(presigned_data)

    claim_data = {
        "id": new_claim_id, "adjuster_id": current_user.id, "status": "upload_in_progress",
        "file_count": claim_in.file_count, "additional_info": claim_in.additional_info,
        "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()
    }
    await claims_collection.insert_one(claim_data)
    
    return {"claim_id": new_claim_id, "upload_urls": upload_urls}


@router.post("/{claim_id}/trigger-analysis", status_code=status.HTTP_202_ACCEPTED)
async def trigger_claim_analysis(
    claim_id: str,
    claims_collection: AsyncIOMotorCollection = Depends(lambda: get_db_collection("claims")),
    current_user: User = Depends(get_current_active_user)
):
    """
    Accepts an analysis request and adds it to the background worker queue.
    This endpoint returns instantly, preventing timeouts.
    """
    claim = await claims_collection.find_one({"id": claim_id, "adjuster_id": current_user.id})
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    try:
        # --- START OF REDIS INTEGRATION ---
        # Connect to your Redis instance using the URL from your environment variables
        redis_conn = Redis.from_url(settings.REDIS_URL)
        # Select the 'default' queue (which our worker.py is listening to)
        q = Queue('default', connection=redis_conn)
        
        # Enqueue the job.
        # This tells an RQ worker to execute the function 'worker.run_full_analysis'
        # and pass the 'claim_id' as an argument.
        q.enqueue('worker.run_full_analysis', claim_id, job_timeout=1800) # 30-minute timeout for the job
        # --- END OF REDIS INTEGRATION ---

    except Exception as e:
        print(f"CRITICAL: Could not connect to Redis or enqueue job. ERROR: {e}")
        raise HTTPException(status_code=500, detail="Could not queue analysis task. Check server configuration.")

    # Update the claim status to show the user that analysis is underway
    await claims_collection.update_one({"id": claim_id}, {"$set": {"status": "analyzing"}})
    
    return {"message": "Analysis has been queued and is running in the background."}


@router.get("/{claim_id}", response_model=Claim)
async def get_claim(
    claim_id: str,
    claims_collection: AsyncIOMotorCollection = Depends(lambda: get_db_collection("claims")),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieves a claim's details and analysis results.
    The frontend can poll this endpoint to check if the status has changed from 'analyzing' to 'ready_for_review'.
    """
    claim = await claims_collection.find_one({"id": claim_id, "adjuster_id": current_user.id})
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found."
        )
    return claim