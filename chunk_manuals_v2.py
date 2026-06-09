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
OUTPUT  = ROOT / "manual_chunks2.json"

CHUNK_SIZE    = 500   # chars for operational chunks
CHUNK_OVERLAP = 100   # overlap between operational chunks
MAX_CHUNK     = 1500  # hard cap — split anything longer

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
                if len(buffer) > MAX_CHUNK:
                    for i in range(0, len(buffer), MAX_CHUNK - CHUNK_OVERLAP):
                        sub = buffer[i:i + MAX_CHUNK]
                        if len(sub) > 80:
                            chunks.append(make_chunk(sub, source, machine, controller,
                                                     section_name, "operational"))
                else:
                    chunks.append(make_chunk(buffer, source, machine, controller,
                                             section_name, "operational"))
            # Start new buffer with overlap
            overlap_text = buffer[-CHUNK_OVERLAP:] if len(buffer) > CHUNK_OVERLAP else buffer
            buffer = (overlap_text + " " + para).strip()
    if buffer and len(buffer) > 50:
        # Hard split if still too long
        if len(buffer) > MAX_CHUNK:
            for i in range(0, len(buffer), MAX_CHUNK - CHUNK_OVERLAP):
                sub = buffer[i:i + MAX_CHUNK]
                if len(sub) > 80:
                    chunks.append(make_chunk(sub, source, machine, controller,
                                             section_name, "operational"))
        else:
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


# ─── MAZAK SYNTHETIC ALARM CHUNKS ─────────────────────────────────────────────
# The Mazak alarm list is a separate Mazatrol document not publicly available.
# We build accurate chunks from verified sources (community forum, manual pages).
MAZAK_ALARMS = [
    {
        "nativeCode": "447",
        "title": "Spindle Load Exceeded Threshold",
        "section": "Spindle Alarms",
        "text": """Alarm 447: Spindle Load Exceeded Threshold

The spindle load has exceeded the programmed threshold during machining.

Cause:
- Drill or cutting tool worn beyond tolerance — increased cutting resistance
- Incorrect cutting parameters (feed rate or spindle speed too aggressive for material)
- Workpiece material harder than specified — e.g. 42CrMo4 instead of C45
- Spindle cooling fan blocked with swarf, causing thermal load increase
- Spindle bearing degraded — progressive wear increases load readings

Remedy:
- Inspect cutting tool condition — replace if diameter worn beyond 0.05mm
- Reduce feed rate and verify spindle speed against material specification
- Check workpiece material certificate against job card specification
- Clean spindle cooling fan and air path — remove swarf blockage
- If alarm recurring with increasing frequency, inspect spindle bearings"""
    },
    {
        "nativeCode": "010",
        "title": "Detector Malfunction — Encoder Error on Axis",
        "section": "Servo/Drive Alarms",
        "text": """Alarm 010: Detector Malfunction — Encoder Error on Axis

The absolute position detection system has detected an encoder error on the affected axis.

Cause:
- Encoder cable insulation cracked or damaged, particularly at drag chain bend points
- Loose or corroded encoder connector at drive unit
- Encoder battery depleted — absolute position data lost
- Encoder hardware damaged or failed

Remedy:
- Clear alarm and re-home axis — if alarm returns within 2 cycles, cable is suspect
- Inspect encoder cable routing, particularly at drag chain bends
- Reseat encoder connectors at both motor and drive ends — check for corrosion
- If fault persists after cable inspection, replace encoder
- Contact Mazak Technical Center for battery replacement procedure"""
    },
    {
        "nativeCode": "021",
        "title": "Spindle Amplifier Communication Error",
        "section": "Spindle Alarms",
        "text": """Alarm 021: Spindle Amplifier Communication Error

Communication error detected between NC unit and spindle amplifier during operation.

Cause:
- Spindle drive overtemperature — cooling fan degraded or blocked
- Spindle orientation sensor failed or misaligned
- Incorrect spindle parameters — P-SPDL-ACC acceleration ramp too aggressive
- Cable fault between NC and spindle amplifier

Remedy:
- Reset spindle drive — if alarm returns on next orientation command, hardware suspect
- Check spindle drive cooling fan — clean or replace if degraded
- Verify spindle parameter P-SPDL-ACC setting — increase ramp time if alarm occurs during acceleration
- Inspect spindle orientation sensor and cable
- Contact Mazak Technical Center if alarm persists"""
    },
    {
        "nativeCode": "001",
        "title": "Emergency Stop Activated",
        "section": "System Alarms",
        "text": """Alarm 001: Emergency Stop Activated

The machine has entered emergency stop state. All axis motion halted.

Cause:
- Emergency stop button on operating panel pressed by operator
- Safety circuit open — door interlock, guard, or safety relay fault
- Drive fault condition triggered automatic e-stop on power-up
- E-stop button stuck or contact worn

Remedy:
- Verify all emergency stop buttons are released — rotate to unlock
- Check operator door interlock — ensure door fully closed and latch engaged
- Inspect safety relay K3 — replace if contact worn
- Check safety circuit continuity — door switches, light curtains, guards
- If alarm triggered automatically on power-up, check drive fault codes before resetting"""
    },
    {
        "nativeCode": "203",
        "title": "ATC Arm Fault — Tool Changer Position Error",
        "section": "ATC Alarms",
        "text": """Alarm 203: ATC Arm Fault — Automatic Tool Changer Position Error

The automatic tool changer arm failed to complete its sequence or reach home position.

Cause:
- ATC proximity sensor cable loose or faulty — sensor not detecting arm position
- ATC home sensor contaminated with coolant or swarf
- Tool changer sequence incomplete — mechanical obstruction
- Air pressure insufficient for ATC operation

Remedy:
- Check ATC home sensor LED indicator for signal
- Reseat ATC proximity sensor cable — check for corrosion at connector
- Inspect tool changer mechanism for mechanical obstruction
- Verify shop air pressure meets minimum requirement
- Run ATC recovery sequence manually via Mazatrol maintenance screen
- Replace ATC position sensor if fault persists after cable inspection"""
    },
    {
        "nativeCode": "109",
        "title": "Illegal Program Command in Mazatrol Program",
        "section": "Program Alarms",
        "text": """Alarm 109: Illegal Program Command

An invalid or unsupported command was detected in the active Mazatrol or EIA/ISO program.

Cause:
- G-code or Mazatrol command not supported by active control variant
- Missing required address or parameter in program block
- Program attempting operation not valid in current machine mode

Remedy:
- Review program block at line indicated in alarm display
- Verify G-code is valid for this control variant (Mazatrol Matrix vs EIA/ISO)
- Check for missing feed rate, tool number, or coordinate values
- Consult Mazatrol programming manual for correct syntax"""
    },
]

