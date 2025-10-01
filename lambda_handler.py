# lambda_handler.py

import os
import urllib.parse
from pymongo import MongoClient
from datetime import datetime
import asyncio

# NOTE: For deployment, you would create a Lambda Layer or package the 'app' directory
# into your deployment zip. This code assumes the service files are available.
from app.services.aws_service import AWSService

# --- Initialize outside the handler for performance (re-used across invocations) ---
MONGO_URI = os.environ.get("MONGO_CONNECTION_STRING")
MONGO_DB = os.environ.get("MONGO_DB_NAME")

try:
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB]
    claims_collection = db.claims
    documents_collection = db.documents
except Exception as e:
    print(f"FATAL: Could not connect to MongoDB: {e}")
    # This will cause the Lambda to fail on initialization, which is what we want.

aws_service = AWSService()

def handler(event, context):
    """
    This function is triggered by an S3 upload. It processes a single file,
    updates its status in MongoDB, and triggers the final analysis if all files are ready.
    """
    # 1. Get file info from the S3 trigger event
    s3_record = event['Records'][0]['s3']
    s3_key = urllib.parse.unquote_plus(s3_record['object']['key'], encoding='utf-8')
    
    try:
        # Assumes S3 key format: "claims/{claim_id}/{unique_filename}"
        _, claim_id, original_filename = s3_key.split('/', 2)
    except (IndexError, ValueError):
        print(f"ERROR: Could not parse claim_id/filename from S3 key: {s3_key}")
        return {'statusCode': 400, 'body': 'Invalid S3 key format'}

    print(f"Processing file '{original_filename}' for claim '{claim_id}'...")

    # 2. Determine file type and create the initial document record
    file_extension = s3_key.split('.')[-1].lower()
    is_image = file_extension in ['jpg', 'jpeg', 'png']
    is_video = file_extension in ['mp4', 'mov', 'avi']

    file_type = "document/mixed"
    if is_image:
        file_type = f"image/{file_extension}"
    elif is_video:
        file_type = f"video/{file_extension}"

    doc_record = {
        "claim_id": claim_id,
        "s3_key": s3_key,
        "original_filename": original_filename,
        "file_type": file_type,
        "analysis_status": "processing",
        "upload_timestamp": datetime.utcnow()
    }
    
    # Insert a record for the new document immediately
    doc_id = documents_collection.insert_one(doc_record).inserted_id

    # 3. Route to AI services based on file type
    if is_image:
        # Full forensic pipeline for images
        print(f"Performing advanced forensic analysis on {s3_key}...")
        forensics = aws_service.analyze_image_forensics(s3_key)
        
        print(f"Performing reverse image search on {s3_key}...")
        reverse_search = aws_service.reverse_image_search(s3_key)
        
        print(f"Extracting EXIF metadata from {s3_key}...")
        metadata = aws_service.extract_image_metadata(s3_key)
        
        image_text = aws_service.extract_text_with_textract(s3_key)

        documents_collection.update_one(
            {"_id": doc_id},
            {"$set": {
                "extracted_text": image_text,
                "image_analysis_results": forensics,
                "reverse_image_search_results": reverse_search,
                "image_metadata": metadata,
                "analysis_status": "completed"
            }}
        )
    elif is_video:
        # Start the asynchronous video analysis job
        try:
            job_id = aws_service.start_video_analysis(s3_key)
            # Update the doc with the job ID so we can track it
            documents_collection.update_one(
                {"_id": doc_id},
                {"$set": {"analysis_job_id": job_id, "analysis_status": "processing"}}
            )
        except Exception as e:
            documents_collection.update_one(
                {"_id": doc_id}, {"$set": {"analysis_status": "failed"}}
            )
    else: # For PDFs, DOCX, etc.
        text = aws_service.extract_text_with_textract(s3_key)
        documents_collection.update_one(
            {"_id": doc_id},
            {"$set": {"extracted_text": text, "analysis_status": "completed"}}
        )

    print(f"SUCCESS: Finished individual processing or job start for file {s3_key}.")
    return {'statusCode': 200, 'body': f'Successfully processed {s3_key}'}