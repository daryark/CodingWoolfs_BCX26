from fastapi import FastAPI
from typing import List
from db.db import cnc_events_collection, machines_collection, resolutions_collection, shift_notes_collection
from db.models.cnc_events_model import CNCEventsResponse
from db.models.machines_model import MachinesResponse
from db.models.resolutions_model import ResolutionsResponse
from db.models.shift_notes_model import ShiftNotesResponse

app = FastAPI()

@app.get("/get-events", response_model=List[CNCEventsResponse])
def read_mongodb_events():
    return list(cnc_events_collection.find())


@app.get("/get-machines", response_model=List[MachinesResponse])
def read_mongodb_machines():
    return list(machines_collection.find())


@app.get("/get-resolutions", response_model=List[ResolutionsResponse])
def read_mongodb_resolutions():
    return list(resolutions_collection.find())


@app.get("/get-notes", response_model=List[ShiftNotesResponse])
def read_mongodb_notes():
    return list(shift_notes_collection.find())


def main():
    print("Hello from backend!")

if __name__ == "__main__":
    main()
