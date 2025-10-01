# app/core/security.py

from datetime import datetime, timedelta
from typing import Optional, Any

from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.config import settings
from app.models.token import TokenData
from app.models.user import UserInDB
from app.db.session import get_db_collection

# --- Password Hashing Setup ---
# We use bcrypt, the industry standard.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- OAuth2 Scheme ---
# This tells FastAPI how to find the token in the request header.
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/token"
)

# --- Password Utilities ---

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain text password against its hashed version."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hashes a plain text password."""
    return pwd_context.hash(password)


# --- JWT Token Utilities ---

def create_access_token(subject: Any, expires_delta: Optional[timedelta] = None) -> str:
    """Creates a new JWT access token."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt


# --- Dependency for Getting Current User ---

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    users_collection = Depends(lambda: get_db_collection("users"))
) -> UserInDB:
    """
    Decodes JWT token to get the current user.
    This is the core dependency for protected endpoints.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=["HS256"]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(id=user_id)
    except JWTError:
        raise credentials_exception
    
    user = await users_collection.find_one({"id": token_data.id})
    if user is None:
        raise credentials_exception
        
    return UserInDB(**user)

# A simple dependency to check if the user is active.
# You can expand this with roles or other permissions.
def get_current_active_user(current_user: UserInDB = Depends(get_current_user)) -> UserInDB:
    # In a real app, you would add a check here like `if not current_user.is_active:`
    # For this project, we'll assume all users are active.
    return current_user