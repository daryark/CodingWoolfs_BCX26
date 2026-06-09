import os
import json
import boto3
from pymongo import MongoClient
from pymongo.server_api import ServerApi

# Keep the global space completely empty of network/database actions!

def get_database_client():
    """
    Dynamically fetches credentials and initializes the Mongo Client 
    only when a tool is explicitly invoked.
    """
    secret_name = "machinewhisperer/mongo"
    region_name = "us-west-2"

    session = boto3.session.Session()
    secrets_client = session.client(service_name='secretsmanager', region_name=region_name)
    
    try:
        # 1. Fetch password from Secrets Manager
        response = secrets_client.get_secret_value(SecretId=secret_name)
        secret_dict = json.loads(response['SecretString'])
        db_password = secret_dict['DB_PASSWORD']
    except Exception as e:
        print(f"Failed to fetch secret, falling back to env: {e}")
        db_password = os.getenv("DB_PASSWORD")

    # 2. Build connection URI
    uri = f'mongodb://woolf:{db_password}@ac-tlwse0r-shard-00-00.lmrqpdm.mongodb.net:27017,ac-tlwse0r-shard-00-01.lmrqpdm.mongodb.net:27017,ac-tlwse0r-shard-00-02.lmrqpdm.mongodb.net:27017/?ssl=true&replicaSet=atlas-7k29jq-shard-0&authSource=admin&appName=Cluster0'
    
    # 3. Return client with an aggressive 5-second connection timeout so it never hangs AWS indefinitely
    return MongoClient(uri, server_api=ServerApi('1'), serverSelectionTimeoutMS=5000)


# --- AGENTCORE TOOLS ---

def get_machine_status(machine_id: str) -> dict:
    """
    Retrieves the details and current setup state of a specific CNC machine.
    Use this tool whenever the user asks about a machine's parameters or specifications.
    """
    try:
        client = get_database_client()
        db = client["machinewhisperer"]
        machines_collection = db["machines"]

        result = machines_collection.find_one({"machine_id": machine_id})
        if result:
            result["_id"] = str(result["_id"]) 
            return result
        return {"error": f"Machine {machine_id} not found."}
    except Exception as e:
        return {"error": f"Database error: {str(e)}"}


def get_latest_cnc_events(limit: int = 5) -> list:
    """
    Retrieves the most recent CNC error logs, alerts, or operational events.
    Use this tool when looking up recent issues or telemetry data from the factory floor.
    """
    try:
        client = get_database_client()
        db = client["machinewhisperer"]
        cnc_events_collection = db["cnc_events"]

        events = list(cnc_events_collection.find().sort("timestamp", -1).limit(int(limit)))
        for event in events:
            event["_id"] = str(event["_id"])
        return events
    except Exception as e:
        return [{"error": f"Database error: {str(e)}"}]


def add_shift_note(author: str, machine_id: str, note_text: str) -> dict:
    """
    Inserts a new operational or maintenance note for a machine during a shift handover.
    Use this tool when an operator wants to log a comment, event, or warning.
    """
    try:
        client = get_database_client()
        db = client["machinewhisperer"]
        shift_notes_collection = db["shift_notes"]

        new_note = {
            "author": author,
            "machine_id": machine_id,
            "note": note_text,
            "timestamp": "2026-06-09T20:00:00Z" 
        }
        result = shift_notes_collection.insert_one(new_note)
        return {"status": "success", "inserted_id": str(result.inserted_id)}
    except Exception as e:
        return {"error": f"Database error: {str(e)}"}