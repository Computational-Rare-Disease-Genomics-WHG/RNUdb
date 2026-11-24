#!/usr/bin/env python3
"""Initialize RNUdb database with Alembic migrations."""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from alembic.config import Config

from alembic import command


def main():
    """Initialize the database using Alembic migrations."""
    # Get Alembic config
    alembic_ini = Path(__file__).parent.parent / "alembic.ini"
    cfg = Config(str(alembic_ini))
    cfg.set_main_option("sqlalchemy.url", "sqlite:///data/database.db")

    print("Creating database schema...")
    command.upgrade(cfg, "head")
    print(f"Database created successfully at {Path('data/database.db')}")

    print(
        "Database initialized. Import gene/variant data via the web UI "
        "(/curate) or the data files under data/."
    )


if __name__ == "__main__":
    main()
