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
    1. Embeds manual_chunks.json + manual_chunks2.json → MongoDB: manual_chunks
    2. Embeds resolutions.json       → updates MongoDB with embedding field
    3. Embeds shift_notes.json       → updates MongoDB with embedding field
    4. Creates vector search indexes in Atlas

Progress is saved after each batch to embedded/*.json and uploaded incrementally.
Re-running skips items that are already embedded locally.
"""

import json
import os
import time
from pathlib import Path

import voyageai
from dotenv import load_dotenv
from pymongo import MongoClient, ReplaceOne, UpdateOne
from voyageai.error import RateLimitError

load_dotenv()

# ─── CONFIG ───────────────────────────────────────────────────────────────────
VOYAGE_API_KEY = os.getenv("VOYAGE_API_KEY")
if not VOYAGE_API_KEY:
    raise SystemExit("VOYAGE_API_KEY is not set. Add it to .env or your environment.")
DB_PASSWORD = os.getenv("DB_PASSWORD")
if not DB_PASSWORD:
    raise SystemExit("DB_PASSWORD is not set. Add it to .env or your environment.")
MONGO_URI = f"mongodb+srv://woolf:{DB_PASSWORD}@cluster0.lmrqpdm.mongodb.net/?appName=Cluster0"
DB_NAME = "machinewhisperer"
MODEL = "voyage-3.5"
DIMENSIONS = 1024
# Free tier without billing: 3 RPM, 10K TPM — override via env once billing is added
BATCH_SIZE = int(os.getenv("EMBED_BATCH_SIZE", "8"))
RATE_LIMIT_WAIT = float(os.getenv("EMBED_RATE_LIMIT_WAIT", "21"))
MAX_RETRIES = 5

EMBEDDED_DIR = Path("embedded")

MANUAL_CHUNK_SOURCES = [
    ("manual_chunks.json", "manual_chunks.json"),
    ("manual_chunks2.json", "manual_chunks2.json"),
]
RESOLUTIONS_FILE = "resolutions.json"
SHIFT_NOTES_FILE = "shift_notes.json"

# ─── INIT ─────────────────────────────────────────────────────────────────────
vo = voyageai.Client(api_key=VOYAGE_API_KEY)
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# ─── HELPERS ──────────────────────────────────────────────────────────────────

def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f)
    tmp.replace(path)


def doc_for_mongo(doc):
    return {k: v for k, v in doc.items() if not k.startswith("_")}


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


def upload_batches(items, upload_batch_fn, label):
    for i in range(0, len(items), BATCH_SIZE):
        batch = items[i:i + BATCH_SIZE]
        upload_batch_fn(batch)
        done = min(i + BATCH_SIZE, len(items))
        print(f"    uploaded {done}/{len(items)} cached {label}", end="\r")
    if items:
        print(f"    uploaded {len(items)}/{len(items)} cached {label} ✓")


def embed_and_sync(items, text_fn, label, cache_path, upload_batch_fn):
    """
    Embed items in batches, saving progress locally and uploading after each batch.
    Skips items already present in the local cache with an embedding.
    """
    cache_path = Path(cache_path)
    cached = {}
    if cache_path.exists():
        for item in load_json(cache_path):
            if item.get("embedding"):
                cached[item["_id"]] = item

    total = len(items)
    done_embed = len(cached)
    print(f"  {label}: {done_embed}/{total} already embedded locally")

    pending_upload = [cached[i["_id"]] for i in items if i["_id"] in cached and not cached[i["_id"]].get("_mongoSynced")]
    if pending_upload:
        print(f"  Uploading {len(pending_upload)} cached {label} not yet in MongoDB...")
        upload_batches(pending_upload, upload_batch_fn, label)
        for item in pending_upload:
            item["_mongoSynced"] = True
        save_json(cache_path, list(cached.values()))

    pending_embed = [item for item in items if item["_id"] not in cached]
    if not pending_embed:
        print(f"  {label}: nothing left to embed ✓")
        return list(cached.values())

    print(f"  Embedding {len(pending_embed)} remaining {label}...")

    for i in range(0, len(pending_embed), BATCH_SIZE):
        batch = pending_embed[i:i + BATCH_SIZE]
        texts = [text_fn(item) for item in batch]
        embeddings = embed_texts(texts)

        for item, emb in zip(batch, embeddings):
            item["embedding"] = emb
            item["embeddingModel"] = MODEL
            item["embeddingDimensions"] = DIMENSIONS
            item["_mongoSynced"] = False
            cached[item["_id"]] = item

        save_json(cache_path, list(cached.values()))
        upload_batch_fn(batch)
        for item in batch:
            cached[item["_id"]]["_mongoSynced"] = True
        save_json(cache_path, list(cached.values()))

        done_embed = len(cached)
        print(f"    {done_embed}/{total} embedded + saved + uploaded", end="\r")

        if i + BATCH_SIZE < len(pending_embed):
            time.sleep(RATE_LIMIT_WAIT)

    print(f"    {total}/{total} embedded ✓")
    return list(cached.values())


def upload_manual_batch(batch):
    col = db["manual_chunks"]
    ops = [ReplaceOne({"_id": d["_id"]}, doc_for_mongo(d), upsert=True) for d in batch]
    col.bulk_write(ops)


def upload_resolution_batch(batch):
    col = db["resolutions"]
    ops = [
        UpdateOne(
            {"_id": d["_id"]},
            {"$set": {
                "embedding": d["embedding"],
                "embeddingModel": MODEL,
                "embeddingDimensions": DIMENSIONS,
            }},
            upsert=False,
        )
        for d in batch
    ]
    col.bulk_write(ops)


def upload_shift_note_batch(batch):
    col = db["shift_notes"]
    ops = [
        UpdateOne(
            {"_id": d["_id"]},
            {"$set": {
                "embedding": d["embedding"],
                "embeddingModel": MODEL,
                "embeddingDimensions": DIMENSIONS,
            }},
            upsert=False,
        )
        for d in batch
    ]
    col.bulk_write(ops)


def create_manual_vector_index():
    col = db["manual_chunks"]
    try:
        col.create_search_index({
            "name": "manual_vector_index",
            "type": "vectorSearch",
            "definition": {
                "fields": [{
                    "type": "vector",
                    "path": "embedding",
                    "numDimensions": DIMENSIONS,
                    "similarity": "cosine",
                }, {
                    "type": "filter",
                    "path": "nativeCode",
                }, {
                    "type": "filter",
                    "path": "sectionType",
                }, {
                    "type": "filter",
                    "path": "controller",
                }],
            },
        })
        print("  Vector index created on manual_chunks")
    except Exception as e:
        print(f"  Index creation note: {e}")
        print("  → Create index manually in Atlas UI (see instructions below)")


# ─── 1. MANUAL CHUNKS ─────────────────────────────────────────────────────────

def process_manual_chunks():
    print("\n[1/3] Manual chunks...")
    for source_file, cache_name in MANUAL_CHUNK_SOURCES:
        if not Path(source_file).exists():
            print(f"  Skipping {source_file} (file not found)")
            continue

        chunks = load_json(source_file)
        label = source_file
        cache_path = EMBEDDED_DIR / cache_name
        embed_and_sync(chunks, lambda c: c["text"], label, cache_path, upload_manual_batch)

    create_manual_vector_index()


# ─── 2. RESOLUTIONS ───────────────────────────────────────────────────────────

def process_resolutions():
    print("\n[2/3] Resolutions...")
    if not Path(RESOLUTIONS_FILE).exists():
        print(f"  Skipping {RESOLUTIONS_FILE} (file not found)")
        return

    docs = load_json(RESOLUTIONS_FILE)
    embed_and_sync(
        docs,
        lambda d: d["ragSummary"],
        "resolutions",
        EMBEDDED_DIR / "resolutions.json",
        upload_resolution_batch,
    )

    try:
        col = db["resolutions"]
        col.create_search_index({
            "name": "resolution_vector_index",
            "type": "vectorSearch",
            "definition": {
                "fields": [{
                    "type": "vector",
                    "path": "embedding",
                    "numDimensions": DIMENSIONS,
                    "similarity": "cosine",
                }, {
                    "type": "filter",
                    "path": "nativeCode",
                }, {
                    "type": "filter",
                    "path": "controller",
                }],
            },
        })
        print("  Vector index created on resolutions")
    except Exception as e:
        print(f"  Index creation note: {e}")


# ─── 3. SHIFT NOTES ───────────────────────────────────────────────────────────

def process_shift_notes():
    print("\n[3/3] Shift notes...")
    if not Path(SHIFT_NOTES_FILE).exists():
        print(f"  Skipping {SHIFT_NOTES_FILE} (file not found)")
        return

    docs = load_json(SHIFT_NOTES_FILE)
    embed_and_sync(
        docs,
        lambda d: d["note"],
        "shift notes",
        EMBEDDED_DIR / "shift_notes.json",
        upload_shift_note_batch,
    )

    try:
        col = db["shift_notes"]
        col.create_search_index({
            "name": "shiftnote_vector_index",
            "type": "vectorSearch",
            "definition": {
                "fields": [{
                    "type": "vector",
                    "path": "embedding",
                    "numDimensions": DIMENSIONS,
                    "similarity": "cosine",
                }, {
                    "type": "filter",
                    "path": "machineId",
                }],
            },
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
    print(f"Cache:  {EMBEDDED_DIR}/")
    print(f"DB:     {DB_NAME} @ cluster0.lmrqpdm.mongodb.net")

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
