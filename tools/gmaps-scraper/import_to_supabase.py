#!/usr/bin/env python3
"""
Bulk import all scraped CSV files into AgencyFlow's prospects table.
Maps scraper fields → prospects schema. Deduplicates on phone.
"""

import csv
import json
import os
import re
import sys
from pathlib import Path

import requests

SUPABASE_URL = "https://pjggltqecxhypjisfpvn.supabase.co"
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
USER_ID = "8337f5a8-dd50-43c5-8f35-b32e2180492d"
OUTPUT_DIR = Path(__file__).parent / "output"

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates",
}

CITY_STATE_RE = re.compile(r"(.+?)[\s_]+(tx|texas)$", re.IGNORECASE)


def parse_city_state(filename: str):
    """Extract city + state from filename like hvac_contractors_dripping_springs_tx"""
    name = Path(filename).stem  # remove .csv
    # Strip niche prefix — find _tx suffix
    parts = name.split("_")
    # Find 'tx' at end
    if parts[-1].lower() == "tx":
        # City is everything between niche and tx
        # Niche could be 1-3 words — heuristic: find where niche ends
        # We'll just grab last 2-3 parts before 'tx' as city
        city_parts = []
        for p in reversed(parts[:-1]):
            if p.lower() in ("contractors", "companies", "hvac", "plumbers", "roofers", "electricians", "landscaping"):
                break
            city_parts.insert(0, p)
        city = " ".join(city_parts).title()
        return city, "TX"
    return "", "TX"


def load_csv(filepath: Path) -> list[dict]:
    rows = []
    with open(filepath, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows


def map_row(row: dict, filename: str, search_query: str) -> dict:
    city, state = parse_city_state(filename)

    # Parse rating safely
    try:
        rating = float(row.get("rating") or 0) or None
    except (ValueError, TypeError):
        rating = None

    # Parse review_count safely
    try:
        review_count = int(row.get("review_count") or 0) or None
    except (ValueError, TypeError):
        review_count = None

    return {
        "user_id": USER_ID,
        "business_name": (row.get("name") or "").strip(),
        "address": (row.get("address") or "").strip() or None,
        "city": city or None,
        "state": state,
        "phone": (row.get("phone") or "").strip() or None,
        "email": (row.get("email") or "").strip() or None,
        "website_url": (row.get("website") or "").strip() or None,
        "google_maps_url": (row.get("maps_url") or row.get("google_maps_url") or "").strip() or None,
        "rating": rating,
        "review_count": review_count,
        "business_type": (row.get("category") or "").strip() or None,
        "search_query": search_query,
        "status": "new",
    }


def upsert_batch(rows: list[dict]) -> dict:
    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/prospects",
        headers={**HEADERS, "Prefer": "resolution=ignore-duplicates,return=minimal"},
        json=rows,
        timeout=30,
    )
    return {"status": resp.status_code, "text": resp.text[:200] if resp.status_code >= 400 else "ok"}


def main():
    if not SERVICE_KEY:
        print("ERROR: SUPABASE_SERVICE_ROLE_KEY not set")
        sys.exit(1)

    csv_files = sorted(OUTPUT_DIR.rglob("*.csv"))
    csv_files = [f for f in csv_files if not f.name.startswith("_combined")]

    total_imported = 0
    total_skipped = 0
    errors = []

    print(f"Found {len(csv_files)} CSV files to import\n")

    for csv_file in csv_files:
        rows = load_csv(csv_file)
        if not rows:
            continue

        # Derive search query from filename
        stem = csv_file.stem.replace("_", " ")
        search_query = stem

        mapped = []
        for row in rows:
            name = (row.get("name") or "").strip()
            if not name:
                total_skipped += 1
                continue
            mapped.append(map_row(row, csv_file.name, search_query))

        if not mapped:
            continue

        # Upsert in chunks of 100
        for i in range(0, len(mapped), 100):
            chunk = mapped[i:i+100]
            result = upsert_batch(chunk)
            if result["status"] >= 400:
                errors.append(f"{csv_file.name}: {result['text']}")
                print(f"  ❌ {csv_file.name} (chunk {i//100+1}): {result['text']}")
            else:
                total_imported += len(chunk)

        print(f"  ✅ {csv_file.name}: {len(mapped)} rows")

    print(f"\n{'='*50}")
    print(f"Total imported : {total_imported}")
    print(f"Total skipped  : {total_skipped}")
    if errors:
        print(f"Errors         : {len(errors)}")
        for e in errors:
            print(f"  - {e}")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
