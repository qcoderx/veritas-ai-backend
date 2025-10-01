# app/api/v1/endpoints/auth.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorCollection

from app.core.security import create_access_token, verify_password
from app.db.session import get_db_collection
from app.models.token import Token
from app.models.user import User, UserCreate
from app.crud import crud_user

router = APIRouter()

@router.post("/signup", response_model=User, status_code=status.HTTP_201_CREATED)
async def signup(
    user_in: UserCreate,
    users_collection: AsyncIOMotorCollection = Depends(lambda: get_db_collection("users"))
):
    """
    Creates a new user account.
    """
    user = await crud_user.get_user_by_email(users_collection, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists.",
        )
    
    new_user = await crud_user.create_user(users_collection, user=user_in)
    return new_user


@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    users_collection: AsyncIOMotorCollection = Depends(lambda: get_db_collection("users"))
):
    """
    Authenticates an existing user and returns a JWT access token.
    """
    user = await crud_user.get_user_by_email(users_collection, email=form_data.username)
    
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(subject=user["id"])
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }