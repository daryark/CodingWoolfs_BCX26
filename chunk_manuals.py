"""
Manual Chunker for MachineWhisperer RAG
========================================
Produces manual_chunks.json ready for embedding with Voyage AI.

Sources:
  - Bosch Rexroth IndraDrive Troubleshooting (767614.pdf)
  - Mazak VTC-160A Maintenance (67728d.pdf)
  - Mazak VTC-200B/300C Operating (529e3a.pdf)
  - Haas VF-2 Service Manual 1996 (English_-_VF...pdf)
  - Siemens Sinumerik 840D Diagnostics (Diagnostics_Manual...pdf)
  - Fanuc 31i Maintenance (786398117-...txt)
  - Fanuc 31i Operators Manual (832025899-...txt)

Chunk strategy:
  - ALARM chunks: one entry per error code (code + cause + remedy)
    sectionType = "alarm"
  - OPERATIONAL chunks: paragraph/fixed-size with overlap
    sectionType = "operational"
"""

import json
import re
import uuid
import pdfplumber
from pathlib import Path

ROOT    = Path(__file__).parent
MANUALS = ROOT / "manuals"
OUTPUT  = ROOT / "manual_chunks.json"

CHUNK_SIZE    = 500   # chars for operational chunks
CHUNK_OVERLAP = 100   # overlap between operational chunks

# ─── HELPERS ──────────────────────────────────────────────────────────────────

def make_id():
    return f"CHUNK-{uuid.uuid4().hex[:8].upper()}"

def clean(text):
    """Remove noise common to ManualsLib PDFs."""
    text = re.sub(r'ManualsLib\.com.*?\n', '', text)
    text = re.sub(r'LSA Control S\.L\..*?\n', '', text)
    text = re.sub(r'DOK-INDRV\*-GEN.*?\n', '', text)
    text = re.sub(r'\x00', '', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' {3,}', ' ', text)
    return text.strip()

def operational_chunks(text, source, machine, controller, section_name):
    """Split prose text into overlapping fixed-size chunks."""
    chunks = []
    text = clean(text)
    # Split on paragraph boundaries first
    paragraphs = re.split(r'\n{2,}', text)
    buffer = ""
    for para in paragraphs:
        para = para.strip()
        if not para or len(para) < 20:
            continue
        if len(buffer) + len(para) < CHUNK_SIZE:
            buffer = (buffer + " " + para).strip()
        else:
            if buffer:
                chunks.append(make_chunk(buffer, source, machine, controller,
                                         section_name, "operational"))
            # Start new buffer with overlap
            overlap_text = buffer[-CHUNK_OVERLAP:] if len(buffer) > CHUNK_OVERLAP else buffer
            buffer = (overlap_text + " " + para).strip()
    if buffer and len(buffer) > 50:
        chunks.append(make_chunk(buffer, source, machine, controller,
                                 section_name, "operational"))
    return chunks

def make_chunk(text, source, machine, controller, section, section_type,
               native_code=None, page=None):
    doc = {
        "_id":         make_id(),
        "text":        clean(text),
        "source":      source,
        "machine":     machine,
        "controller":  controller,
        "section":     section,
        "sectionType": section_type,
    }
    if native_code:
        doc["nativeCode"] = native_code
    if page:
        doc["page"] = page
    return doc

def extract_pdf_text(path, first_page=1, last_page=None):
    """Extract text from PDF pages."""
    pages = []
    with pdfplumber.open(path) as pdf:
        end = last_page or len(pdf.pages)
        for i, page in enumerate(pdf.pages[first_page-1:end], start=first_page):
            text = page.extract_text() or ""
            pages.append((i, text))
    return pages

# ─── BOSCH REXROTH ────────────────────────────────────────────────────────────
# Structure: each entry = "Fxxxx Title\n...body...\nFxxxx - Attributes"
# Pattern covers F, E, A, C, W codes

REXROTH_CODE_PATTERN = re.compile(
    r'([FEACW]\d{4})\s+([^\n]+)\n(.*?)(?=\n[FEACW]\d{4}\s+|\Z)',
    re.DOTALL
)

