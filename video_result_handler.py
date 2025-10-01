# video_result_handler.py

import os
import json
from pymongo import MongoClient
from datetime import datetime
import boto3
import asyncio

# NOTE: For deployment, you would create a Lambda Layer or package the 'app' directory
# into your deployment zip. This code assumes the service files are available.
from app.services.aws_service import AWSService
from app.services.analysis_service import analyze_claim_bundle

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
    This function is triggered by an SNS notification from Amazon Rekognition
    when a video analysis job is complete.
    """
    # 1. Parse the incoming message from SNS
    message = json.loads(event['Records'][0]['Sns']['Message'])
    job_id = message['JobId']
    status = message['Status']
    s3_key = message['Video']['S3ObjectName']
    
    print(f"Processing result for job {job_id} on file {s3_key}. Status: {status}")
    
    # Find the corresponding document record in the database using the JobId
    document = documents_collection.find_one({"analysis_job_id": job_id})
    if not document:
        print(f"ERROR: No document found with job ID {job_id}.")
        return

    # 2. Process the result based on whether the job succeeded or failed
    if status == 'SUCCEEDED':
        # Get the results from Rekognition
        rek_client = boto3.client('rekognition', region_name=os.environ.get("AWS_REGION"))
        response = rek_client.get_label_detection(JobId=job_id)
        
        detected_labels = []
        for label in response.get('Labels', []):
            label_name = label['Label']['Name']
            confidence = label['Label']['Confidence']
            if confidence > 80: # Only store high-confidence labels
                detected_labels.append(f"{label_name} ({confidence:.2f}%)")
        
        # Use a set to get unique labels before storing
        video_results = {"detected_objects": list(set(detected_labels))}
        
        # Update the document in MongoDB with the results
        documents_collection.update_one(
            {"_id": document['_id']},
            {"$set": {"video_analysis_results": video_results, "analysis_status": "completed"}}
        )
    else:
        # If the job failed, update the status accordingly
        documents_collection.update_one(
            {"_id": document['_id']},
            {"$set": {"analysis_status": "failed", "video_analysis_results": {"error": "Rekognition job failed."}}}
        )

    print(f"Successfully processed video result for {s3_key}.")
    # Note: In a production system, you might add logic here to automatically trigger
    # the final analysis if this was the last file, similar to the API endpoint.
    
    return {'statusCode': 200, 'body': 'Successfully processed video result.'}