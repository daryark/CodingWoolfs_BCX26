import os
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv

load_dotenv()

db_password = os.getenv("DB_PASSWORD")
uri = f'mongodb+srv://woolf:{db_password}@cluster0.lmrqpdm.mongodb.net/?appName=Cluster0'

client = MongoClient(uri, server_api=ServerApi('1'))

try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(f"Database connection error: {e}")

# Change "my_database_name" to the actual name of your database in the Atlas UI
db = client["machinewhisperer"]
cnc_events_collection = db["cnc_events"]
machines_collection = db["machines"]
resolutions_collection = db["resolutions"]
shift_notes_collection = db["shift_notes"]