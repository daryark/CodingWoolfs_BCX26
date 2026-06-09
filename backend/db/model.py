from pydantic import BaseModel, Field
from typing import List, Optional

class MachineInfo(BaseModel):
    id: str
    name: str
    manufacturer: str
    controller: str

class ErrorInfo(BaseModel):
    nativeCode: str
    conditionType: str
    conditionState: str
    description: str
    causes: List[str]
    fixHint: str
    qualifier: str

class MTConnectInfo(BaseModel):
    dataItemId: str
    sequence: int
    componentType: str

# This represents your entire MongoDB Document
class MachineLogResponse(BaseModel):
    id: str = Field(..., alias="_id") # Converts MongoDB's '_id' object to a clean string
    timestamp: str
    machine: MachineInfo
    error: ErrorInfo
    mtconnect: MTConnectInfo
    status: str
    resolvedAt: Optional[str] = None
    durationSeconds: Optional[int] = None
    recurrenceIndex: Optional[int] = None
    shift: str
    plant: str

    class Config:
        populate_by_name = True