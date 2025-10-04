# app/services/aws_service.py

import boto3
import json
import time
from botocore.client import Config
from botocore.exceptions import ClientError
from app.core.config import settings
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from typing import Optional, Dict, Any
import io
import exifread

class AWSService:
    def __init__(self):
        """Initializes all required AWS and Google service clients."""
        # --- THIS IS THE FINAL, DEFINITIVE FIX ---
        # Create a session with the region explicitly defined.
        # This forces all clients created from this session to use the correct region.
        session = boto3.Session(region_name=settings.AWS_REGION)
        
        # Create all clients from the session to ensure regional consistency.
        self.s3_client = session.client("s3", config=Config(signature_version='s3v4'))
        self.bedrock_runtime = session.client("bedrock-runtime")
        self.q_client = session.client("qbusiness")
        self.rekognition_client = session.client("rekognition")
        self.textract_client = session.client("textract")
        # ----------------------------------------------

        if settings.GOOGLE_API_KEY and settings.GOOGLE_CUSTOM_SEARCH_ENGINE_ID:
            try:
                self.google_search_service = build("customsearch", "v1", developerKey=settings.GOOGLE_API_KEY)
            except Exception as e:
                print(f"WARNING: Could not initialize Google Search service: {e}")
                self.google_search_service = None
        else:
            print("INFO: Google API Key or Search Engine ID not configured. Reverse image search will be skipped.")
            self.google_search_service = None

    def generate_presigned_post_url(self, object_name: str) -> Optional[Dict[str, Any]]:
        """Generate a presigned URL for a secure S3 POST."""
        try:
            response = self.s3_client.generate_presigned_post(
                Bucket=settings.S3_UPLOADS_BUCKET_NAME,
                Key=object_name,
                ExpiresIn=3600
            )
            return response
        except ClientError as e:
            print(f"FATAL: Error generating presigned URL: {e}")
            return None

    def analyze_image_forensics(self, s3_key: str) -> Dict[str, Any]:
        results = {"forensic_alerts": [], "detected_objects": [], "detected_text": []}
        s3_object = {'Bucket': settings.S3_UPLOADS_BUCKET_NAME, 'Name': s3_key}
        try:
            label_response = self.rekognition_client.detect_labels(Image={'S3Object': s3_object}, MaxLabels=15, MinConfidence=85)
            for label in label_response.get('Labels', []):
                results["detected_objects"].append(label['Name'])
            text_response = self.rekognition_client.detect_text(Image={'S3Object': s3_object})
            for text_detection in text_response.get('TextDetections', []):
                if text_detection['Type'] == 'LINE':
                    results["detected_text"].append(text_detection['DetectedText'])
            mod_response = self.rekognition_client.detect_moderation_labels(Image={'S3Object': s3_object})
            if mod_response.get('ModerationLabels'):
                for label in mod_response['ModerationLabels']:
                    alert = f"Potential image anomaly detected: '{label['Name']}' ({label['Confidence']:.2f}% confidence)."
                    results["forensic_alerts"].append(alert)
            if not results["forensic_alerts"]:
                results["forensic_alerts"].append("No obvious signs of digital manipulation detected.")
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code")
            print(f"ERROR: Rekognition analysis failed for {s3_key}. Reason: {error_code}")
            results["forensic_alerts"].append(f"Rekognition analysis failed due to a service error: {error_code}")
        return results

    def reverse_image_search(self, s3_key: str) -> Dict[str, Any]:
        results = {"match_found": False, "urls": [], "search_status": "not_configured"}
        if not self.google_search_service:
            results["search_status"] = "API keys for reverse image search are not configured or failed to initialize."
            return results
        try:
            public_url = self.s3_client.generate_presigned_url('get_object', Params={'Bucket': settings.S3_UPLOADS_BUCKET_NAME, 'Key': s3_key}, ExpiresIn=300)
            search_response = self.google_search_service.cse().list(q=public_url, cx=settings.GOOGLE_CUSTOM_SEARCH_ENGINE_ID, searchType='image').execute()
            items = search_response.get('items', [])
            if items:
                results["match_found"] = True
                results["urls"] = [item['link'] for item in items]
            results["search_status"] = "completed"
        except HttpError as e:
            print(f"ERROR: Google reverse image search failed for {s3_key}. Reason: {e}")
            results["search_status"] = f"API Error: {e.resp.status} {e.resp.reason}"
        except Exception as e:
            print(f"FATAL: An unexpected error occurred during reverse image search: {e}")
            results["search_status"] = "An unexpected local error occurred."
        return results

    def extract_text_with_textract(self, s3_key: str) -> str:
        try:
            response = self.textract_client.start_document_text_detection(DocumentLocation={'S3Object': {'Bucket': settings.S3_UPLOADS_BUCKET_NAME, 'Name': s3_key}})
            job_id = response['JobId']
            while True:
                result = self.textract_client.get_document_text_detection(JobId=job_id)
                status = result['JobStatus']
                if status in ['SUCCEEDED', 'FAILED']:
                    break
                time.sleep(2)
            if status == 'SUCCEEDED':
                text_blocks = [item['Text'] for item in result.get('Blocks', []) if item.get('BlockType') == 'LINE']
                return "\n".join(text_blocks)
            else:
                print(f"ERROR: Textract job failed for {s3_key}. Status: {result.get('StatusMessage')}")
                raise Exception(f"Textract job failed: {result.get('StatusMessage')}")
        except ClientError as e:
            print(f"FATAL: Textract service error for {s3_key}. Reason: {e}")
            raise

    def invoke_bedrock_model(self, prompt: str) -> Dict[str, Any]:
        try:
            body = json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 4096,
                "messages": [{"role": "user", "content": [{"type": "text", "text": prompt}]}]
            })
            response = self.bedrock_runtime.invoke_model(body=body, modelId=settings.BEDROCK_MODEL_ID, accept="application/json", contentType="application/json")
            response_body = json.loads(response.get("body").read())
            completion = response_body.get('content', [{}])[0].get('text', '')
            return {"text": completion}
        except ClientError as e:
            print(f"FATAL: Error invoking Bedrock model: {e}")
            raise

    def query_amazon_q(self, claim_id: str, user_id: str, query: str) -> str:
        try:
            response = self.q_client.chat_sync(applicationId=settings.AMAZON_Q_APP_ID, userId=f"{settings.AMAZON_Q_USER_ID_PREFIX}-{user_id}", userMessage=query)
            return response.get("systemMessage", "I could not find an answer.")
        except ClientError as e:
            print(f"ERROR: Error querying Amazon Q for claim {claim_id}: {e}")
            raise

    def extract_image_metadata(self, s3_key: str) -> dict:
        metadata = {"date_time_original": None, "camera_model": None, "gps_info": None, "warnings": []}
        try:
            s3_object = self.s3_client.get_object(Bucket=settings.S3_UPLOADS_BUCKET_NAME, Key=s3_key)
            image_bytes = s3_object['Body'].read()
            tags = exifread.process_file(io.BytesIO(image_bytes), details=False)
            if not tags:
                metadata["warnings"].append("No EXIF metadata found. This could indicate a scrubbed or downloaded image.")
                return metadata
            if 'EXIF DateTimeOriginal' in tags:
                metadata["date_time_original"] = str(tags['EXIF DateTimeOriginal'])
            if 'Image Model' in tags:
                metadata["camera_model"] = str(tags['Image Model'])
            if 'GPS GPSLatitude' in tags and 'GPS GPSLongitude' in tags:
                lat = tags['GPS GPSLatitude']
                lon = tags['GPS GPSLongitude']
                metadata["gps_info"] = f"Latitude: {lat}, Longitude: {lon}"
        except Exception as e:
            print(f"ERROR: Could not extract EXIF data for {s3_key}. Reason: {e}")
            metadata["warnings"].append(f"Technical error during metadata extraction.")
        return metadata

    def start_video_analysis(self, s3_key: str) -> str:
        s3_object = {'S3Object': {'Bucket': settings.S3_UPLOADS_BUCKET_NAME, 'Name': s3_key}}
        sns_notification_channel = {'SNSTopicArn': settings.REKOGNITION_SNS_TOPIC_ARN, 'RoleArn': settings.REKOGNITION_ROLE_ARN}
        try:
            response = self.rekognition_client.start_label_detection(Video=s3_object, NotificationChannel=sns_notification_channel)
            job_id = response['JobId']
            print(f"Started video label detection job {job_id} for {s3_key}")
            return job_id
        except ClientError as e:
            print(f"FATAL: Could not start video analysis for {s3_key}. Reason: {e}")
            raise

aws_service = AWSService()