def chunk_rexroth(path):
    print(f"  Processing Bosch Rexroth ({path.name})...")
    chunks = []

    # Extract all text — skip first 60 pages (TOC, safety, intro)
    full_text = ""
    pages_text = extract_pdf_text(path, first_page=61)
    page_map = {}  # code -> page number

    for page_num, text in pages_text:
        cleaned = clean(text)
        # Track which page each code first appears on
        for code in re.findall(r'[FEACW]\d{4}', cleaned):
            if code not in page_map:
                page_map[code] = page_num
        full_text += "\n" + cleaned

    # Parse error entries
    for match in REXROTH_CODE_PATTERN.finditer(full_text):
        code  = match.group(1)
        title = match.group(2).strip()
        body  = match.group(3).strip()

        # Remove attributes block at end
        body = re.sub(r'[\w\d]+ - Attributes.*$', '', body, flags=re.DOTALL).strip()
        # Remove firmware variant boilerplate
        body = re.sub(r'Supported by Firmware Variant:.*?(?=Cause|Remedy|The drive|\Z)',
                      '', body, flags=re.DOTALL).strip()

        if len(body) < 30:
            continue

        # Determine section type
        code_prefix = code[0]
        if code_prefix == 'F':
            section = "Error Messages"
        elif code_prefix == 'E':
            section = "Warning Messages"
        elif code_prefix == 'A':
            section = "Status Messages"
        elif code_prefix == 'C':
            section = "Command Messages"
        else:
            section = "Diagnostic Messages"

        text = f"{code} {title}\n\n{body}"

        chunks.append(make_chunk(
            text, "Bosch Rexroth IndraDrive Troubleshooting Manual",
            ["cnc_rexroth_01", "cnc_rexroth_02"],
            "Rexroth IndraDrive",
            section, "alarm",
            native_code=code,
            page=page_map.get(code)
        ))

    # Also chunk operational sections (pages 1-60: diagnosis basics, operating states)
    for page_num, text in extract_pdf_text(path, first_page=1, last_page=60):
        if len(text.strip()) > 100:
            for chunk in operational_chunks(
                text, "Bosch Rexroth IndraDrive Troubleshooting Manual",
                ["cnc_rexroth_01", "cnc_rexroth_02"],
                "Rexroth IndraDrive", "Device Diagnosis Basics"
            ):
                chunk["page"] = page_num
                chunks.append(chunk)

    print(f"    → {len(chunks)} chunks")
    return chunks

# ─── SIEMENS 840D ─────────────────────────────────────────────────────────────
# Structure: "NNNNN\n[Channel %1:...]\nParameters:\nExplanation:\nReaction:\nRemedies:"

SIEMENS_CODE_PATTERN = re.compile(
    r'^(\d{4,6})\n(.+?)(?=^\d{4,6}\n|\Z)',
    re.MULTILINE | re.DOTALL
)

def chunk_siemens(path):
    """Use pdftotext CLI in batches — avoids loading 121MB into pdfplumber."""
    import subprocess, tempfile, os
    print(f"  Processing Siemens 840D ({path.name})...")
    chunks = []

    SIEMENS_SINGLE = re.compile(
        r'(\d{4,6})\n(.+?)(?=\d{4,6}\n|\Z)',
        re.DOTALL
    )

    sections = [
        (1,   20,   "Alarm System Overview",   "operational"),
        (21,  600,  "NC Alarms",               "alarm"),
        (600, 900,  "SINAMICS Drive Alarms",    "alarm"),
        (900, 1100, "PLC Alarms",               "alarm"),
    ]

    carry_buffer = ""

    for start, end, section_name, stype in sections:
        print(f"    Pages {start}-{end} ({section_name})...")
        # Extract in 50-page batches via CLI
        batch_size = 50
        for batch_start in range(start, end, batch_size):
            batch_end = min(batch_start + batch_size - 1, end - 1)

            result = subprocess.run(
                ["pdftotext", "-f", str(batch_start), "-l", str(batch_end),
                 str(path), "-"],
                capture_output=True, timeout=60
            )
            raw = result.stdout.decode("utf-8", errors="ignore")
            text = clean(raw)

            if stype == "operational":
                for chunk in operational_chunks(
                    text, "Siemens Sinumerik 840D Diagnostics Manual",
                    ["cnc_siemens_01"], "Siemens Sinumerik 840D", section_name
                ):
                    chunks.append(chunk)
                continue

            # Parse alarm entries from combined buffer + new text
            combined = carry_buffer + "\n" + text
            matches = list(SIEMENS_SINGLE.finditer(combined))

            if not matches:
                carry_buffer = combined[-600:]
                continue

            for match in matches[:-1]:
                code = match.group(1)
                body = match.group(2).strip()
                if len(body) < 40 or body.count("\n") < 2:
                    continue
                t = f"Alarm {code}\n\n{body[:1000]}"
                chunks.append(make_chunk(
                    t, "Siemens Sinumerik 840D Diagnostics Manual",
                    ["cnc_siemens_01"], "Siemens Sinumerik 840D",
                    section_name, "alarm", native_code=code
                ))

            last = matches[-1]
            carry_buffer = combined[last.start():][:800]

    # Flush carry
    for match in SIEMENS_SINGLE.finditer(carry_buffer):
        code = match.group(1)
        body = match.group(2).strip()
        if len(body) >= 40:
            t = f"Alarm {code}\n\n{body[:1000]}"
            chunks.append(make_chunk(
                t, "Siemens Sinumerik 840D Diagnostics Manual",
                ["cnc_siemens_01"], "Siemens Sinumerik 840D",
                "PLC Alarms", "alarm", native_code=code
            ))

    print(f"    → {len(chunks)} chunks")
    return chunks

