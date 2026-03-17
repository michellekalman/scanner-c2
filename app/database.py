import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
import json


# Load variables from the .env file
load_dotenv()


def connect_to_db():
    """
    Creates a connection to the PostgreSQL database.
    Uses RealDictCursor so results look like Python dictionaries:
    {'id': 1, 'status': 'pending'} instead of (1, 'pending')
    """
    try:
        conn = psycopg2.connect(
            dbname=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASS"),
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT")
        )
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None


def init_job(config_data: dict):
    conn = connect_to_db()
    if not conn:
        return None

    cur = conn.cursor()

    # Extract the target and convert the rest to a JSON string for Postgres
    target = config_data.get('target')
    config_json = json.dumps(config_data)

    query = """
        INSERT INTO scan_jobs (target, status, config) 
        VALUES (%s, 'pending', %s) 
        RETURNING id;
    """

    cur.execute(query, (target, config_json))
    job_id = cur.fetchone()[0]

    conn.commit()
    cur.close()
    conn.close()
    return job_id


def get_job_status(job_id: int):
    """Fetches the status of a specific job ID."""
    conn = connect_to_db()
    if not conn:
        return None

    # RealDictCursor makes the output easy for the API to send as JSON
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT id, status FROM scan_jobs WHERE id = %s;", (job_id,))
    job = cur.fetchone()

    cur.close()
    conn.close()
    return job


def get_all_scans(limit: int = 20, offset: int = 0):
    conn = connect_to_db()
    if not conn:
        return []

    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT id, target, status, duration 
        FROM scan_jobs 
        ORDER BY created_at DESC 
        LIMIT %s OFFSET %s;
    """, (limit, offset))

    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows
