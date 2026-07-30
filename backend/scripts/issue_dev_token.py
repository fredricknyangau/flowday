#!/usr/bin/env python3
"""
Issue a signed JWT for local development and initial production bootstrap.

Usage:
    # Issue a token for the default (bootstrap) tenant:
    python scripts/issue_dev_token.py

    # Issue a token for a specific tenant UUID:
    python scripts/issue_dev_token.py --tenant-id <uuid>

    # Set a custom expiry (default: 365 days):
    python scripts/issue_dev_token.py --days 30

    # Print just the token (useful for piping into clipboard or env vars):
    python scripts/issue_dev_token.py --quiet

The token is signed with JWT_SECRET from the environment (or .env file).
Set the printed token in:
  - Local dev:   localStorage.setItem('flowday_jwt', '<token>') in DevTools console
  - Vercel:      VITE_JWT_TOKEN environment variable (build-time)
  - Railway API: not needed — the backend verifies tokens, doesn't hold them

KNOWN GAP: This is a bootstrap script, not a production auth flow. A proper
auth system with login UI, token refresh, and revocation is deferred. Track
this as a known gap, not an oversight.

Default tenant UUID: a0000000-0000-4000-8000-000000000001
(the bootstrap tenant created by migration 014)
"""

import argparse
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import UUID

# Allow running from the project root or from backend/
_HERE = Path(__file__).parent
_BACKEND = _HERE.parent if _HERE.name == "scripts" else _HERE
sys.path.insert(0, str(_BACKEND))

try:
    import jwt  # PyJWT
except ImportError:
    print("ERROR: PyJWT is not installed. Run: pip install PyJWT==2.9.0", file=sys.stderr)
    sys.exit(1)

try:
    from dotenv import load_dotenv
    load_dotenv(_BACKEND / ".env")
except ImportError:
    pass  # python-dotenv optional — fall back to environment variables

# ── Default bootstrap tenant UUID (matches migration 014) ─────────────────────
DEFAULT_TENANT_ID = "a0000000-0000-4000-8000-000000000001"


def main() -> None:
    parser = argparse.ArgumentParser(description="Issue a Flowday dev JWT")
    parser.add_argument(
        "--tenant-id",
        default=DEFAULT_TENANT_ID,
        help=f"Tenant UUID (default: {DEFAULT_TENANT_ID})",
    )
    parser.add_argument(
        "--user-id",
        default="dev-user",
        help="User ID to embed in the token (default: dev-user)",
    )
    parser.add_argument(
        "--days",
        type=int,
        default=365,
        help="Token validity in days (default: 365)",
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Print only the token, no labels",
    )
    args = parser.parse_args()

    # Validate tenant UUID format
    try:
        tenant_uuid = UUID(args.tenant_id)
    except ValueError:
        print(f"ERROR: '{args.tenant_id}' is not a valid UUID", file=sys.stderr)
        sys.exit(1)

    secret = os.environ.get("JWT_SECRET")
    if not secret:
        print(
            "ERROR: JWT_SECRET is not set. Add it to your .env file or environment.",
            file=sys.stderr,
        )
        sys.exit(1)

    now = datetime.now(timezone.utc)
    payload = {
        "sub":       args.user_id,
        "tenant_id": str(tenant_uuid),
        "iat":       now,
        "exp":       now + timedelta(days=args.days),
    }

    token = jwt.encode(payload, secret, algorithm="HS256")

    if args.quiet:
        print(token)
    else:
        expiry = (now + timedelta(days=args.days)).strftime("%Y-%m-%d %H:%M UTC")
        print(f"\nFlowday Dev JWT")
        print(f"  Tenant ID : {tenant_uuid}")
        print(f"  User ID   : {args.user_id}")
        print(f"  Expires   : {expiry} ({args.days} days)")
        print(f"\nToken:\n{token}\n")
        print("To use in browser DevTools:")
        print(f"  localStorage.setItem('flowday_jwt', '{token}')")
        print("\nTo use as env var (Vercel / .env.local):")
        print(f"  VITE_JWT_TOKEN={token}")


if __name__ == "__main__":
    main()
