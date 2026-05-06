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

    # Ask user if they want to insert sample data
    while True:
        choice = input("Do you want to insert sample data? (y/n): ").lower().strip()
        if choice in ["y", "yes"]:
            print("\nInserting sample data...")
            from insert_sample_data import main as insert_sample_data_main
            insert_sample_data_main()
            break
        elif choice in ["n", "no"]:
            print("Database initialized without sample data.")
            break
        else:
            print("Please enter 'y' for yes or 'n' for no.")


if __name__ == "__main__":
    main()
