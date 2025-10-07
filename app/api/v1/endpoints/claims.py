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
import asyncio

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
    s3_keys = []

    for i in range(claim_in.file_count):
        object_name = f"claims/{new_claim_id}/file_{uuid.uuid4().hex}"
        s3_keys.append(object_name) # Store the key to be processed later
        presigned_data = aws_service.generate_presigned_post_url(object_name)
        if not presigned_data:
            raise HTTPException(
                status_code=500, detail="Could not generate S3 upload URL."
            )
        upload_urls.append(presigned_data)

    claim_data = {
        "id": new_claim_id, "adjuster_id": current_user.id, "status": "upload_in_progress",
        "file_count": claim_in.file_count, "additional_info": claim_in.additional_info,
        "created_at": datetime.utcnow(), "updated_at": datetime.utcnow(),
        "s3_keys": s3_keys # Save the list of keys to the claim object
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
    Triggers the entire forensic analysis pipeline for a claim. This is a long-running endpoint.
    """
    claim = await claims_collection.find_one({"id": claim_id, "adjuster_id": current_user.id})
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    await claims_collection.update_one({"id": claim_id}, {"$set": {"status": "analyzing"}})
    
    texts_for_analysis = []
    images_for_analysis = []
    s3_keys_to_process = claim.get("s3_keys", [])

    for s3_key in s3_keys_to_process:
        file_extension = s3_key.split('.')[-1].lower()
        is_image = file_extension in ['jpg', 'jpeg', 'png']
        is_video = file_extension in ['mp4', 'mov', 'avi']
        
        if is_video:
            print(f"INFO: Video file {s3_key} detected and will be skipped in this workflow.")
            texts_for_analysis.append(f"Analysis for video file '{s3_key.split('/')[-1]}' was skipped.")
            continue

        try:
            # --- USE BEDROCK FOR ALL TEXT EXTRACTION ---
            text = aws_service.extract_text_from_file_with_bedrock(s3_key)
            texts_for_analysis.append(text)

            if is_image:
                forensics = aws_service.analyze_image_forensics(s3_key)
                reverse_search = aws_service.reverse_image_search(s3_key)
                metadata = aws_service.extract_image_metadata(s3_key)
                images_for_analysis.append({
                    "filename": s3_key.split('/')[-1],
                    "results": forensics,
                    "reverse_search": reverse_search,
                    "metadata": metadata
                })
        except Exception as e:
            print(f"ERROR during file processing for {s3_key}: {e}")
            texts_for_analysis.append(f"Analysis failed for file {s3_key.split('/')[-1]}: {e}")

    # --- GATHER FINAL RESULTS AND SYNTHESIZE ---
    adjuster_notes = claim.get('additional_info')
    
    final_report = await analyze_claim_bundle(texts_for_analysis, images_for_analysis, [], adjuster_notes)

    update_data = {
        "summary": final_report.get("summary"), "fraud_risk_score": final_report.get("fraud_risk_score"),
        "key_risk_factors": final_report.get("key_risk_factors"), "status": "ready_for_review",
        "updated_at": datetime.utcnow()
    }
    await claims_collection.update_one({"id": claim_id}, {"$set": update_data})
    
    # --- NEW WORKFLOW: Create and Upload Context File for Amazon Q ---
    print(f"Creating context file for claim {claim_id} for Amazon Q...")
    context_content = f"Claim ID: {claim_id}\nFraud Risk Score: {final_report.get('fraud_risk_score')}%\nSummary: {final_report.get('summary')}\n\nKey Risk Factors:\n"
    for factor in final_report.get('key_risk_factors', []):
        context_content += f"- {factor}\n"
    context_content += "\n--- Full Extracted Text ---\n" + "\n".join(texts_for_analysis)

    context_s3_key = f"claims_context/{claim_id}.txt"
    try:
        aws_service.s3_client.put_object(
            Bucket=settings.Q_DATASOURCE_BUCKET_NAME,
            Key=context_s3_key,
            Body=context_content.encode('utf-8')
        )
        print(f"Successfully uploaded context file to S3 bucket {settings.Q_DATASOURCE_BUCKET_NAME}")

        # --- Trigger the Q Data Source Sync ---
        # Running in a thread to avoid blocking the main async event loop
        await asyncio.to_thread(aws_service.start_q_data_source_sync)

    except Exception as e:
        print(f"ERROR: Could not upload context file or trigger sync for Amazon Q. Reason: {e}")

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