# app/services/analysis_service.py

import os
import json
from pymongo import MongoClient
from datetime import datetime
import boto3
import asyncio
from typing import List, Dict, Optional

# NOTE: This assumes aws_service is in a location that can be imported.
# In a real Lambda deployment, this would be part of the deployment package.
from app.services.aws_service import AWSService

# --- Initialize outside the handler ---
MONGO_URI = os.environ.get("MONGO_CONNECTION_STRING")
MONGO_DB = os.environ.get("MONGO_DB_NAME")

try:
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB]
    claims_collection = db.claims
    documents_collection = db.documents
except Exception as e:
    print(f"FATAL: Could not connect to MongoDB: {e}")

aws_service = AWSService()


def get_synthesized_analysis_prompt(
    claim_texts: List[str],
    image_analyses: List[Dict],
    video_analyses: List[Dict],
    adjuster_notes: Optional[str]
) -> str:
    """
    Constructs the ultimate forensic analysis prompt for Bedrock.
    """
    full_text = "\n\n--- DOCUMENT TEXT ---\n\n".join(claim_texts)

    forensic_reports = []
    for analysis in image_analyses:
        # Unpack all available data for each image
        filename = analysis.get('filename', 'N/A')
        forensics = analysis.get('results', {})
        reverse_search = analysis.get('reverse_search', {})
        metadata = analysis.get('metadata', {})

        # Format each piece of data for the prompt
        detected_objects = ", ".join(forensics.get('detected_objects', []))
        detected_text = ", ".join(forensics.get('detected_text', []))
        alerts = "\n".join([f"- {alert}" for alert in forensics.get('forensic_alerts', [])])

        reverse_report = "Not performed or no matches found."
        if reverse_search.get('match_found'):
            urls = "\n".join([f"- {url}" for url in reverse_search.get('urls', [])])
            reverse_report = f"CRITICAL ALERT: Image found online at:\n{urls}"

        metadata_report = (
            f"  - Original Date/Time Taken: {metadata.get('date_time_original') or 'Not Available'}\n"
            f"  - Camera/Device Model: {metadata.get('camera_model') or 'Not Available'}\n"
            f"  - GPS Information: {metadata.get('gps_info') or 'Not Available'}\n"
            f"  - Metadata Warnings: {', '.join(metadata.get('warnings', [])) or 'None'}"
        )

        report = f"""
--- FORENSIC REPORT FOR IMAGE: {filename} ---
**Image Metadata (EXIF Data):**
{metadata_report}

**Content Analysis (What's in the picture):**
  - Detected Objects: {detected_objects}
  - Detected Text: {detected_text}
  - Content Alerts:
{alerts}

**Online Footprint Analysis (Where the picture has been):**
  - Reverse Image Search Results: {reverse_report}
"""
        forensic_reports.append(report)

    full_forensic_report = "\n".join(forensic_reports)

    # --- NEW: Format Video Analysis for the Prompt ---
    video_reports = []
    for analysis in video_analyses:
        filename = analysis.get('filename', 'N/A')
        results = analysis.get('results', {})
        detected_objects = ", ".join(results.get('detected_objects', ['None']))
        report = f"""
--- VIDEO ANALYSIS REPORT FOR: {filename} ---
Detected Objects & Activities: {detected_objects}
"""
        video_reports.append(report)
    full_video_report = "\n".join(video_reports)

    notes_section = f"--- ADJUSTER'S NOTES ---\n{adjuster_notes}" if adjuster_notes else "No additional notes were provided."

    prompt = f"""
    You are Veritas AI, a world-class forensic investigator for insurance claims. Your mission is to uncover fraud by meticulously analyzing and cross-referencing all available intelligence. Do not summarize; investigate.

    **CASE FILE INTELLIGENCE:**

    **1. FIELD NOTES (from the Human Adjuster):**
    {notes_section}

    **2. SUBMITTED DOCUMENTS (The Official Story):**
    {full_text if full_text else "No text was extracted from documents."}

    **3. FORENSIC IMAGE REPORTS (The Ground Truth):**
    {full_forensic_report if full_forensic_report else "No images were submitted."}

    **4. VIDEO EVIDENCE (Surveillance and Recordings):**
    {full_video_report if full_video_report else "No videos were submitted."}

    **YOUR FORENSIC ANALYSIS PROTOCOL:**
    You must perform the following checks and synthesize your findings.
    - **Timeline Contradiction:** Does the "Date/Time Taken" from the image metadata contradict the date of the incident reported in the documents? A photo taken *before* the reported accident is a major red flag.
    - **Device Anomaly:** Is the camera model consistent across all photos? Do different photos claim to be from different high-end phones and cheap cameras? This could indicate a stitched-together claim.
    - **Content vs. Narrative Conflict:** Does the text detected in the images (e.g., a license plate, a street sign) contradict the information in the police report or claimant statement?
    - **Video Contradiction:** Do the objects or activities detected in the video (e.g., 'Person Running', 'No Vehicle Damage') contradict the claimant's statement?
    - **Geospatial Conflict:** If GPS data is available, does it match the location of the incident described in the documents?
    - **Digital Tampering:** Do the metadata warnings (e.g., "No EXIF data") or content alerts suggest the image was downloaded, screenshotted, or edited?
    - **Fraudulent Reuse:** Is there a "CRITICAL ALERT" from a reverse image search? This is the most severe indicator of fraud.

    **FINAL REPORT:**
    Based on your forensic protocol, provide your conclusions ONLY in the following strict JSON format:
    {{
      "summary": "A brief, factual summary of the claim incident.",
      "fraud_risk_score": <integer from 0-100, where a score over 85 requires multiple severe red flags>,
      "key_risk_factors": [
          "A list of the most critical pieces of evidence pointing to fraud. Be specific and reference your protocol. Example: 'Timeline Contradiction: Photo IMG_2345.jpg was taken on 2025-09-25, three days before the reported accident on 2025-09-28.'",
          "Another factor. Example: 'Fraudulent Reuse: Image damage_front.jpg was found on a car auction website from 2024.'"
      ]
    }}
    """
    return prompt


async def analyze_claim_bundle(
    claim_texts: List[str],
    image_analyses: List[Dict],
    video_analyses: List[Dict],
    adjuster_notes: Optional[str]
) -> Dict:
    """
    Orchestrates the claim analysis using Amazon Bedrock to synthesize all data.
    """
    if not any([claim_texts, image_analyses, video_analyses, adjuster_notes]):
        return {
            "summary": "No content found in claim for analysis.",
            "fraud_risk_score": 0,
            "key_risk_factors": []
        }

    prompt = get_synthesized_analysis_prompt(claim_texts, image_analyses, video_analyses, adjuster_notes)

    try:
        response = aws_service.invoke_bedrock_model(prompt)
        # Attempt to find a valid JSON object within the model's response text
        response_text = response["text"]
        json_start = response_text.find('{')
        json_end = response_text.rfind('}') + 1
        if json_start != -1 and json_end != -1:
            json_str = response_text[json_start:json_end]
            analysis_result = json.loads(json_str)
            return analysis_result
        else:
            raise json.JSONDecodeError("No valid JSON object found in the model's response.", response_text, 0)
    except (Exception, json.JSONDecodeError) as e:
        print(f"FATAL: AI synthesis failed. Reason: {e}")
        return {
            "summary": "AI synthesis failed due to a processing error. Please review manually.",
            "fraud_risk_score": -1,
            "key_risk_factors": ["Critical AI model processing error."]
        }