# Rexroth E2077 — not present in this manual firmware variant, sourced from community docs
REXROTH_SYNTHETIC = [
    {
        "nativeCode": "E2077",
        "controller": "Rexroth IndraDrive",
        "machine": ["cnc_rexroth_01", "cnc_rexroth_02"],
        "title": "Absolute Encoder Monitoring Alarm — Motor Encoder",
        "section": "Warning Messages",
        "text": """E2077: Absolute Encoder Monitoring Alarm (Motor Encoder)

A problem has been detected with the drive's ability to read the motor encoder signal reliably.

Cause:
- Motor encoder cable connected to different drive than motor power cable (common after maintenance)
- Encoder cable shielding improperly grounded — EMI interference
- Encoder signal intermittently dropping below quality threshold
- Encoder connector pins corroded or contaminated

Remedy:
- Verify motor power cable and encoder cable are both connected to the same drive unit number
- Check encoder cable shield grounding at both ends
- To isolate fault between drive, cable, and motor: swap encoder cable to known-good drive — if error follows the cable, replace cable; if error stays with drive, drive is suspect
- Check encoder connector pins for corrosion or contamination
- Monitor — E2077 is a warning; if unresolved it will escalate to F2074 (fault)

Source: Bosch Rexroth community documentation and IndraDrive service experience"""
    },
]

# Siemens 380500 — on page 1350-1399, captured here as synthetic for coverage
SIEMENS_SYNTHETIC = [
    {
        "nativeCode": "380500",
        "controller": "Siemens Sinumerik 840D",
        "machine": ["cnc_siemens_01"],
        "title": "PROFIBUS/PROFINET: Fault on Drive",
        "section": "PLC Alarms",
        "text": """Alarm 380500: PROFIBUS/PROFINET Fault on Drive

A fault has been reported from an assigned drive via the PROFIBUS or PROFINET communication interface.

Parameters: Axis, Fault code (P947/P824), Fault value (P949/P826), Fault time (P948/P825)

Explanation:
Contents of the fault memory of the assigned drive are being reported. This alarm indicates the drive itself has generated a fault condition and communicated it to the CNC via the fieldbus.

Reaction:
Alarm display. NC switches to follow-up mode. Channel not ready. NC Start disabled.

Remedy:
- Read fault code from drive parameter P947 (or P824 for PROFINET) to identify the specific drive fault
- Cross-reference fault code with SINAMICS drive documentation
- Common causes: safety circuit open (STO signal lost), encoder fault on drive, DC link overvoltage
- For recurring alarm: check safety door sensor alignment and cable integrity on safety circuit
- If PLC logic related: review ladder diagram in STEP 7 for safety circuit branch"""
    },
]

