# app/models/msg.py

from pydantic import BaseModel

class Msg(BaseModel):
    """
    A simple model for returning a message string.
    """
    msg: str