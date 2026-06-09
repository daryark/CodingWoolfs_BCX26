"""
Embedding Script for MachineWhisperer RAG
==========================================
Run this LOCALLY on your machine.

Prerequisites:
    pip install voyageai pymongo python-dotenv

Usage:
    Set VOYAGE_API_KEY and DB_PASSWORD in a .env file or environment, then run:
    python embed_and_upload.py

What it does:
    1. Embeds manual_chunks.json     → uploads to MongoDB collection: manual_chunks
    2. Embeds resolutions.json       → updates documents in MongoDB with embedding field
    3. Embeds shift_notes.json       → updates documents in MongoDB with embedding field
    4. Creates vector search indexes in Atlas
"""

import json
import os
import time
import voyageai
from dotenv import load_dotenv
from pymongo import MongoClient, UpdateOne
from voyageai.error import RateLimitError

load_dotenv()

# ─── CONFIG ───────────────────────────────────────────────────────────────────
VOYAGE_API_KEY  = os.getenv("VOYAGE_API_KEY")
if not VOYAGE_API_KEY:
    raise SystemExit("VOYAGE_API_KEY is not set. Add it to .env or your environment.")
DB_PASSWORD     = os.getenv("DB_PASSWORD")
if not DB_PASSWORD:
    raise SystemExit("DB_PASSWORD is not set. Add it to .env or your environment.")
MONGO_URI       = f"mongodb+srv://woolf:{DB_PASSWORD}@cluster0.lmrqpdm.mongodb.net/?appName=Cluster0"
DB_NAME         = "machinewhisperer"
MODEL           = "voyage-3.5"
DIMENSIONS      = 1024
# Free tier without billing: 3 RPM, 10K TPM — override via env once billing is added
BATCH_SIZE      = int(os.getenv("EMBED_BATCH_SIZE", "8"))
RATE_LIMIT_WAIT = float(os.getenv("EMBED_RATE_LIMIT_WAIT", "21"))
MAX_RETRIES     = 5

# Files (adjust paths if needed)
MANUAL_CHUNKS_FILE  = "manual_chunks.json"
RESOLUTIONS_FILE    = "resolutions.json"
SHIFT_NOTES_FILE    = "shift_notes.json"

# ─── INIT ─────────────────────────────────────────────────────────────────────
vo     = voyageai.Client(api_key=VOYAGE_API_KEY)
client = MongoClient(MONGO_URI)
db     = client[DB_NAME]

# ─── HELPERS ──────────────────────────────────────────────────────────────────

def embed_texts(texts, input_type="document"):
    """Embed a list of texts, return list of embedding vectors."""
    for attempt in range(MAX_RETRIES):
        try:
            result = vo.embed(texts, model=MODEL, input_type=input_type)
            return result.embeddings
        except RateLimitError:
            if attempt == MAX_RETRIES - 1:
                raise
            wait = RATE_LIMIT_WAIT * (2 ** attempt)
            print(f"\n    Rate limited, waiting {wait:.0f}s before retry...")
            time.sleep(wait)

def batch_embed(items, text_fn, label):
    """
    Embed a list of items in batches.
    text_fn: function that takes an item and returns the text to embed.
    Returns items with 'embedding' field added.
    """
    total = len(items)
    print(f"  Embedding {total} {label}...")

    for i in range(0, total, BATCH_SIZE):
        batch = items[i:i + BATCH_SIZE]
        texts = [text_fn(item) for item in batch]

        embeddings = embed_texts(texts)
        for item, emb in zip(batch, embeddings):
            item["embedding"] = emb
            item["embeddingModel"] = MODEL
            item["embeddingDimensions"] = DIMENSIONS

        done = min(i + BATCH_SIZE, total)
        print(f"    {done}/{total} embedded", end="\r")

        if i + BATCH_SIZE < total:
            time.sleep(RATE_LIMIT_WAIT)

    print(f"    {total}/{total} embedded ✓")
    return items