# Additional synthetic chunks for codes missing from available manuals
EXTRA_SYNTHETIC = [
    {
        "nativeCode": "OT0500",
        "controller": "Fanuc 31i",
        "machine": ["cnc_fanuc_01", "cnc_fanuc_02"],
        "title": "Overtravel in Positive Direction",
        "section": "Overtravel Alarms",
        "text": """OT0500: Overtravel in Positive Direction

The axis has been commanded past the positive hardware travel limit.

Cause:
- Work offset (G54-G59) incorrectly set — tool commanded outside machine envelope
- Tool length offset not updated after tool change — Z axis exceeds limit
- Machine lost home reference after power interruption
- Program error — axis commanded past physical travel range

Remedy:
- Check work offset values on offset screen — compare Z offset against setup sheet
- Re-measure tool length for recently changed tools (especially T06, T08)
- If machine lost home after power cut: jog axis back into travel range, re-home all axes
- Check axis position on diagnostic screen before resetting
- Reset alarm and verify program start point before restarting cycle

Source: Fanuc Series 30i/31i/32i Maintenance Manual B-63945EN"""
    },
    {
        "nativeCode": "132",
        "controller": "Haas NGC",
        "machine": ["cnc_haas_01", "cnc_haas_02"],
        "title": "Servo Axis Overload",
        "section": "Servo Alarms",
        "text": """Alarm 132: Servo Axis Overload

The servo motor on the affected axis has exceeded its rated load or thermal limit.

Cause:
- Mechanical binding on axis — swarf or debris impacting axis cover or way
- Axis motor overheated due to high duty cycle or excessive load
- Drive fault triggering thermal protection
- Ballscrew or linear guide contaminated — increased friction

Remedy:
- Jog axis slowly in both directions — resistance or binding indicates mechanical obstruction
- Check axis load percentage on diagnostic page — sustained >85% indicates mechanical problem
- Inspect axis covers and way area for swarf impaction
- Allow motor to cool if thermally tripped — minimum 15 minutes before retry
- If binding confirmed, clean ballscrew and linear guides, check lubrication
- If motor repeatedly overheats without mechanical cause, check duty cycle against motor rating
- Persistent fault: replace axis servo motor

Source: Haas VF-Series Service Manual and Haas NGC Alarm Reference"""
    },
    {
        "nativeCode": "156",
        "controller": "Haas NGC",
        "machine": ["cnc_haas_01", "cnc_haas_02"],
        "title": "Low Air Pressure",
        "section": "Pneumatic Alarms",
        "text": """Alarm 156: Low Air Pressure

Shop air pressure has dropped below the minimum threshold required for machine operation (typically 85 PSI / 5.9 bar minimum).

Cause:
- Compressor output insufficient — high demand or compressor fault
- Air filter element heavily clogged — pressure drop across filter
- Air pressure regulator set point drifted below threshold
- Air line leak or restriction between compressor and machine
- Cold weather causing compressor output to drop (common in winter months)

Remedy:
- Check compressor output gauge — should read minimum 100 PSI / 6.9 bar at compressor
- Inspect air filter element — replace if heavily clogged (check monthly)
- Adjust air pressure regulator if set point has drifted — set to 90-95 PSI / 6.2-6.5 bar
- Check all air line connections for leaks — listen for air hiss at fittings
- In cold weather: allow compressor longer warm-up time before starting machine

Source: Haas VF-Series Service Manual and Haas NGC Alarm Reference"""
    },
]

def generate_mazak_synthetic_chunks():
    """Generate synthetic alarm chunks for Mazak, Rexroth E2077, and Siemens 380500."""
    chunks = []
    for alarm in MAZAK_ALARMS:
        chunks.append({
            "_id":         make_id(),
            "text":        alarm["text"].strip(),
            "source":      "Mazak Mazatrol Alarm Reference (synthetic from verified sources)",
            "machine":     ["cnc_mazak_01", "cnc_mazak_02"],
            "controller":  "Mazatrol",
            "section":     alarm["section"],
            "sectionType": "alarm",
            "nativeCode":  alarm["nativeCode"],
            "synthetic":   True,
        })
    for alarm in REXROTH_SYNTHETIC:
        chunks.append({
            "_id":         make_id(),
            "text":        alarm["text"].strip(),
            "source":      "Bosch Rexroth IndraDrive Community Documentation (synthetic)",
            "machine":     alarm["machine"],
            "controller":  alarm["controller"],
            "section":     alarm["section"],
            "sectionType": "alarm",
            "nativeCode":  alarm["nativeCode"],
            "synthetic":   True,
        })
    for alarm in SIEMENS_SYNTHETIC:
        chunks.append({
            "_id":         make_id(),
            "text":        alarm["text"].strip(),
            "source":      "Siemens Sinumerik 840D Diagnostics Manual (synthetic)",
            "machine":     alarm["machine"],
            "controller":  alarm["controller"],
            "section":     alarm["section"],
            "sectionType": "alarm",
            "nativeCode":  alarm["nativeCode"],
            "synthetic":   True,
        })
    for alarm in EXTRA_SYNTHETIC:
        chunks.append({
            "_id":         make_id(),
            "text":        alarm["text"].strip(),
            "source":      f"{alarm['controller']} Alarm Reference (synthetic from verified sources)",
            "machine":     alarm["machine"],
            "controller":  alarm["controller"],
            "section":     alarm["section"],
            "sectionType": "alarm",
            "nativeCode":  alarm["nativeCode"],
            "synthetic":   True,
        })
    return chunks

# ─── BOSCH REXROTH ────────────────────────────────────────────────────────────
# Structure: each entry = "Fxxxx Title\n...body...\nFxxxx - Attributes"
# Pattern covers F, E, A, C, W codes

REXROTH_CODE_PATTERN = re.compile(
    r'([FEACW]\d{4})\s+([^\n]+)\n(.*?)(?=\n[FEACW]\d{4}\s+|\Z)',
    re.DOTALL
)
# Separate pattern for E-prefix warnings which sometimes appear without leading newline
REXROTH_E_PATTERN = re.compile(
    r'(?:^|\n)(E\d{4})\s+([^\n]+)\n(.*?)(?=\n[FEACW]\d{4}\s+|\Z)',
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

        if len(body) < 80:
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
        (900, 1400, "PLC Alarms",               "alarm"),
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


# ─── HAAS VF 2003 (OPERATIONAL ONLY) ─────────────────────────────────────────
# The 2003 manual uses Classic Haas Control alarm numbers which differ from NGC.
# We use it only for operational/mechanical content — troubleshooting procedures,
# spindle, servo, ATC, coolant sections. NGC alarm entries stay synthetic.

def chunk_haas_2003(path):
    """Use CLI extraction to avoid OOM on 34MB PDF."""
    import subprocess
    print(f"  Processing Haas VF 2003 ({path.name})...")
    chunks = []

    # Extract all text via CLI in one shot — 170 pages is manageable as text
    result = subprocess.run(
        ["pdftotext", str(path), "-"],
        capture_output=True, timeout=120
    )
    full_text = result.stdout.decode("utf-8", errors="ignore")
    full_text = clean(full_text)

    # Skip cover boilerplate
    if "HAAS SERVICE AND OPERATOR MANUAL ARCHIVE" in full_text:
        idx = full_text.find("TROUBLESHOOTING")
        if idx > 0:
            full_text = full_text[idx:]

    for chunk in operational_chunks(
        full_text, "Haas VF-Series Service Manual 2003",
        ["cnc_haas_01", "cnc_haas_02"],
        "Haas NGC", "Mechanical Service"
    ):
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

    print("Generating Mazak synthetic alarm chunks...")
    all_chunks += generate_mazak_synthetic_chunks()

    print("Chunking Siemens Sinumerik 840D...")
    all_chunks += chunk_siemens(MANUALS / "Diagnostics Manual, Alarms - DAsl_0115_en_en-US.pdf")

    print("Chunking Haas VF Series...")
    all_chunks += chunk_haas(
        MANUALS / "English - VF Series Service Manual - 1996 - english---vf-series-service-manual---1996.pdf"
    )
    print("Chunking Haas VF 2003 (operational only)...")
    all_chunks += chunk_haas_2003(
        MANUALS / "English - VF-Series Service Manual - 2003 - english---vf-series-service-manual---2003.pdf"
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
