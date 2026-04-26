#!/usr/bin/env python3
"""
Google Maps Scraper CLI
Usage:
  # Single query
  python cli.py --query "HVAC contractors Austin TX" --limit 60

  # With website enrichment (email + social links)
  python cli.py --query "plumbers Houston TX" --limit 60 --enrich

  # Batch from CSV (columns: niche,city)
  python cli.py --batch combos.csv --limit 60 --enrich

  # Save to specific output file
  python cli.py --query "roofers Dallas TX" --output results/roofers_dallas.csv
"""

import argparse
import csv
import json
import logging
import os
import sys
from datetime import datetime
from pathlib import Path

# Add parent dir to path if needed
sys.path.insert(0, str(Path(__file__).parent))
from scraper import GoogleMapsScraper

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


def save_csv(businesses: list, output_path: str):
    if not businesses:
        logger.warning("No businesses to save")
        return
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    fields = list(businesses[0].to_dict().keys())
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for biz in businesses:
            writer.writerow(biz.to_dict())
    logger.info(f"Saved {len(businesses)} rows → {output_path}")


def save_json(businesses: list, output_path: str):
    if not businesses:
        return
    json_path = output_path.replace(".csv", ".json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump([b.to_dict() for b in businesses], f, indent=2, ensure_ascii=False)
    logger.info(f"Saved JSON → {json_path}")


def load_batch_csv(path: str) -> list[dict]:
    """Load niche,city combos from CSV."""
    combos = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            niche = (row.get("niche") or row.get("Niche") or "").strip()
            city = (row.get("city") or row.get("City") or "").strip()
            if niche and city:
                combos.append({"niche": niche, "city": city, "query": f"{niche} {city}"})
            elif niche:
                combos.append({"niche": niche, "city": "", "query": niche})
    return combos


def make_output_path(query: str, output_dir: str = "output") -> str:
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe = query.lower().replace(" ", "_").replace("/", "_")[:60]
    return str(Path(__file__).parent / output_dir / f"{safe}_{ts}.csv")


def push_to_supabase(businesses: list, query: str):
    """Optional: push results to Supabase leads table."""
    try:
        import os
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")
        if not url or not key:
            logger.warning("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — skipping Supabase push")
            return

        from supabase import create_client
        client = create_client(url, key)

        rows = []
        for biz in businesses:
            d = biz.to_dict()
            rows.append({
                "business_name": d["name"],
                "category": d["category"],
                "address": d["address"],
                "phone": d["phone"],
                "website": d["website"],
                "email": d["email"],
                "rating": d["rating"],
                "review_count": d["review_count"],
                "hours": d["hours"],
                "owner_name": d["owner_name"],
                "facebook": d["facebook"],
                "instagram": d["instagram"],
                "linkedin": d["linkedin"],
                "twitter": d["twitter"],
                "yelp": d["yelp"],
                "maps_url": d["maps_url"],
                "source": "gmaps-scraper",
                "search_query": query,
            })

        result = client.table("leads").upsert(rows, on_conflict="phone").execute()
        logger.info(f"Pushed {len(rows)} leads to Supabase")
    except ImportError:
        logger.warning("supabase-py not installed — skipping Supabase push. Run: pip install supabase")
    except Exception as e:
        logger.error(f"Supabase push failed: {e}")


def run_single(query: str, limit: int, enrich: bool, output: str, supabase: bool):
    logger.info(f"Starting scrape: '{query}'")
    with GoogleMapsScraper(headless=True) as s:
        businesses = s.scrape(query, limit=limit, enrich=enrich)

    if not businesses:
        logger.warning("No results found")
        return []

    save_csv(businesses, output)
    save_json(businesses, output)

    if supabase:
        push_to_supabase(businesses, query)

    print_summary(businesses, query)
    return businesses


def print_summary(businesses: list, query: str):
    total = len(businesses)
    with_phone = sum(1 for b in businesses if b.phone)
    with_website = sum(1 for b in businesses if b.website)
    with_email = sum(1 for b in businesses if b.email)
    with_social = sum(1 for b in businesses if any([b.facebook, b.instagram, b.linkedin, b.twitter]))

    print(f"\n{'='*50}")
    print(f"Results for: {query}")
    print(f"{'='*50}")
    print(f"Total businesses : {total}")
    print(f"Has phone        : {with_phone} ({with_phone*100//total if total else 0}%)")
    print(f"Has website      : {with_website} ({with_website*100//total if total else 0}%)")
    print(f"Has email        : {with_email} ({with_email*100//total if total else 0}%)")
    print(f"Has social links : {with_social} ({with_social*100//total if total else 0}%)")
    print(f"{'='*50}\n")


def main():
    parser = argparse.ArgumentParser(
        description="Google Maps Scraper — free Apify replacement",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )

    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--query", "-q", type=str, help='Search query e.g. "HVAC contractors Austin TX"')
    mode.add_argument("--batch", "-b", type=str, help="CSV file with niche,city columns")

    parser.add_argument("--limit", "-l", type=int, default=60, help="Max results per query (default: 60)")
    parser.add_argument("--enrich", "-e", action="store_true", default=True, help="Visit websites to extract email + social links (default: on)")
    parser.add_argument("--no-enrich", dest="enrich", action="store_false", help="Skip website enrichment (faster, Maps data only)")
    parser.add_argument("--output", "-o", type=str, default=None, help="Output CSV path (auto-generated if not set)")
    parser.add_argument("--supabase", action="store_true", help="Push results to Supabase leads table")
    parser.add_argument("--visible", action="store_true", help="Show browser window (useful for debugging)")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose debug logging")

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    if args.query:
        output = args.output or make_output_path(args.query)
        run_single(args.query, args.limit, args.enrich, output, args.supabase)

    elif args.batch:
        if not Path(args.batch).exists():
            logger.error(f"Batch file not found: {args.batch}")
            sys.exit(1)

        combos = load_batch_csv(args.batch)
        logger.info(f"Loaded {len(combos)} queries from {args.batch}")

        all_results = []
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        batch_dir = Path(__file__).parent / "output" / f"batch_{ts}"
        batch_dir.mkdir(parents=True, exist_ok=True)

        # Use a fresh browser per query — prevents one crash from killing the whole batch
        for i, combo in enumerate(combos):
            query = combo["query"]
            logger.info(f"\n[{i+1}/{len(combos)}] {query}")
            try:
                with GoogleMapsScraper(headless=not args.visible) as s:
                    businesses = s.scrape(query, limit=args.limit, enrich=args.enrich)
                if businesses:
                    out_path = str(batch_dir / f"{combo['niche'].lower().replace(' ','_')}_{combo['city'].lower().replace(' ','_')}.csv")
                    save_csv(businesses, out_path)
                    save_json(businesses, out_path)
                    all_results.extend(businesses)
                    if args.supabase:
                        push_to_supabase(businesses, query)
                    print_summary(businesses, query)
            except Exception as e:
                logger.error(f"Failed on '{query}': {e}")
                continue

        # Combined output
        if all_results:
            combined_path = str(batch_dir / f"_combined_{ts}.csv")
            save_csv(all_results, combined_path)
            logger.info(f"\nTotal leads collected: {len(all_results)}")
            logger.info(f"Combined file: {combined_path}")


if __name__ == "__main__":
    main()
