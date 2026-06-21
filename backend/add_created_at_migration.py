import sqlite3
import datetime
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "inventory.db")

def migrate():
    print(f"Connecting to {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if created_at already exists
    cursor.execute("PRAGMA table_info(orders)")
    columns = [info[1] for info in cursor.fetchall()]
    
    if "created_at" not in columns:
        print("Adding created_at column to orders table...")
        try:
            # We add a default value to avoid issues with existing rows.
            # SQLite requires constant default for ALTER TABLE
            cursor.execute("ALTER TABLE orders ADD COLUMN created_at DATETIME DEFAULT '2024-01-01 00:00:00'")
            conn.commit()
            print("Successfully added created_at.")
        except Exception as e:
            print(f"Error adding column: {e}")
    else:
        print("created_at column already exists.")
        
    conn.close()

if __name__ == "__main__":
    migrate()
