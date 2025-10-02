# app/models/claim.py

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

class ClaimStatus:
    ANALYZING = "analyzing"
    READY_FOR_REVIEW = "ready_for_review"
    ESCALATED = "escalated"
    UPLOAD_IN_PROGRESS = "upload_in_progress"

class ClaimBase(BaseModel):
    pass

class ClaimCreate(BaseModel):
    file_count: int = Field(..., gt=0, description="Number of files to be uploaded for this claim")
    # --- THIS IS THE MISSING LINE THAT IS CAUSING THE ERROR ---
    additional_info: Optional[str] = Field(None, description="Adjuster's notes or extra context.")

class ClaimCreateResponse(BaseModel):
    claim_id: str
    upload_urls: List[dict]

class Claim(ClaimBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    adjuster_id: str
    status: str = ClaimStatus.UPLOAD_IN_PROGRESS
    summary: Optional[str] = None
    fraud_risk_score: Optional[int] = Field(None, ge=0, le=100)
    key_risk_factors: List[str] = []
    additional_info: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)