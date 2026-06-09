from pydantic import BaseModel, Field, BeforeValidator
from typing import List, Optional, Annotated

def convert_object_id(v):
    return str(v) if v is not None else v

PyObjectId = Annotated[str, BeforeValidator(convert_object_id)]

class ShiftNotesResponse(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    machineId: str
    plant: str
    shiftName: str
    timestamp: str
    authorRole: str
    note: str
    tags: List[str] = Field(default_factory=list)
    openForNextShift: bool = True
    nativeCode: Optional[str] = None

    class Config:
        populate_by_name = True
        extra = "ignore"