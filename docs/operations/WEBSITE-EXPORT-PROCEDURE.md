# Website Export Procedure

This procedure fulfills the agreement's export of **client-specific website content and core page files** after three fully paid months when the account is current. It does not transfer Booked Out's reusable systems, hosting, automations, integrations, credentials, or third-party licenses.

## Eligibility gate

- Confirm client identity and authorized requester.
- Confirm three fully paid months and current account standing.
- Record approval and export scope in the operations workbook.
- If ineligible, stop and provide the contractual reason and the next eligibility date.

## Scope classification

**Normally include**

- Client-specific page copy and structured content
- Client-supplied or client-licensed images
- Core HTML, CSS, and page-level JavaScript required to render the exported pages
- Client-specific metadata, redirects, and content manifests

**Normally exclude**

- `.env*`, credentials, keys, tokens, cookies, logs, and database dumps
- Git history, CI/CD configuration, hosting configuration, and deployment credentials
- Booked Out automation logic, internal scripts, reusable components/templates, and proprietary libraries
- Third-party software, fonts, stock assets, or plugins without transferable licenses
- Analytics, email, SMS, CRM, billing, or other integration credentials/configuration

## Build procedure

1. Create a clean staging directory for this client only.
2. Copy only explicitly approved files into that directory.
3. Complete `website-export-manifest.template.json` with relative paths and rights/ownership notes.
4. Run:

```bash
python3 scripts/package-client-website-export.py \
  --source /absolute/path/to/staging \
  --manifest /absolute/path/to/export-manifest.json \
  --output /absolute/path/to/client-export.zip
```

5. Review the generated manifest and SHA-256 checksums.
6. Extract the ZIP into a fresh directory and open the pages locally.
7. Scan the extracted files for secrets, internal URLs, client crossover, and unlicensed assets.
8. Obtain Booked Out owner approval before delivery.
9. Deliver through an approved secure channel and record the receipt.

## Acceptance criteria

- Archive contains only allowlisted files.
- Every file has an SHA-256 checksum.
- No symlinks, hidden secrets, absolute paths, parent traversal, or blocked file types.
- No other client's data or assets.
- Core pages render after clean extraction.
- Manifest states what is included, excluded, and not transferable.
- Delivery and client receipt are recorded.
