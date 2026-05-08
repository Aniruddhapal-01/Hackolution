"""
Database initialization script.
Run this inside the container or locally to create all tables.

Usage:
    python init_db.py
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from models import init_db, engine, Base
import models  # ensure all models are registered

def main():
    print("Creating all database tables...")
    init_db()
    print("Done. Tables created:")
    for table in Base.metadata.sorted_tables:
        print(f"  ✓ {table.name}")

if __name__ == "__main__":
    main()
