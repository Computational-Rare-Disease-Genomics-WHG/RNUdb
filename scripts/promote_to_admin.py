#!/usr/bin/env python3
"""One-shot recovery script: promote an existing GitHub user to admin.

Use this if a fresh deployment ever locks out (no admin exists because
ADMIN_GITHUB_LOGINS was unset when the first user logged in).

Usage:
    uv run python scripts/promote_to_admin.py <github_login>
"""

import sys
from pathlib import Path

# Ensure the project root is on sys.path so `api` can be imported
REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT))

from api.bootstrap import promote_to_admin  # noqa: E402

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    login = sys.argv[1].strip().lower()
    ok = promote_to_admin(login)
    sys.exit(0 if ok else 1)
