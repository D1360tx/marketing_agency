# Google Maps Scraper

Free replacement for Apify's Google Maps scraper. Built with Playwright.

## Setup

```bash
cd workspace/tools/gmaps-scraper
playwright install chromium
```

## Usage

### Single query
```bash
python cli.py --query "HVAC contractors Austin TX" --limit 60
```

### With email + social enrichment
```bash
python cli.py --query "plumbers Houston TX" --limit 60 --enrich
```

### Batch from CSV
```bash
python cli.py --batch sample_batch.csv --limit 60 --enrich
```

### Push to Supabase
```bash
python cli.py --query "roofers Dallas TX" --limit 60 --enrich --supabase
```
> Requires `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in env

### All options
```
--query / -q     Search query (e.g. "HVAC Austin TX")
--batch / -b     CSV file with niche,city columns
--limit / -l     Max results per query (default: 60)
--enrich / -e    Visit websites for email + social links
--output / -o    Custom output CSV path
--supabase       Push to Supabase leads table
--visible        Show browser (debug mode)
--verbose / -v   Debug logging
```

## Batch CSV format

```csv
niche,city
HVAC contractors,Austin TX
plumbers,Houston TX
roofers,Dallas TX
```

## Output

Each run produces:
- `output/<query>_<timestamp>.csv`
- `output/<query>_<timestamp>.json`

Batch runs produce per-query files + a `_combined_<timestamp>.csv`

## Booked Out outbound cohort export

Turn any scraper CSV (including a combined batch file) into a deduped, scored,
pre-send-reviewed cohort without Supabase credentials or paid enrichment:

```bash
cd /path/to/trybookedout-launch
npm run outbound:build -- \
  --input tools/gmaps-scraper/output/_combined_<timestamp>.csv \
  --output /tmp/booked-out-ready.csv
```

The command writes:

- the requested CSV with only `qa_status=ready` rows;
- a sibling `*.hold.csv` containing rejected rows and deterministic
  `qa_reasons` for manual correction.

Rows are normalized and deduped by Maps URL, phone, email, named website host,
or name + address. The 100-point score is intentionally explainable:
`revenue_leakage` (45), `ability_to_pay` (35), and `contact_confidence` (20).
It assigns either `emerging_operator` or `established_under_optimized` and
holds rows with no valid email, inadequate identity, or score below 45. This is
a file-only QA/export step; it does not send outreach or write to Supabase.

Run its focused tests with:

```bash
npm run test:outbound
```

## Data fields

| Field | Source |
|-------|--------|
| name | Google Maps |
| category | Google Maps |
| address | Google Maps |
| phone | Google Maps |
| website | Google Maps |
| rating | Google Maps |
| review_count | Google Maps |
| hours | Google Maps |
| owner_name | Google Maps |
| maps_url | Google Maps |
| email | Website (--enrich) |
| facebook | Website (--enrich) |
| instagram | Website (--enrich) |
| linkedin | Website (--enrich) |
| twitter | Website (--enrich) |
| yelp | Website (--enrich) |
| tiktok | Website (--enrich) |

## Notes

- Default 60 results/query — sweet spot for quality. Beyond ~80, Google pads with low-relevance results.
- Enrichment adds ~20-40s per business (website visit). Budget ~30-60 min for 60 enriched results.
- For fast scrapes without enrichment: ~5-10 min per 60 results.
- Uses chromium headless — no GUI required, runs on any server/WSL.
