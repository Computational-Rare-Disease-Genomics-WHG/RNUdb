#!/usr/bin/env python3
"""Initialize RNUdb database with schema and optional sample data"""

import sys
from pathlib import Path

# Add parent directory to path to import rnudb_utils
sys.path.insert(0, str(Path(__file__).parent.parent))

from rnudb_utils import create_database, get_database_path
from insert_sample_data import main as insert_sample_data_main


def main():
    """Initialize the database and optionally insert sample data"""
    print("Creating database schema...")
    conn = create_database()
    conn.close()
    print(f"Database created successfully at {get_database_path()}")
    
    # Ask user if they want to insert sample data
    while True:
        choice = input("Do you want to insert sample data? (y/n): ").lower().strip()
        if choice in ['y', 'yes']:
            print("\nInserting sample data...")
            insert_sample_data_main()
            break
        elif choice in ['n', 'no']:
            print("Database initialized without sample data.")
            break
        else:
            print("Please enter 'y' for yes or 'n' for no.")


if __name__ == "__main__":
    main()
