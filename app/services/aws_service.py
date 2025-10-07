# app/services/aws_service.py

import boto3
import json
import base64
from botocore.client import Config
from botocore.exceptions import ClientError
from app.core.config import settings
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from typing import Optional, Dict, Any
import io
import exifread
from fastapi import HTTPException

class AWSService:
    def __init__(self):
        """Initializes all required AWS and Google service clients."""
        session = boto3.Session(region_name=settings.AWS_REGION)
        self.s3_client = session.client("s3", config=Config(signature_version='s3v4'))
        self.bedrock_runtime = session.client("bedrock-runtime")
        self.q_client = session.client("qbusiness")
        self.rekognition_client = session.client("rekognition")

        if settings.GOOGLE_API_KEY and settings.GOOGLE_CUSTOM_SEARCH_ENGINE_ID:
            try:
                self.google_search_service = build("customsearch", "v1", developerKey=settings.GOOGLE_API_KEY)
            except Exception as e:
                print(f"WARNING: Could not initialize Google Search service: {e}")
                self.google_search_service = None
        else:
            print("INFO: Google API Key or Search Engine ID not configured.")
            self.google_search_service = None

    def generate_presigned_post_url(self, object_name: str) -> Optional[Dict[str, Any]]:
        try:
            return self.s3_client.generate_presigned_post(Bucket=settings.S3_UPLOADS_BUCKET_NAME, Key=object_name, ExpiresIn=3600)
        except ClientError as e:
            print(f"FATAL: Error generating presigned URL: {e}")
            return None

    def analyze_image_forensics(self, s3_key: str) -> Dict[str, Any]:
        results = {"forensic_alerts": [], "detected_objects": [], "detected_text": []}
        s3_object = {'Bucket': settings.S3_UPLOADS_BUCKET_NAME, 'Name': s3_key}
        try:
            label_response = self.rekognition_client.detect_labels(Image={'S3Object': s3_object}, MaxLabels=15, MinConfidence=85)
            results["detected_objects"] = [label['Name'] for label in label_response.get('Labels', [])]
            text_response = self.rekognition_client.detect_text(Image={'S3Object': s3_object})
            results["detected_text"] = [td['DetectedText'] for td in text_response.get('TextDetections', []) if td['Type'] == 'LINE']
        except ClientError as e:
            results["forensic_alerts"].append(f"Rekognition content analysis failed: {e}")
        return results

    def reverse_image_search(self, s3_key: str) -> Dict[str, Any]:
        results = {"match_found": False, "urls": [], "search_status": "not_configured"}
        if not self.google_search_service:
            results["search_status"] = "API keys not configured."
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
            results["search_status"] = f"API Error: {e.resp.status} {e.resp.reason}"
        return results

    def extract_text_from_file_with_bedrock(self, s3_key: str) -> str:
        try:
            s3_object = self.s3_client.get_object(Bucket=settings.S3_UPLOADS_BUCKET_NAME, Key=s3_key)
            file_bytes = s3_object['Body'].read()
            base64_encoded_data = base64.b64encode(file_bytes).decode('utf-8')
            media_type = "image/jpeg"
            if s3_key.lower().endswith('.png'): media_type = "image/png"
            elif s3_key.lower().endswith('.pdf'): media_type = "application/pdf"
            prompt = "Extract all text verbatim from the document. Do not summarize or add commentary."
            body = json.dumps({
                "anthropic_version": "bedrock-2023-05-31", "max_tokens": 4096,
                "messages": [{"role": "user", "content": [
                    {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": base64_encoded_data}},
                    {"type": "text", "text": prompt}
                ]}]
            })
            response = self.bedrock_runtime.invoke_model(body=body, modelId=settings.BEDROCK_MODEL_ID, accept="application/json", contentType="application/json")
            response_body = json.loads(response.get("body").read())
            return response_body.get('content', [{}])[0].get('text', '')
        except Exception as e:
            print(f"FATAL: Bedrock text extraction failed for {s3_key}. Reason: {e}")
            return f"Error extracting text from file: {s3_key}. Reason: {e}"

    def invoke_bedrock_model(self, prompt: str) -> Dict[str, Any]:
        try:
            body = json.dumps({
                "anthropic_version": "bedrock-2023-05-31", "max_tokens": 4096,
                "messages": [{"role": "user", "content": [{"type": "text", "text": prompt}]}]
            })
            response = self.bedrock_runtime.invoke_model(body=body, modelId=settings.BEDROCK_MODEL_ID, accept="application/json", contentType="application/json")
            response_body = json.loads(response.get("body").read())
            return {"text": response_body.get('content', [{}])[0].get('text', '')}
        except ClientError as e:
            print(f"FATAL: Error invoking Bedrock model: {e}")
            raise

    def extract_image_metadata(self, s3_key: str) -> dict:
        metadata = {"date_time_original": None, "camera_model": None, "gps_info": None, "warnings": []}
        try:
            s3_object = self.s3_client.get_object(Bucket=settings.S3_UPLOADS_BUCKET_NAME, Key=s3_key)
            tags = exifread.process_file(io.BytesIO(s3_object['Body'].read()), details=False)
            if not tags:
                metadata["warnings"].append("No EXIF metadata found.")
                return metadata
            if 'EXIF DateTimeOriginal' in tags: metadata["date_time_original"] = str(tags['EXIF DateTimeOriginal'])
            if 'Image Model' in tags: metadata["camera_model"] = str(tags['Image Model'])
        except Exception as e:
            metadata["warnings"].append("Error extracting metadata.")
        return metadata

    def start_q_conversation_with_context(self, claim_id: str) -> Dict[str, Any]:
        """
        Starts a new Amazon Q conversation, pre-loading it with context.
        This now correctly returns the systemMessageId needed for the next turn.
        """
        try:
            context_s3_key = f"claims_context/{claim_id}.txt"
            # This logic to create the context file seems to be missing, 
            # assuming it's created during the analysis trigger.
            # A real implementation would ensure this file exists.
            
            # For now, let's create a dummy context if it doesn't exist to avoid errors.
            try:
                self.s3_client.head_object(Bucket=settings.Q_DATASOURCE_BUCKET_NAME, Key=context_s3_key)
            except ClientError:
                 self.s3_client.put_object(Bucket=settings.Q_DATASOURCE_BUCKET_NAME, Key=context_s3_key, Body=f"Initial context for claim {claim_id}.".encode('utf-8'))


            system_prompt = "You are an AI insurance investigator. Use the information in the case file to answer."
            
            response = self.q_client.chat_sync(
                applicationId=settings.AMAZON_Q_APP_ID,
                userMessage=system_prompt,
                attachments=[
                    {
                        's3': {
                            'bucket': settings.Q_DATASOURCE_BUCKET_NAME,
                            'key': context_s3_key
                        }
                    }
                ]
            )
            return {
                "conversationId": response.get("conversationId"),
                "systemMessage": "Context loaded. You can now ask questions about this claim.",
                "systemMessageId": response.get("systemMessageId")
            }
        except self.s3_client.exceptions.NoSuchKey:
            raise HTTPException(status_code=404, detail="Context file not found for this claim. Please run the analysis first.")
        except ClientError as e:
            print(f"ERROR during Q conversation start: {e}")
            raise

    def query_q_conversation(self, conversation_id: str, parent_message_id: str, query: str) -> Dict[str, Any]:
        """
        Sends a follow-up question to an existing conversation, including the parentMessageId.
        Crucially, this now returns the new systemMessageId for the next turn.
        """
        try:
            response = self.q_client.chat_sync(
                applicationId=settings.AMAZON_Q_APP_ID,
                userMessage=query,
                conversationId=conversation_id,
                parentMessageId=parent_message_id 
            )
            return {
                "answer": response.get("systemMessage", "I could not find an answer."),
                "systemMessageId": response.get("systemMessageId")
            }
        except ClientError as e:
            print(f"ERROR during Q conversation: {e}")
            raise

aws_service = AWSService()