# ─── 1. MANUAL CHUNKS ─────────────────────────────────────────────────────────

def process_manual_chunks():
    print("\n[1/3] Manual chunks...")
    with open(MANUAL_CHUNKS_FILE) as f:
        chunks = json.load(f)

    # Embed
    chunks = batch_embed(chunks, lambda c: c["text"], "manual chunks")

    # Upload — drop and recreate for clean state
    col = db["manual_chunks"]
    col.drop()
    col.insert_many(chunks)
    print(f"  Uploaded {len(chunks)} chunks to manual_chunks")

    # Create vector index
    try:
        col.create_search_index({
            "name": "manual_vector_index",
            "type": "vectorSearch",
            "definition": {
                "fields": [{
                    "type": "vector",
                    "path": "embedding",
                    "numDimensions": DIMENSIONS,
                    "similarity": "cosine"
                }, {
                    "type": "filter",
                    "path": "nativeCode"
                }, {
                    "type": "filter",
                    "path": "sectionType"
                }, {
                    "type": "filter",
                    "path": "controller"
                }]
            }
        })
        print("  Vector index created on manual_chunks")
    except Exception as e:
        print(f"  Index creation note: {e}")
        print("  → Create index manually in Atlas UI (see instructions below)")

# ─── 2. RESOLUTIONS ───────────────────────────────────────────────────────────

def process_resolutions():
    print("\n[2/3] Resolutions...")
    with open(RESOLUTIONS_FILE) as f:
        docs = json.load(f)

    # Embed ragSummary field
    docs = batch_embed(docs, lambda d: d["ragSummary"], "resolutions")

    # Upsert into existing collection (preserves documents already imported)
    col = db["resolutions"]
    ops = [
        UpdateOne(
            {"_id": d["_id"]},
            {"$set": {
                "embedding":           d["embedding"],
                "embeddingModel":      MODEL,
                "embeddingDimensions": DIMENSIONS
            }},
            upsert=False
        )
        for d in docs
    ]
    result = col.bulk_write(ops)
    print(f"  Updated {result.modified_count} resolutions with embeddings")

    # Create vector index
    try:
        col.create_search_index({
            "name": "resolution_vector_index",
            "type": "vectorSearch",
            "definition": {
                "fields": [{
                    "type": "vector",
                    "path": "embedding",
                    "numDimensions": DIMENSIONS,
                    "similarity": "cosine"
                }, {
                    "type": "filter",
                    "path": "nativeCode"
                }, {
                    "type": "filter",
                    "path": "controller"
                }]
            }
        })
        print("  Vector index created on resolutions")
    except Exception as e:
        print(f"  Index creation note: {e}")

# ─── 3. SHIFT NOTES ───────────────────────────────────────────────────────────

def process_shift_notes():
    print("\n[3/3] Shift notes...")
    with open(SHIFT_NOTES_FILE) as f:
        docs = json.load(f)

    # Embed note field
    docs = batch_embed(docs, lambda d: d["note"], "shift notes")

    # Upsert into existing collection
    col = db["shift_notes"]
    ops = [
        UpdateOne(
            {"_id": d["_id"]},
            {"$set": {
                "embedding":           d["embedding"],
                "embeddingModel":      MODEL,
                "embeddingDimensions": DIMENSIONS
            }},
            upsert=False
        )
        for d in docs
    ]
    result = col.bulk_write(ops)
    print(f"  Updated {result.modified_count} shift notes with embeddings")

    # Create vector index
    try:
        col.create_search_index({
            "name": "shiftnote_vector_index",
            "type": "vectorSearch",
            "definition": {
                "fields": [{
                    "type": "vector",
                    "path": "embedding",
                    "numDimensions": DIMENSIONS,
                    "similarity": "cosine"
                }, {
                    "type": "filter",
                    "path": "machineId"
                }]
            }
        })
        print("  Vector index created on shift_notes")
    except Exception as e:
        print(f"  Index creation note: {e}")

