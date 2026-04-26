# Booked Out — Outreach Tracker Setup Guide

## Step 1: Import the CSV

1. Go to [sheets.google.com](https://sheets.google.com)
2. File > Import > Upload > select `outreach-tracker.csv`
3. Import location: **Replace spreadsheet**
4. Separator type: **Comma**
5. Click **Import data**

---

## Step 2: Format the Header Row

1. Select Row 1
2. Bold it, set background to **dark blue (#1a237e)**, text color **white**
3. Freeze row 1: View > Freeze > 1 row

---

## Step 3: Set Column Widths (approximate)

| Column | Width |
|---|---|
| Business Name | 200 |
| Owner First/Last | 120 each |
| Phone | 130 |
| Email | 180 |
| Facebook URL | 180 |
| Industry | 140 |
| City | 120 |
| Channel | 140 |
| Status | 140 |
| Dates | 120 each |
| All notes columns | 200+ |

---

## Step 4: Add Dropdown Validation

### Industry (Column G)
1. Select column G (below header)
2. Data > Data validation > Dropdown
3. Options:
   - Landscaping / Lawn Care
   - Window Cleaning
   - HVAC
   - Pressure Washing
   - Painting
   - Plumbing
   - Pest Control
   - Pool Service
   - Other

### Channel (Column I)
- In-Person
- Cold Call
- Facebook DM
- Referral

### Status (Column J)
- New
- Contacted
- Follow-Up
- Warm
- Call Booked
- Not a Fit
- Closed - Won
- Closed - Lost

### Handed Off to Diego (Column T)
- Y
- N

---

## Step 5: Conditional Formatting on Status Column (Column J)

Select column J > Format > Conditional formatting > add rules:

| Status | Background Color | Text Color |
|---|---|---|
| New | Light gray #f5f5f5 | Black |
| Contacted | Light blue #e3f2fd | Black |
| Follow-Up | Light yellow #fff9c4 | Black |
| Warm | Light orange #ffe0b2 | Black |
| Call Booked | Light green #e8f5e9 | Dark green |
| Not a Fit | Light red #ffebee | Dark red |
| Closed - Won | Green #388e3c | White |
| Closed - Lost | Gray #9e9e9e | White |

---

## Step 6: Add a Summary Tab

Create a second sheet called **Dashboard** with these manual stats (update weekly):

| Metric | Formula |
|---|---|
| Total Contacts | `=COUNTA(Tracker!A2:A)` |
| Warm Leads | `=COUNTIF(Tracker!J2:J,"Warm")` |
| Calls Booked | `=COUNTIF(Tracker!J2:J,"Call Booked")` |
| Not a Fit | `=COUNTIF(Tracker!J2:J,"Not a Fit")` |
| Closed Won | `=COUNTIF(Tracker!J2:J,"Closed - Won")` |
| Conversion Rate (Contacts > Call) | `=COUNTIF(Tracker!J2:J,"Call Booked")/COUNTA(Tracker!A2:A)` |

Format conversion rate as percentage.

---

## Step 7: Share Settings

1. Click **Share** (top right)
2. Add your mom's email with **Editor** access
3. Add Diego with **Editor** access
4. Set "Anyone with link" to **Viewer** (read-only fallback)

---

## Column Reference (Full)

| Col | Field | Notes |
|---|---|---|
| A | Business Name | Required |
| B | Owner First Name | Required |
| C | Owner Last Name | Optional |
| D | Phone | Required |
| E | Email | Optional |
| F | Facebook Profile URL | For DM leads |
| G | Industry | Dropdown |
| H | City | Where they operate |
| I | Channel | How they were contacted |
| J | Status | Dropdown + color coded |
| K | Date First Contacted | MM/DD/YYYY |
| L | Date Last Contact | MM/DD/YYYY |
| M | Next Follow-Up Date | MM/DD/YYYY — highlight if past due |
| N | Call Booked Date | MM/DD/YYYY |
| O | Call Booked Time | e.g. 2:00 PM CST |
| P | Interested In | Website / Reviews / Both |
| Q | Their Biggest Problem | What they said in their own words |
| R | Objections Raised | What pushback came up |
| S | Notes | Anything else relevant |
| T | Handed Off to Diego | Y/N dropdown |
| U | Outcome | Final result if closed |

---

## Optional: Highlight Overdue Follow-Ups

Select column M > Conditional formatting:
- Custom formula: `=AND(M2<TODAY(), J2<>"Call Booked", J2<>"Closed - Won", J2<>"Closed - Lost", J2<>"Not a Fit")`
- Background: Red #ffcdd2

This flags any row where a follow-up date has passed and the lead is still active.

---

*Import `outreach-tracker.csv` to pre-populate the columns with the correct headers and one example row (delete the example row before your mom starts using it).*
