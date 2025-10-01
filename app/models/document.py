# app/models/document.py

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

class Document(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    claim_id: str
    s3_key: str
    original_filename: str
    file_type: str # e.g., 'image/jpeg', 'application/pdf'

    # Timestamps
    upload_timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    # Status Tracking
    analysis_status: str = "pending" # pending, completed, failed
    
    # Data fields for text files (populated by Textract)
    extracted_text: Optional[str] = None
    
    # Data fields for image files (populated by Rekognition)
    image_analysis_results: Optional[Dict[str, Any]] = None