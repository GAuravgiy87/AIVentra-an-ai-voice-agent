import psycopg2
import bcrypt
import os
import sys

DB_URL = "postgresql://postgres:postgres@localhost:5433/ventra"

def get_db():
    return psycopg2.connect(DB_URL)

def migrate_passwords():
    print("Starting password migration...")
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, password FROM users")
    users = cursor.fetchall()
    
    migrated_count = 0
    for user_id, password in users:
        # Check if password is already hashed (bcrypt hashes start with $2b$, $2a$, etc.)
        if password and not password.startswith("$2"):
            # Hash the plain-text password
            hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # Update user record
            cursor.execute("UPDATE users SET password = %s WHERE id = %s", (hashed, user_id))
            migrated_count += 1
            print(f"Migrated password for user: {user_id}")
            
    conn.commit()
    conn.close()
    print(f"Migration complete! {migrated_count} passwords hashed.")

if __name__ == "__main__":
    migrate_passwords()