# ─── HAAS VF SERIES ───────────────────────────────────────────────────────────

HAAS_ALARM_PATTERN = re.compile(
    r'(?:ALARM\s+)?(\d{2,4})[:\s]+([A-Z][^\n]{5,})\n(.*?)(?=(?:ALARM\s+)?\d{2,4}[:\s]+[A-Z]|\Z)',
    re.DOTALL
)

def chunk_haas(path):
    print(f"  Processing Haas VF ({path.name})...")
    chunks = []
    pages_text = extract_pdf_text(path)

    # Identify alarm section pages (search for "ALARM" heavy pages)
    alarm_pages = []
    operational_pages = []

    for page_num, text in pages_text:
        alarm_count = len(re.findall(r'\bALARM\b', text, re.IGNORECASE))
        if alarm_count > 5:
            alarm_pages.append((page_num, text))
        else:
            operational_pages.append((page_num, text))

    # Process alarm pages
    alarm_text = "\n".join(t for _, t in alarm_pages)
    alarm_text = clean(alarm_text)

    seen_codes = set()
    for match in HAAS_ALARM_PATTERN.finditer(alarm_text):
        code  = match.group(1).strip()
        title = match.group(2).strip()
        body  = match.group(3).strip()

        if code in seen_codes or len(body) < 20:
            continue
        seen_codes.add(code)

        text = f"Alarm {code}: {title}\n\n{body}"
        chunks.append(make_chunk(
            text, "Haas VF-Series Service Manual",
            ["cnc_haas_01", "cnc_haas_02"],
            "Haas NGC",
            "Alarm Messages", "alarm",
            native_code=code
        ))

    # Operational pages — mechanical service, troubleshooting
    for page_num, text in operational_pages:
        if len(text.strip()) < 100:
            continue
        for chunk in operational_chunks(
            text, "Haas VF-Series Service Manual",
            ["cnc_haas_01", "cnc_haas_02"],
            "Haas NGC", "Mechanical Service"
        ):
            chunk["page"] = page_num
            chunks.append(chunk)

    print(f"    → {len(chunks)} chunks")
    return chunks

# ─── MAZAK ────────────────────────────────────────────────────────────────────

def chunk_mazak(maint_path, oper_path):
    print(f"  Processing Mazak manuals...")
    chunks = []

    for path, label in [(maint_path, "Maintenance"), (oper_path, "Operating")]:
        pages_text = extract_pdf_text(path)
        for page_num, text in pages_text:
            text = clean(text)
            if len(text.strip()) < 80:
                continue

            # Detect alarm list pages
            alarm_count = len(re.findall(r'\b(?:alarm|error|fault)\b', text, re.IGNORECASE))
            section = "Alarm List" if alarm_count > 4 else f"{label} Manual"
            stype   = "alarm"     if alarm_count > 4 else "operational"

            # Try to extract individual alarm entries on alarm pages
            if stype == "alarm":
                alarm_entries = re.findall(
                    r'(\d{3,4})\s+([A-Z][^\n]{5,})\n((?:(?!\d{3,4}\s+[A-Z]).)+)',
                    text, re.DOTALL
                )
                if alarm_entries:
                    for code, title, body in alarm_entries:
                        body = body.strip()
                        if len(body) < 15:
                            continue
                        t = f"Alarm {code}: {title}\n\n{body}"
                        chunks.append(make_chunk(
                            t, f"Mazak VTC {label} Manual",
                            ["cnc_mazak_01", "cnc_mazak_02"],
                            "Mazatrol", "Alarm List", "alarm",
                            native_code=code, page=page_num
                        ))
                    continue

            # Operational chunking
            for chunk in operational_chunks(
                text, f"Mazak VTC {label} Manual",
                ["cnc_mazak_01", "cnc_mazak_02"],
                "Mazatrol", section
            ):
                chunk["page"] = page_num
                chunk["sectionType"] = stype
                chunks.append(chunk)

    print(f"    → {len(chunks)} chunks")
    return chunks

