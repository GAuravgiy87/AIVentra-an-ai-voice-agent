import re

def migrate_to_postgres(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Imports
    content = content.replace("import sqlite3", "import psycopg2\nfrom psycopg2.extras import DictCursor")

    # DB Connection string
    content = content.replace('DB_PATH = "calls.db"', 'DB_URL = "postgresql://postgres:postgres@localhost:5432/ventra"\n\ndef get_db():\n    return psycopg2.connect(DB_URL)')
    content = content.replace('conn = sqlite3.connect(DB_PATH)', 'conn = get_db()')
    content = content.replace('conn = sqlite3.connect("calls.db")', 'conn = get_db()')
    
    # Exceptions
    content = content.replace('sqlite3.OperationalError', 'psycopg2.errors.UndefinedColumn')
    content = content.replace('sqlite3.IntegrityError', 'psycopg2.errors.UniqueViolation')

    # Schema replacements
    content = content.replace('INTEGER PRIMARY KEY AUTOINCREMENT', 'SERIAL PRIMARY KEY')
    content = content.replace('REAL', 'DOUBLE PRECISION')
    
    # Parameter bindings (sqlite ? to postgres %s)
    content = re.sub(r'VALUES \(\?[, \?]*\)', lambda m: m.group(0).replace('?', '%s'), content)
    content = re.sub(r'=\s*\?', '= %s', content)
    content = re.sub(r'updates\.append\(\'(.*?) \= \?\'\)', r"updates.append('\1 = %s')", content)
    
    # Handle specific ON CONFLICT for sqlite INSERT OR IGNORE
    content = content.replace('INSERT OR IGNORE INTO rooms', 'INSERT INTO rooms')
    conflict_fix = """cursor.execute('INSERT INTO rooms (room_id, created_at, last_active, extension, company_id) VALUES (%s, %s, %s, %s, %s) ON CONFLICT (room_id) DO NOTHING',"""
    content = content.replace("cursor.execute('INSERT INTO rooms (room_id, created_at, last_active, extension, company_id) VALUES (%s, %s, %s, %s, %s)',", conflict_fix)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

migrate_to_postgres('backend/agent.py')
migrate_to_postgres('backend/livekit_agent.py')

print("Migration script executed.")
