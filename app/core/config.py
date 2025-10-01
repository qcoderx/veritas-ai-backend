# app/core/config.py

import os
from typing import Optional
from dotenv import load_dotenv
from pydantic_settings import BaseSettings # <-- THIS LINE IS CHANGED

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Veritas AI"
    API_V1_STR: str = "/api/v1"

    # Security
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # MongoDB
    MONGO_CONNECTION_STRING: str
    MONGO_DB_NAME: str

    # AWS
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    AWS_REGION: str
    S3_UPLOADS_BUCKET_NAME: str
    
    # AI Services
    BEDROCK_MODEL_ID: str
    AMAZON_Q_APP_ID: str
    AMAZON_Q_USER_ID_PREFIX: str

    # Google Reverse Image Search
    GOOGLE_API_KEY: Optional[str] = None
    GOOGLE_CUSTOM_SEARCH_ENGINE_ID: Optional[str] = None

    # AWS Rekognition Video
    REKOGNITION_SNS_TOPIC_ARN: str
    REKOGNITION_ROLE_ARN: str

    class Config:
        case_sensitive = True

settings = Settings()