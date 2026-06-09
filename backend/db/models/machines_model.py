from pydantic import BaseModel, Field, BeforeValidator
from typing import List, Optional, Annotated

def convert_object_id(v):
    return str(v) if v is not None else v

PyObjectId = Annotated[str, BeforeValidator(convert_object_id)]

class MTConnectConfig(BaseModel):
    protocol: str
    port: int
    currentUrlExample: Optional[str] = None

class WorkEnvelope(BaseModel):
    x: Optional[int] = None
    y: Optional[int] = None
    z: Optional[int] = None

class MachineSpecs(BaseModel):
    maxSpindleRpm: int
    axes: List[str]
    toolCapacity: int
    workEnvelopeMm: WorkEnvelope

class MachinesResponse(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    machineId: str
    brand: str
    model: str
    machineType: str
    controller: str
    serialNumber: str
    installYear: int
    plant: str
    line: str
    mtconnect: MTConnectConfig
    specs: MachineSpecs
    maintenanceIntervalDays: int
    notes: Optional[str] = None  # Worn parts/notes are optional
    lastMaintenanceDate: Optional[str] = None
    nextMaintenanceDue: Optional[str] = None
    daysSinceLastMaintenance: Optional[int] = None
    maintenanceOverdue: Optional[bool] = None
    createdAt: str

    class Config:
        populate_by_name = True
        extra = "ignore"