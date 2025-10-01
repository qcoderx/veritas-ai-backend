# app/crud/crud_user.py

from motor.motor_asyncio import AsyncIOMotorCollection
from app.models.user import UserCreate, UserInDB
from app.core.security import get_password_hash

async def get_user_by_email(collection: AsyncIOMotorCollection, email: str) -> dict:
    """
    Retrieves a user from the database by their email address.
    """
    return await collection.find_one({"email": email})

async def create_user(collection: AsyncIOMotorCollection, user: UserCreate) -> UserInDB:
    """
    Creates a new user in the database.
    """
    hashed_password = get_password_hash(user.password)
    user_in_db = UserInDB(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password
    )
    
    await collection.insert_one(user_in_db.dict())
    return user_in_db