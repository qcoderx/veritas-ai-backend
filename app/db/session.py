# app/db/session.py

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

class Database:
    def __init__(self, db_url: str, db_name: str):
        self.client = AsyncIOMotorClient(db_url)
        self.db = self.client[db_name]

    def get_collection(self, name: str):
        return self.db[name]

db = Database(settings.MONGO_CONNECTION_STRING, settings.MONGO_DB_NAME)

# Convenience function to get a specific collection
def get_db_collection(name: str):
    return db.get_collection(name)