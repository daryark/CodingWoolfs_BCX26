from fastapi import FastAPI
from db.db import logs_collection

app = FastAPI()

@app.get("/get")
def read_mongodb_data():
    output = []
    
    for document in logs_collection.find():
        document["_id"] = str(document["_id"])
        output.append(document)
        
    return {"all_logs": output}

def main():
    print("Hello from backend!")

if __name__ == "__main__":
    main()
