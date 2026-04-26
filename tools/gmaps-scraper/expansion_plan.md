# Scraper Expansion Plan

## Current Coverage (Done ✅)
**Cities:** Austin, Wimberley, Dripping Springs, Bastrop, Lockhart
**Niches:** HVAC contractors, plumbers, roofers, electricians, landscaping companies
**Total:** ~2,348 businesses imported into AgencyFlow

---

## Phase 2 — More Niches (same cities, new services)
Run these niches across all 5 existing cities first:
- general contractors
- painters
- pool companies
- pressure washing
- tree service
- window and door companies
- fence companies
- pest control
- garage door

**Estimated:** 9 niches × 5 cities = 45 queries → up to ~2,700 new businesses

---

## Phase 3 — More Cities (all niches)
Expand geographically once Phase 2 is done:
- Kyle, TX
- Buda, TX
- San Marcos, TX
- Cedar Park, TX
- Round Rock, TX
- Georgetown, TX
- Pflugerville, TX
- New Braunfels, TX
- Marble Falls, TX
- Leander, TX

**Estimated:** 10 cities × 14 niches = 140 queries → up to ~8,400 new businesses

---

## When Ready
Generate batch CSV:
```bash
cd ~/.openclaw/workspace/tools/gmaps-scraper
python3 cli.py --batch <new_batch.csv> --limit 60 --enrich
```
Then run import:
```bash
SUPABASE_SERVICE_ROLE_KEY=<key> python3 import_to_supabase.py
```
