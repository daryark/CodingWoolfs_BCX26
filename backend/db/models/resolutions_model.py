from pydantic import BaseModel, Field, BeforeValidator
from typing import List, Optional, Annotated

def convert_object_id(v):
    return str(v) if v is not None else v

PyObjectId = Annotated[str, BeforeValidator(convert_object_id)]

class ResolutionAttempt(BaseModel):
    action: str
    result: str
    durationMinutes: Optional[int] = None

class ResolutionsResponse(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    machineId: str
    controller: str
    nativeCode: str
    errorDescription: Optional[str] = None
    timestamp: str
    resolvedAt: Optional[str] = None
    downtimeMinutes: Optional[int] = None
    successfulFix: Optional[str] = None
    partsReplaced: List[str] = Field(default_factory=list)
    workedFirstTime: Optional[bool] = None
    attempts: List[ResolutionAttempt] = Field(default_factory=list)
    attemptCount: Optional[int] = 0
    verifiedBy: Optional[str] = None
    shift: Optional[str] = None
    season: Optional[str] = None
    ragSummary: Optional[str] = None

    class Config:
        populate_by_name = True
        extra = "ignore"