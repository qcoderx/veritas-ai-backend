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
from app.core.config import settings

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
        # We must store the generated keys to process them later
        object_name = f"claims/{new_claim_id}/file_{uuid.uuid4().hex}"
        presigned_data = aws_service.generate_presigned_post_url(object_name)
        if not presigned_data:
            raise HTTPException(status_code=500, detail="Could not generate S3 upload URL.")
        upload_urls.append(presigned_data)

    claim_data = {
        "id": new_claim_id, "adjuster_id": current_user.id, "status": "upload_in_progress",
        "file_count": claim_in.file_count, "additional_info": claim_in.additional_info,
        "created_at": datetime.utcnow(), "updated_at": datetime.utcnow(),
        "s3_keys": [url['fields']['key'] for url in upload_urls] # Store the keys
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
    Triggers the entire forensic analysis pipeline for a claim.
    """
    claim = await claims_collection.find_one({"id": claim_id, "adjuster_id": current_user.id})
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    await claims_collection.update_one({"id": claim_id}, {"$set": {"status": "analyzing"}})
    
    await documents_collection.delete_many({"claim_id": claim_id})

    # --- CORRECTED LOGIC: Use the stored S3 keys ---
    s3_keys_to_process = claim.get("s3_keys", [])
    if not s3_keys_to_process:
        # Fallback to listing from S3 if keys weren't stored (older claims)
        s3_prefix = f"claims/{claim_id}/"
        s3_objects = aws_service.s3_client.list_objects_v2(Bucket=settings.S3_UPLOADS_BUCKET_NAME, Prefix=s3_prefix)
        s3_keys_to_process = [obj['Key'] for obj in s3_objects.get('Contents', [])]

    for s3_key in s3_keys_to_process:
        original_filename = s3_key.split('/')[-1]
        file_extension = s3_key.split('.')[-1].lower()
        is_image = file_extension in ['jpg', 'jpeg', 'png']
        
        doc_record = {
            "claim_id": claim_id, "s3_key": s3_key, "original_filename": original_filename,
            "analysis_status": "processing", "upload_timestamp": datetime.utcnow()
        }
        doc_id = (await documents_collection.insert_one(doc_record)).inserted_id
        
        if is_image:
            forensics = aws_service.analyze_image_forensics(s3_key)
            reverse_search = aws_service.reverse_image_search(s3_key)
            metadata = aws_service.extract_image_metadata(s3_key)
            image_text = aws_service.extract_text_with_textract(s3_key)
            await documents_collection.update_one({"_id": doc_id}, {"$set": {
                "extracted_text": image_text, "image_analysis_results": forensics,
                "reverse_image_search_results": reverse_search, "image_metadata": metadata,
                "analysis_status": "completed"
            }})
        else: # Documents (PDFs, etc.)
            text = aws_service.extract_text_with_textract(s3_key)
            await documents_collection.update_one({"_id": doc_id}, {"$set": {"extracted_text": text, "analysis_status": "completed"}})

    # --- GATHER RESULTS AND SYNTHESIZE ---
    all_docs_cursor = documents_collection.find({"claim_id": claim_id})
    all_docs_list = await all_docs_cursor.to_list(length=100)
    
    texts_for_analysis = [doc['extracted_text'] for doc in all_docs_list if doc.get('extracted_text')]
    images_for_analysis = []
    for doc in all_docs_list:
        if doc.get('image_analysis_results'):
            images_for_analysis.append({
                "filename": doc['original_filename'], "results": doc['image_analysis_results'],
                "reverse_search": doc.get('reverse_image_search_results', {}), "metadata": doc.get('image_metadata', {})
            })
    
    adjuster_notes = claim.get('additional_info')
    
    final_report = await analyze_claim_bundle(texts_for_analysis, images_for_analysis, [], adjuster_notes)

    update_data = {
        "summary": final_report.get("summary"), "fraud_risk_score": final_report.get("fraud_risk_score"),
        "key_risk_factors": final_report.get("key_risk_factors"), "status": "ready_for_review",
        "updated_at": datetime.utcnow()
    }
    await claims_collection.update_one({"id": claim_id}, {"$set": update_data})
    
    updated_claim = await claims_collection.find_one({"id": claim_id})
    return updated_claim

@router.get("/{claim_id}", response_model=Claim)
async def get_claim(
    claim_id: str,
    claims_collection: AsyncIOMotorCollection = Depends(lambda: get_db_collection("claims")),
    current_user: User = Depends(get_current_active_user)
):
    claim = await claims_collection.find_one({"id": claim_id, "adjuster_id": current_user.id})
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found.")
    return claim