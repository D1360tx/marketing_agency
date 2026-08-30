#!/usr/bin/env python3
"""Build an allowlist-only client website export with checksums."""
from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
import stat
import zipfile

BLOCKED_PARTS = {
    ".git", ".env", ".next", "node_modules", "credentials", "secrets",
    "cookies", "logs", "database", "backups", "automation", "integrations",
}
BLOCKED_SUFFIXES = {
    ".key", ".pem", ".p12", ".pfx", ".sqlite", ".sqlite3", ".db", ".log",
}
MAX_FILE_BYTES = 50 * 1024 * 1024


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def safe_relative(raw: str) -> PurePosixPath:
    rel = PurePosixPath(raw)
    if rel.is_absolute() or not rel.parts or any(part in {"", ".", ".."} for part in rel.parts):
        raise ValueError(f"Unsafe relative path: {raw}")
    lowered = {part.lower() for part in rel.parts}
    if lowered & BLOCKED_PARTS or any(part.lower().startswith(".env") for part in rel.parts):
        raise ValueError(f"Blocked path category: {raw}")
    if rel.suffix.lower() in BLOCKED_SUFFIXES:
        raise ValueError(f"Blocked file type: {raw}")
    return rel


def build_export(source: Path, manifest_path: Path, output: Path) -> dict:
    source = source.resolve(strict=True)
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    for field in ["client_id", "business_name", "eligibility_verified_at", "approved_by", "included_files"]:
        if not manifest.get(field):
            raise ValueError(f"Manifest field is required: {field}")
    if not isinstance(manifest["included_files"], list) or not manifest["included_files"]:
        raise ValueError("included_files must be a non-empty list")

    files = []
    seen = set()
    for entry in manifest["included_files"]:
        if not isinstance(entry, dict) or not entry.get("path") or not entry.get("rights"):
            raise ValueError("Each included file requires path and rights")
        rel = safe_relative(entry["path"])
        if rel.as_posix() in seen:
            raise ValueError(f"Duplicate path: {rel}")
        seen.add(rel.as_posix())
        candidate = source.joinpath(*rel.parts)
        if candidate.is_symlink():
            raise ValueError(f"Symlinks are not allowed: {rel}")
        resolved = candidate.resolve(strict=True)
        if source not in resolved.parents:
            raise ValueError(f"Path escapes source directory: {rel}")
        mode = resolved.stat().st_mode
        if not stat.S_ISREG(mode):
            raise ValueError(f"Not a regular file: {rel}")
        size = resolved.stat().st_size
        if size > MAX_FILE_BYTES:
            raise ValueError(f"File exceeds 50 MiB limit: {rel}")
        files.append({
            "path": rel.as_posix(),
            "rights": entry["rights"],
            "size_bytes": size,
            "sha256": sha256(resolved),
            "source": resolved,
        })

    normalized = {
        "schema_version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "client_id": manifest["client_id"],
        "business_name": manifest["business_name"],
        "eligibility_verified_at": manifest["eligibility_verified_at"],
        "approved_by": manifest["approved_by"],
        "included_files": [{k: v for k, v in item.items() if k != "source"} for item in files],
        "excluded_categories": manifest.get("excluded_categories", []),
        "notes": manifest.get("notes", []),
    }

    output.parent.mkdir(parents=True, exist_ok=True)
    temp = output.with_suffix(output.suffix + ".tmp")
    with zipfile.ZipFile(temp, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for item in files:
            archive.write(item["source"], arcname=item["path"])
        archive.writestr("EXPORT-MANIFEST.json", json.dumps(normalized, indent=2) + "\n")
    temp.replace(output)

    with zipfile.ZipFile(output) as archive:
        names = sorted(archive.namelist())
    expected = sorted([item["path"] for item in files] + ["EXPORT-MANIFEST.json"])
    if names != expected:
        raise RuntimeError(f"Archive verification failed: {names}")

    return {
        "output": str(output),
        "archive_sha256": sha256(output),
        "file_count": len(files),
        "files": normalized["included_files"],
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    result = build_export(args.source, args.manifest, args.output)
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
