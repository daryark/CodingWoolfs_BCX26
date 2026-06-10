"""
Lightweight FastAPI server that:
1. Exposes MongoDB data (machines, events, resolutions, shift notes)
2. Proxies chat requests to AWS Bedrock AgentCore runtime
"""
from db.models.shift_notes_model import ShiftNotesResponse
from db.models.resolutions_model import ResolutionsResponse
from db.models.machines_model import MachinesResponse
from db.models.cnc_events_model import CNCEventsResponse
from db.db import cnc_events_collection, machines_collection, resolutions_collection, shift_notes_collection
import os
import sys
import json
import uuid
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
import boto3
from dotenv import load_dotenv

# Load env vars from backend/.env
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

# Allow importing from the parent db/ package
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


app = FastAPI(title="MachineWhisperer API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost:\d+|hackathon\.tamasandor\.de)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Bedrock AgentCore config ──────────────────────────────────────────────────

AGENT_RUNTIME_ARN = os.getenv(
    "AGENT_RUNTIME_ARN",
    "arn:aws:bedrock-agentcore:us-west-2:649944876610:runtime/AI_MyAgent-hdLMX7Cxub"
)
AWS_REGION = os.getenv("AWS_REGION", "us-west-2")

bedrock_agentcore_client = boto3.client(
    "bedrock-agentcore", region_name=AWS_REGION)


# ── Agent proxy ───────────────────────────────────────────────────────────────

class AgentRequest(BaseModel):
    inputText: str
    sessionId: Optional[str] = None
    agentId: Optional[str] = None
    agentAliasId: Optional[str] = None
    files: Optional[list] = None


@app.post("/agents/action")
def invoke_agent(req: AgentRequest):
    """Proxy chat requests to AWS Bedrock AgentCore runtime."""
    session_id = req.sessionId or str(uuid.uuid4())

    try:
        payload = {"prompt": req.inputText}

        response = bedrock_agentcore_client.invoke_agent_runtime(
            agentRuntimeArn=AGENT_RUNTIME_ARN,
            qualifier="DEFAULT",
            payload=json.dumps(payload).encode("utf-8"),
        )

        # Read the streaming response
        stream = response.get("response")
        if hasattr(stream, "read"):
            raw = stream.read().decode("utf-8")
        else:
            raw = str(stream) if stream else ""

        # Try parsing as JSON
        try:
            result = json.loads(raw)
            output = result.get("result") or result.get("output") or raw
        except (json.JSONDecodeError, TypeError):
            output = raw

        return {
            "output": output,
            "response": output,
            "sessionId": response.get("runtimeSessionId", session_id),
        }

    except Exception as e:
        raise HTTPException(
            status_code=502, detail=f"Agent invocation failed: {str(e)}")


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


# ── Machines ──────────────────────────────────────────────────────────────────

@app.get("/get-machines", response_model=List[MachinesResponse])
def get_machines():
    return list(machines_collection.find())


@app.get("/get-machines/{machine_id}", response_model=MachinesResponse)
def get_machine(machine_id: str):
    doc = machines_collection.find_one({"machineId": machine_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Machine not found")
    return doc


# ── Events ────────────────────────────────────────────────────────────────────

@app.get("/get-events", response_model=List[CNCEventsResponse])
def get_events():
    return list(cnc_events_collection.find())


@app.get("/get-machines/{machine_id}/events", response_model=List[CNCEventsResponse])
def get_machine_events(machine_id: str):
    return list(cnc_events_collection.find({"machine.id": machine_id}))


# ── Resolutions ───────────────────────────────────────────────────────────────

@app.get("/get-resolutions", response_model=List[ResolutionsResponse])
def get_resolutions():
    return list(resolutions_collection.find())


@app.get("/get-machines/{machine_id}/resolutions", response_model=List[ResolutionsResponse])
def get_machine_resolutions(machine_id: str):
    return list(resolutions_collection.find({"machineId": machine_id}))


# ── Notes ─────────────────────────────────────────────────────────────────────

@app.get("/get-notes", response_model=List[ShiftNotesResponse])
def get_notes():
    return list(shift_notes_collection.find())


@app.get("/get-machines/{machine_id}/notes", response_model=List[ShiftNotesResponse])
def get_machine_notes(machine_id: str):
    return list(shift_notes_collection.find({"machineId": machine_id}))