# ─── FANUC ────────────────────────────────────────────────────────────────────

FANUC_ALARM_PATTERN = re.compile(
    r'((?:PS|SV|SP|OT|OH|DS|SR|SW|IO|PW)\s*\d{4})\s*([^\n]{5,})\n(.*?)(?=(?:PS|SV|SP|OT|OH|DS|SR|SW|IO|PW)\s*\d{4}|\Z)',
    re.DOTALL
)

def chunk_fanuc(maint_path, oper_path):
    print(f"  Processing Fanuc manuals...")
    chunks = []

    for path, label in [(maint_path, "Maintenance"), (oper_path, "Operators")]:
        text = Path(path).read_text(encoding='utf-8', errors='ignore')
        text = clean(text)

        # Extract alarm entries
        seen_codes = set()
        for match in FANUC_ALARM_PATTERN.finditer(text):
            code  = re.sub(r'\s+', '', match.group(1))  # normalise e.g. "SV 0401" -> "SV0401"
            title = match.group(2).strip()
            body  = match.group(3).strip()[:800]  # cap body length

            if code in seen_codes or len(body) < 15:
                continue
            seen_codes.add(code)

            t = f"{code} {title}\n\n{body}"
            chunks.append(make_chunk(
                t, f"Fanuc Series 31i {label} Manual",
                ["cnc_fanuc_01", "cnc_fanuc_02"],
                "Fanuc 31i",
                "Alarm List", "alarm",
                native_code=code
            ))

        # Operational chunks — split text into 500-char blocks
        # Skip sections that are pure alarm lists
        non_alarm_text = re.sub(
            r'(?:PS|SV|SP|OT|OH|DS|SR|SW|IO|PW)\s*\d{4}.*?(?=(?:PS|SV|SP|OT|OH|DS|SR|SW|IO|PW)\s*\d{4}|\Z)',
            '', text, flags=re.DOTALL
        )
        for chunk in operational_chunks(
            non_alarm_text,
            f"Fanuc Series 31i {label} Manual",
            ["cnc_fanuc_01", "cnc_fanuc_02"],
            "Fanuc 31i", f"{label} Procedures"
        ):
            chunks.append(chunk)

    print(f"    → {len(chunks)} chunks")
    return chunks

# ─── MAIN ────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    all_chunks = []

    print("Chunking Bosch Rexroth IndraDrive...")
    all_chunks += chunk_rexroth(MANUALS / "767614.pdf")

    print("Chunking Siemens Sinumerik 840D...")
    all_chunks += chunk_siemens(MANUALS / "Diagnostics Manual, Alarms - DAsl_0115_en_en-US.pdf")

    print("Chunking Haas VF Series...")
    all_chunks += chunk_haas(
        MANUALS / "English - VF Series Service Manual - 1996 - english---vf-series-service-manual---1996.pdf"
    )

    print("Chunking Mazak VTC manuals...")
    all_chunks += chunk_mazak(
        MANUALS / "67728d.pdf",
        MANUALS / "529e3a.pdf"
    )

    print("Chunking Fanuc 31i manuals...")
    all_chunks += chunk_fanuc(
        MANUALS / "786398117-B-63945EN-04-08.txt",
        MANUALS / "832025899-Fanuc-31i-Operators-Manual.txt"
    )

    # Stats
    alarm_chunks = [c for c in all_chunks if c["sectionType"] == "alarm"]
    oper_chunks  = [c for c in all_chunks if c["sectionType"] == "operational"]
    sources      = {}
    for c in all_chunks:
        sources[c["source"]] = sources.get(c["source"], 0) + 1

    print(f"\n{'='*50}")
    print(f"Total chunks:       {len(all_chunks)}")
    print(f"  Alarm chunks:     {len(alarm_chunks)}")
    print(f"  Operational:      {len(oper_chunks)}")
    print(f"\nPer source:")
    for src, count in sorted(sources.items(), key=lambda x: -x[1]):
        print(f"  {src[:55]}: {count}")

    # Sample
    sample = next((c for c in all_chunks if c.get("nativeCode") == "F3134"), all_chunks[0])
    print(f"\nSample chunk (F3134):")
    print(json.dumps({k: v for k, v in sample.items() if k != "embedding"}, indent=2)[:600])

    with open(OUTPUT, "w") as f:
        json.dump(all_chunks, f, indent=2, default=str)

    print(f"\nSaved to {OUTPUT}")
    print(f"\nNext step: run embed_chunks.py locally to add embeddings")
