import sqlite3
import os
from pathlib import Path

db_path = Path(__file__).resolve().parent / "screening.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 1. Add company_name to users if missing
cursor.execute("PRAGMA table_info(users)")
cols = [c[1] for c in cursor.fetchall()]
print("Existing users columns:", cols)

if "company_name" not in cols:
    cursor.execute("ALTER TABLE users ADD COLUMN company_name VARCHAR(255)")
    conn.commit()
    print("Added company_name column to users table.")
else:
    print("company_name column already exists.")

# 2. Create activity_logs table if missing
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='activity_logs'")
has_logs = cursor.fetchone()
if not has_logs:
    cursor.execute("""
        CREATE TABLE activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action VARCHAR(100) NOT NULL,
            user_email VARCHAR(255) NOT NULL,
            user_role VARCHAR(50) NOT NULL,
            details TEXT,
            ip_address VARCHAR(100),
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    print("Created activity_logs table.")
else:
    print("activity_logs table exists.")

conn.close()
print("Migration completed successfully.")
