import psycopg
import json
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
DATABASE_URL = os.getenv("DATABASE_URL")

def check_cve(cve_id):
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT cvejsondata FROM cverecord WHERE cveid = %s", (cve_id,))
            row = cur.fetchone()
            if row:
                print(f"--- cverecord.cvejsondata for {cve_id} ---")
                print(json.dumps(row[0], indent=2))
            else:
                print(f"CVE {cve_id} not found in cverecord")

            cur.execute("SELECT data FROM cvedata WHERE cveid = %s", (cve_id,))
            row = cur.fetchone()
            if row:
                print(f"\n--- cvedata.data for {cve_id} ---")
                print(json.dumps(row[0], indent=2))
            else:
                print(f"CVE {cve_id} not found in cvedata")

if __name__ == "__main__":
    check_cve("CVE-2025-0351")
