# app/models/token.py

from pydantic import BaseModel
from typing import Optional

class Token(BaseModel):
    """
    Defines the response model for a successful authentication request.
    This is what the client receives upon logging in.
    """
    access_token: str
    token_type: str

class TokenData(BaseModel):
    """
    Defines the data payload stored inside the JWT.
    This is used internally to validate the token and identify the user.
    """
    id: Optional[str] = None