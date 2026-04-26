#!/usr/bin/env python3
"""
AgencyFlow Google Maps Scraper Daemon

Polls Supabase for pending scrape_jobs and processes them sequentially.
Runs on the ThinkPad alongside the Playwright scraper.

Usage:
  python daemon.py

Env vars (or read from .env.local):
  SUPABASE_URL              - Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY - Service role key (bypasses RLS)
"""

import json
import logging
import os
import signal
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger("scrape-daemon")

# ---------------------------------------------------------------------------
# Env loading — reads from process env first, then .env.local as fallback
# ---------------------------------------------------------------------------
ENV_FILE = Path(__file__).parent.parent.parent / "marketing_agency" / ".env.local"


def load_env():
    env = {}
    if ENV_FILE.exists():
        with open(ENV_FILE) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, _, val = line.partition("=")
                # Strip surrounding quotes if present
                val = val.strip().strip('"').strip("'").strip()
                # Remove literal \n that Vercel CLI appends
                val = val.replace("\\n", "").strip()
                env[key.strip()] = val
    return env


_file_env = load_env()


def get_env(key: str) -> str:
    val = os.environ.get(key) or _file_env.get(key) or ""
    return val.strip()


# ---------------------------------------------------------------------------
# Supabase REST client (no SDK needed — pure requests)
# ---------------------------------------------------------------------------
try:
    import requests
except ImportError:
    logger.error("'requests' package not found. Install with: pip install requests")
    sys.exit(1)


class SupabaseClient:
    def __init__(self, url: str, service_role_key: str):
        self.url = url.rstrip("/")
        self.headers = {
            "apikey": service_role_key,
            "Authorization": f"Bearer {service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    def select(self, table: str, columns: str = "*", filters: dict | None = None) -> list:
        params = {"select": columns}
        if filters:
            params.update(filters)
        r = requests.get(
            f"{self.url}/rest/v1/{table}",
            headers=self.headers,
            params=params,
            timeout=15,
        )
        r.raise_for_status()
        return r.json()

    def update(self, table: str, match: dict, data: dict) -> list:
        params = {k: f"eq.{v}" for k, v in match.items()}
        r = requests.patch(
            f"{self.url}/rest/v1/{table}",
            headers=self.headers,
            params=params,
            json=data,
            timeout=15,
        )
        r.raise_for_status()
        return r.json()


# ---------------------------------------------------------------------------
# Scraper import
# ---------------------------------------------------------------------------
sys.path.insert(0, str(Path(__file__).parent))
try:
    from scraper import GoogleMapsScraper
except ImportError as e:
    logger.error(f"Could not import GoogleMapsScraper: {e}")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Graceful shutdown
# ---------------------------------------------------------------------------
_shutdown = False


def _handle_signal(sig, _frame):
    global _shutdown
    logger.info(f"Received signal {sig}, shutting down after current job...")
    _shutdown = True


signal.signal(signal.SIGTERM, _handle_signal)
signal.signal(signal.SIGINT, _handle_signal)

# ---------------------------------------------------------------------------
# Core logic
# ---------------------------------------------------------------------------
POLL_INTERVAL = 30  # seconds


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def claim_job(db: SupabaseClient) -> dict | None:
    """Fetch oldest pending job and atomically set it to 'processing'."""
    rows = db.select(
        "scrape_jobs",
        columns="id,query,niche,city,limit_count,enrich",
        filters={
            "status": "eq.pending",
            "order": "created_at.asc",
            "limit": "1",
        },
    )
    if not rows:
        return None

    job = rows[0]
    job_id = job["id"]

    # Claim it — only update if still pending (lightweight optimistic lock)
    db.update(
        "scrape_jobs",
        match={"id": job_id, "status": "pending"},
        data={"status": "processing", "started_at": now_iso()},
    )

    # Re-fetch to verify we got it
    updated = db.select(
        "scrape_jobs",
        columns="id,status,query,niche,city,limit_count,enrich",
        filters={"id": f"eq.{job_id}"},
    )
    if not updated or updated[0].get("status") != "processing":
        logger.warning(f"Job {job_id} was claimed by another worker, skipping")
        return None

    return updated[0]


def process_job(db: SupabaseClient, job: dict):
    job_id = job["id"]
    query = job["query"]
    limit = job.get("limit_count") or 60
    enrich = job.get("enrich", True)

    logger.info(f"[Job {job_id[:8]}] Starting: '{query}' limit={limit} enrich={enrich}")

    try:
        with GoogleMapsScraper(headless=True) as scraper:
            businesses = scraper.scrape(query=query, limit=limit, enrich=bool(enrich))

        results = [b.to_dict() for b in businesses]
        logger.info(f"[Job {job_id[:8]}] Scraped {len(results)} businesses")

        db.update(
            "scrape_jobs",
            match={"id": job_id},
            data={
                "status": "completed",
                "results": results,
                "result_count": len(results),
                "completed_at": now_iso(),
                "error_message": None,
            },
        )
        logger.info(f"[Job {job_id[:8]}] Done ✓")

    except Exception as exc:  # noqa: BLE001
        error_msg = str(exc)[:500]
        logger.error(f"[Job {job_id[:8]}] Failed: {error_msg}")
        db.update(
            "scrape_jobs",
            match={"id": job_id},
            data={
                "status": "failed",
                "error_message": error_msg,
                "completed_at": now_iso(),
            },
        )


def run():
    supabase_url = get_env("SUPABASE_URL") or get_env("NEXT_PUBLIC_SUPABASE_URL")
    service_key = get_env("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not service_key:
        logger.error(
            "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. "
            f"Checked process env and {ENV_FILE}"
        )
        sys.exit(1)

    logger.info(f"Daemon started. Supabase: {supabase_url}")
    logger.info(f"Poll interval: {POLL_INTERVAL}s")

    db = SupabaseClient(supabase_url, service_key)

    while not _shutdown:
        try:
            job = claim_job(db)
            if job:
                process_job(db, job)
            else:
                logger.debug("No pending jobs. Sleeping...")
        except Exception as exc:  # noqa: BLE001
            logger.error(f"Poll error: {exc}")

        # Sleep in 1s chunks so we catch shutdown signals promptly
        for _ in range(POLL_INTERVAL):
            if _shutdown:
                break
            time.sleep(1)

    logger.info("Daemon stopped.")


if __name__ == "__main__":
    run()
