# app/api/v1/api.py

from fastapi import APIRouter
from .endpoints import auth, claims, investigate

api_router = APIRouter()

# Include the authentication router
# Routes like /token will be available at /api/v1/auth/token
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Include the claims router
# Routes like /claims will be available at /api/v1/claims
api_router.include_router(claims.router, prefix="/claims", tags=["Claims Management"])

# Include the investigation (chat) router
# Routes like /{claim_id}/query will be available at /api/v1/investigate/{claim_id}/query
api_router.include_router(investigate.router, prefix="/investigate", tags=["AI Investigation"])