# ─── MANUAL INDEX INSTRUCTIONS ────────────────────────────────────────────────

ATLAS_INDEX_INSTRUCTIONS = """
If automatic index creation failed, create vector indexes manually in Atlas UI:

Go to Atlas → your cluster → Browse Collections → select collection
→ Search Indexes tab → Create Search Index → JSON Editor

--- manual_chunks ---
{
  "name": "manual_vector_index",
  "type": "vectorSearch",
  "fields": [
    {"type": "vector", "path": "embedding", "numDimensions": 1024, "similarity": "cosine"},
    {"type": "filter", "path": "nativeCode"},
    {"type": "filter", "path": "sectionType"},
    {"type": "filter", "path": "controller"}
  ]
}

--- resolutions ---
{
  "name": "resolution_vector_index",
  "type": "vectorSearch",
  "fields": [
    {"type": "vector", "path": "embedding", "numDimensions": 1024, "similarity": "cosine"},
    {"type": "filter", "path": "nativeCode"},
    {"type": "filter", "path": "controller"}
  ]
}

--- shift_notes ---
{
  "name": "shiftnote_vector_index",
  "type": "vectorSearch",
  "fields": [
    {"type": "vector", "path": "embedding", "numDimensions": 1024, "similarity": "cosine"},
    {"type": "filter", "path": "machineId"}
  ]
}
"""

# ─── QUERY EXAMPLE ────────────────────────────────────────────────────────────

QUERY_EXAMPLE = """
Example RAG query (run after embeddings are uploaded):

import voyageai
from pymongo import MongoClient

vo = voyageai.Client(api_key="YOUR_KEY")
db = MongoClient("YOUR_URI")["machinewhisperer"]

def search(query_text, native_code=None, k=5):
    # Embed the query
    q_emb = vo.embed([query_text], model="voyage-3.5", input_type="query").embeddings[0]

    # Build pre-filter
    pre_filter = {}
    if native_code:
        pre_filter["nativeCode"] = {"$eq": native_code}

    # Search manual chunks
    results = db.manual_chunks.aggregate([{
        "$vectorSearch": {
            "index": "manual_vector_index",
            "path": "embedding",
            "queryVector": q_emb,
            "numCandidates": k * 10,
            "limit": k,
            "filter": pre_filter if pre_filter else None
        }
    }, {
        "$project": {"text": 1, "source": 1, "nativeCode": 1, "score": {"$meta": "vectorSearchScore"}}
    }])

    return list(results)

# Usage
print(search("spindle overheating during drill operation", native_code="447"))
print(search("F2074 encoder signals disturbed cause remedy"))
"""

# ─── MAIN ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("MachineWhisperer Embedding Pipeline")
    print("=" * 40)
    print(f"Model:  {MODEL} ({DIMENSIONS} dimensions)")
    print(f"Batch:  {BATCH_SIZE} chunks, {RATE_LIMIT_WAIT}s between requests")
    print(f"DB:     {DB_NAME} @ cluster0.lmrqpdm.mongodb.net")

    # Verify connection
    try:
        client.admin.command("ping")
        print("MongoDB: connected ✓\n")
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        print("Check DB_PASSWORD in your .env — same value used by the backend.")
        exit(1)

    process_manual_chunks()
    process_resolutions()
    process_shift_notes()

    print("\n" + "=" * 40)
    print("Done. Summary:")
    print(f"  manual_chunks: {db.manual_chunks.count_documents({})}")
    print(f"  resolutions:   {db.resolutions.count_documents({'embedding': {'$exists': True}})}")
    print(f"  shift_notes:   {db.shift_notes.count_documents({'embedding': {'$exists': True}})}")

    print(ATLAS_INDEX_INSTRUCTIONS)
    print(QUERY_EXAMPLE)
