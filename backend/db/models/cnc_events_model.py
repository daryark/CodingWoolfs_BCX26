from pydantic import BaseModel, Field, BeforeValidator
from typing import List, Optional, Annotated

def convert_object_id(v):
    return str(v) if v is not None else v

PyObjectId = Annotated[str, BeforeValidator(convert_object_id)]

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
    
    qualifier: Optional[str] = None 
    
    boschRexrothClass: Optional[str] = None 

class MTConnectInfo(BaseModel):
    dataItemId: str
    sequence: int
    componentType: str

class CNCEventsResponse(BaseModel):
    id: PyObjectId = Field(..., alias="_id") 
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
        extra = "ignore"