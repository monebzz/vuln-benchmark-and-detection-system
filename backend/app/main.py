import io
import json
import os
import zipfile
from datetime import datetime
from typing import Any
from urllib.parse import urljoin

import httpx
import psycopg
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse, Response, StreamingResponse
from psycopg.rows import dict_row

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/postgres")
AI_BACKEND_URL = os.getenv("AI_BACKEND_URL", "").rstrip("/")

app = FastAPI(title="CVE Local Backend", version="1.0.0")


class DatabaseUnavailableError(Exception):
    pass

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def db_connect():
    try:
        return psycopg.connect(DATABASE_URL, row_factory=dict_row)
    except psycopg.OperationalError as exc:
        raise DatabaseUnavailableError(
            "Unable to connect to PostgreSQL. Ensure database service is running and DATABASE_URL is correct."
        ) from exc


@app.exception_handler(DatabaseUnavailableError)
async def database_unavailable_handler(request: Request, exc: DatabaseUnavailableError):
    return JSONResponse(
        status_code=503,
        content={
            "error": "database_unavailable",
            "message": str(exc),
        },
    )


def fetch_all(sql: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    with db_connect() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            return cur.fetchall()


def fetch_one(sql: str, params: tuple[Any, ...] = ()) -> dict[str, Any] | None:
    with db_connect() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            return cur.fetchone()


def maybe_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except Exception:
        return None


def normalize_cve_row(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row.get("cveid"),
        "cveid": row.get("cveid"),
        "title": row.get("title"),
        "description": row.get("description") or "",
        "datepublished": row.get("datepublished"),
        "assigner": row.get("assigner") or "Unknown",
        "product": row.get("product") or "Unknown",
        "vendor": row.get("vendor") or "Unknown",
        "all_metrics": row.get("all_metrics") or {},
        "latest_cvss_version": maybe_float(row.get("latest_cvss_version")) or 0,
        "latest_severity": row.get("latest_severity"),
        "latest_basescore": maybe_float(row.get("latest_basescore")),
        "category_type": row.get("category_type") or "Unknown",
        "epss_probability": maybe_float(row.get("epss_probability")) or 0,
        "epss_score": maybe_float(row.get("epss_score")) or 0,
        "patched": bool(row.get("patched", False)),
    }


def paged_response(records: list[dict[str, Any]], total_count: int, page: int, page_size: int) -> dict[str, Any]:
    total_pages = max((total_count + page_size - 1) // page_size, 1)
    return {
        "records": records,
        "totalCount": total_count,
        "totalPages": total_pages,
        "currentPage": page,
        "pageSize": page_size,
        "hasNextPage": page < total_pages,
        "hasPreviousPage": page > 1,
    }


@app.get("/health")
def health():
    return {"status": "ok", "service": "fastapi-cve-backend"}


@app.get("/api/dashboard/cve-epss-ranges")
def cve_epss_ranges():
    row = fetch_one("SELECT * FROM epss_change_distribution LIMIT 1")
    if not row:
        return None
    row["id"] = "epssStats"
    return row

@app.post("/api/analyze")
async def analyze_file(file: UploadFile = File(...)):
    if not AI_BACKEND_URL:
        raise HTTPException(status_code=500, detail="AI_BACKEND_URL is not configured in the environment.")
    
    async with httpx.AsyncClient(timeout=300.0) as client:
        try:
            content = await file.read()
            response = await client.post(
                f"{AI_BACKEND_URL}/analyze",
                files={"file": (file.filename, content, file.content_type)}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"AI backend error: {str(e)}")



@app.get("/api/dashboard/cve-yearly-count")
def cve_yearly_count():
    rows = fetch_all(
        """
        SELECT year::int AS year, cve_count::int AS total_cves
        FROM cve_counts_by_year
        ORDER BY year DESC
        """
    )
    out = []
    for item in rows:
        out.append(
            {
                "id": str(item["year"]),
                "year": item["year"],
                "total_cves": item["total_cves"],
                "critical_count": 0,
                "high_count": 0,
                "medium_count": 0,
                "low_count": 0,
            }
        )
    return out


@app.get("/api/dashboard/cve-assigner-count")
def cve_assigner_count(limit: int = Query(10, ge=1, le=200)):
    rows = fetch_all(
        """
        SELECT COALESCE(assigner, 'Unknown') AS name, COUNT(*)::int AS count
        FROM cve_data_view
        GROUP BY COALESCE(assigner, 'Unknown')
        ORDER BY count DESC
        LIMIT %s
        """,
        (limit * 2,),
    )
    result = []
    for idx, row in enumerate(rows):
        name = str(row["name"])
        if name.strip().lower() in {"n/a", "unknown"}:
            continue
        result.append({"id": f"assigner-{idx}", "name": name, "count": row["count"]})
    return result[:limit]


@app.get("/api/dashboard/cve-product-count")
def cve_product_count(limit: int = Query(10, ge=1, le=200)):
    rows = fetch_all(
        """
        SELECT product, product_count::int AS count
        FROM product_counts
        ORDER BY product_count DESC
        LIMIT %s
        """,
        (limit * 3,),
    )
    merged: dict[str, int] = {}
    for row in rows:
        name = str(row.get("product") or "Unknown")
        if name.strip().lower() in {"n/a", "unknown"}:
            continue
        merged[name] = merged.get(name, 0) + int(row["count"])
    sorted_items = sorted(merged.items(), key=lambda pair: pair[1], reverse=True)[:limit]
    return [{"id": f"product-{idx}", "name": name, "count": count} for idx, (name, count) in enumerate(sorted_items)]


@app.get("/api/dashboard/cve-score-ranges")
def cve_score_ranges():
    rows = fetch_all("SELECT range_label, cve_count::int AS cve_count FROM cvss_score_ranges")
    score_counts: dict[str, int] = {}
    for row in rows:
        score_counts[str(row["range_label"])] = int(row["cve_count"])
    return [{"id": "scoreStats", "score_counts": score_counts}] if score_counts else []


@app.get("/api/dashboard/cve-severity-count")
def cve_severity_count():
    row = fetch_one("SELECT severity_distribution FROM severity_stats LIMIT 1")
    if not row or not row.get("severity_distribution"):
        return []
    distribution = row["severity_distribution"]
    return [
        {
            "id": "severityStats",
            "critical": int(distribution.get("critical_severity_count", 0)),
            "high": int(distribution.get("high_severity_count", 0)),
            "medium": int(distribution.get("medium_severity_count", 0)),
            "low": int(distribution.get("low_severity_count", 0)),
            "none": 0,
            "unknown": 0,
            "total": int(distribution.get("total_cves", 0)),
        }
    ]


@app.get("/api/dashboard/cve-daily-count")
def cve_daily_count(year: int = Query(2025, ge=1990, le=2100)):
    rows = fetch_all(
        """
        SELECT SPLIT_PART(day, '-', 1)::int AS year,
               SPLIT_PART(day, '-', 2)::int AS month,
               SPLIT_PART(day, '-', 3)::int AS day,
               cve_count::int AS total_cves,
               critical_count::int,
               high_count::int,
               medium_count::int,
               low_count::int
        FROM cve_counts_by_day_severity
        WHERE SPLIT_PART(day, '-', 1)::int = %s
        ORDER BY day ASC
        """,
        (year,),
    )
    return [
        {
            "id": f"{item['year']}-{item['month']}-{item['day']}",
            **item,
        }
        for item in rows
    ]


@app.get("/api/dashboard/cve-type-count")
def cve_type_count():
    rows = fetch_all("SELECT category_type, count::int AS count FROM category_type_counts")
    category_counts: dict[str, int] = {}
    for row in rows:
        category_counts[str(row.get("category_type") or "UNKNOWN")] = int(row["count"])
    return [{"id": "categoryTypeCounts", "category_counts": category_counts}]


@app.get("/api/dashboard/random-cve")
def random_cve(
    limit: int = Query(10, ge=1, le=100),
    random: bool = Query(False),
    cveid: str | None = None,
    severity: str | None = None,
    vendor: str | None = None,
    product: str | None = None,
    assigner: str | None = None,
):
    where_parts = []
    params: list[Any] = []

    if cveid:
        where_parts.append("cveid = %s")
        params.append(cveid)
    if severity:
        where_parts.append("COALESCE(latest_severity, '') ILIKE %s")
        params.append(severity)
    if vendor:
        where_parts.append("COALESCE(vendor, '') ILIKE %s")
        params.append(vendor)
    if product:
        where_parts.append("COALESCE(product, '') ILIKE %s")
        params.append(product)
    if assigner:
        where_parts.append("COALESCE(assigner, '') ILIKE %s")
        params.append(assigner)

    where_sql = f"WHERE {' AND '.join(where_parts)}" if where_parts else ""
    order_sql = "ORDER BY RANDOM()" if random else "ORDER BY datepublished DESC"

    sql = f"""
        SELECT cveid, title, description, datepublished, assigner, product, vendor,
               all_metrics, latest_cvss_version, latest_severity,
               latest_basescore, category_type, epss_probability, epss_score
        FROM cve_data_view
        {where_sql}
        {order_sql}
        LIMIT %s
    """
    params.append(limit)
    rows = fetch_all(sql, tuple(params))
    return [normalize_cve_row(row) for row in rows]


@app.get("/api/dashboard/cve-vendor-count")
def cve_vendor_count(limit: int = Query(10, ge=1, le=200)):
    rows = fetch_all(
        """
        SELECT vendor, vendor_count::int AS count
        FROM vendor_counts
        ORDER BY vendor_count DESC
        LIMIT %s
        """,
        (limit * 2,),
    )
    result = []
    for idx, row in enumerate(rows):
        name = str(row.get("vendor") or "Unknown")
        if name.strip().lower() in {"n/a", "unknown"}:
            continue
        result.append({"id": f"vendor-{idx}", "name": name, "count": row["count"]})
    return result[:limit]


@app.get("/api/dashboard/cve-monthly-count")
def cve_monthly_count(year: int = Query(2025, ge=1990, le=2100)):
    rows = fetch_all(
        """
        SELECT SPLIT_PART(month, '-', 1)::int AS year,
               SPLIT_PART(month, '-', 2)::int AS month,
               cve_count::int AS total_cves,
               critical_count::int,
               high_count::int,
               medium_count::int,
               low_count::int
        FROM cve_counts_by_month_severity
        WHERE SPLIT_PART(month, '-', 1)::int = %s
        ORDER BY month ASC
        """,
        (year,),
    )
    return [{"id": f"{item['year']}-{item['month']}", **item} for item in rows]


@app.get("/api/cve")
def cve_list(
    field: str,
    value: str | None = None,
    year: int | None = None,
    from_date: str | None = Query(None, alias="from"),
    to_date: str | None = Query(None, alias="to"),
    pageSize: int = Query(10, ge=1, le=200),
    page: int = Query(1, ge=1),
    orderField: str = "datepublished",
    orderDirection: str = Query("desc", pattern="^(asc|desc)$"),
    q: str | None = None,
):
    where_parts: list[str] = []
    params: list[Any] = []

    if field == "patched":
        # patched column does not exist in cve_data_view; return empty set
        where_parts.append("1 = 0")

    if q:
        search_like = f"%{q}%"
        where_parts.append(
            "(cveid ILIKE %s OR COALESCE(product, '') ILIKE %s OR COALESCE(vendor, '') ILIKE %s OR COALESCE(assigner, '') ILIKE %s OR COALESCE(category_type, '') ILIKE %s OR COALESCE(title, '') ILIKE %s OR COALESCE(description, '') ILIKE %s)"
        )
        params.extend([search_like] * 7)

    if from_date and to_date:
        where_parts.append("datepublished::timestamp >= %s::timestamp")
        params.append(from_date)
        where_parts.append("datepublished::timestamp <= %s::timestamp")
        params.append(to_date)
    elif year:
        where_parts.append("EXTRACT(YEAR FROM datepublished::timestamp) = %s")
        params.append(year)

    if field in {"vendor", "product", "assigner", "category_type"} and value:
        where_parts.append(f"COALESCE({field}, '') = %s")
        params.append(value)

    if field in {"latest_basescore", "epss_score"} and value:
        if "-" in value:
            try:
                min_v, max_v = value.split("-", 1)
                where_parts.append(f"COALESCE(NULLIF({field}::text, ''), '0')::float >= %s")
                params.append(float(min_v))
                where_parts.append(f"COALESCE(NULLIF({field}::text, ''), '0')::float <= %s")
                params.append(float(max_v))
            except Exception:
                pass
        else:
            try:
                where_parts.append(f"COALESCE(NULLIF({field}::text, ''), '0')::float = %s")
                params.append(float(value))
            except Exception:
                pass

    where_sql = f"WHERE {' AND '.join(where_parts)}" if where_parts else ""

    safe_order_field = orderField if orderField in {
        "datepublished",
        "cveid",
        "vendor",
        "product",
        "assigner",
        "latest_basescore",
        "epss_score",
    } else "datepublished"

    count_sql = f"SELECT COUNT(*)::int AS count FROM cve_data_view {where_sql}"
    total_count = fetch_one(count_sql, tuple(params))["count"]

    offset = (page - 1) * pageSize
    data_sql = f"""
        SELECT cveid, title, description, datepublished, assigner, product, vendor,
               all_metrics, latest_cvss_version, latest_severity,
               latest_basescore, category_type, epss_probability, epss_score,
               false AS patched
        FROM cve_data_view
        {where_sql}
        ORDER BY {safe_order_field} {orderDirection.upper()}, cveid ASC
        LIMIT %s OFFSET %s
    """
    rows = fetch_all(data_sql, tuple([*params, pageSize, offset]))
    return paged_response([normalize_cve_row(row) for row in rows], total_count, page, pageSize)


@app.get("/api/search")
def cve_search(
    q: str | None = None,
    searchTerm: str | None = None,
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=200),
    orderField: str = "datepublished",
    orderDirection: str = Query("desc", pattern="^(asc|desc)$"),
):
    search_text = (q or searchTerm or "").strip()
    if not search_text:
        return cve_list(
            field="none",
            page=page,
            pageSize=pageSize,
            orderField=orderField,
            orderDirection=orderDirection,
        )

    safe_order_field = orderField if orderField in {
        "datepublished",
        "cveid",
        "vendor",
        "product",
        "assigner",
        "latest_basescore",
        "epss_score",
    } else "datepublished"

    search_like = f"%{search_text}%"
    where_sql = """
      WHERE cveid ILIKE %s
         OR COALESCE(product, '') ILIKE %s
         OR COALESCE(vendor, '') ILIKE %s
         OR COALESCE(assigner, '') ILIKE %s
         OR COALESCE(category_type, '') ILIKE %s
         OR COALESCE(title, '') ILIKE %s
         OR COALESCE(description, '') ILIKE %s
    """
    count_sql = f"SELECT COUNT(*)::int AS count FROM cve_data_view {where_sql}"
    total_count = fetch_one(count_sql, (search_like,) * 7)["count"]

    offset = (page - 1) * pageSize
    sql = f"""
      SELECT cveid, title, description, datepublished, assigner, product, vendor,
             all_metrics, latest_cvss_version, latest_severity,
             latest_basescore, category_type, epss_probability, epss_score,
             false AS patched
      FROM cve_data_view
      {where_sql}
      ORDER BY {safe_order_field} {orderDirection.upper()}, cveid ASC
      LIMIT %s OFFSET %s
    """
    rows = fetch_all(sql, tuple([*(search_like for _ in range(7)), pageSize, offset]))
    return paged_response([normalize_cve_row(row) for row in rows], total_count, page, pageSize)


@app.get("/api/cve-detail")
def cve_detail(id: str):
    row = fetch_one(
        """
        SELECT r.cvejsondata AS cverecord_data, d.data AS cvedata_data
        FROM cverecord r
        LEFT JOIN cvedata d ON d.cveid = r.cveid
        WHERE r.cveid = %s
        """,
        (id,),
    )
    if not row:
        raise HTTPException(status_code=404, detail="CVE not found")
    return {"cvedata_data": row.get("cvedata_data") or {}, "cverecord_data": row.get("cverecord_data") or {}}


@app.get("/api/assigners")
def assigners(page: int = Query(1, ge=1), pageSize: int = Query(20, ge=1, le=200)):
    total = fetch_one(
        "SELECT COUNT(*)::int AS count FROM (SELECT COALESCE(assigner, 'Unknown') AS name FROM cve_data_view GROUP BY name) t"
    )["count"]
    offset = (page - 1) * pageSize
    rows = fetch_all(
        """
        SELECT COALESCE(assigner, 'Unknown') AS name, COUNT(*)::int AS count
        FROM cve_data_view
        GROUP BY name
        ORDER BY count DESC
        LIMIT %s OFFSET %s
        """,
        (pageSize, offset),
    )
    records = [{"id": f"assigner-{idx+offset}", "name": row["name"], "count": row["count"]} for idx, row in enumerate(rows)]
    return paged_response(records, total, page, pageSize)


@app.get("/api/vendors")
def vendors(page: int = Query(1, ge=1), pageSize: int = Query(20, ge=1, le=200)):
    total = fetch_one("SELECT COUNT(*)::int AS count FROM vendor_counts")["count"]
    offset = (page - 1) * pageSize
    rows = fetch_all(
        "SELECT vendor AS name, vendor_count::int AS count FROM vendor_counts ORDER BY vendor_count DESC LIMIT %s OFFSET %s",
        (pageSize, offset),
    )
    records = [{"id": f"vendor-{idx+offset}", "name": row["name"], "count": row["count"]} for idx, row in enumerate(rows)]
    return paged_response(records, total, page, pageSize)


@app.get("/api/products")
def products(page: int = Query(1, ge=1), pageSize: int = Query(20, ge=1, le=200)):
    total = fetch_one("SELECT COUNT(*)::int AS count FROM product_counts")["count"]
    offset = (page - 1) * pageSize
    rows = fetch_all(
        "SELECT product AS name, product_count::int AS count FROM product_counts ORDER BY product_count DESC LIMIT %s OFFSET %s",
        (pageSize, offset),
    )
    records = [{"id": f"product-{idx+offset}", "name": row["name"], "count": row["count"]} for idx, row in enumerate(rows)]
    return paged_response(records, total, page, pageSize)


def normalize_subcollections(raw: Any) -> tuple[list[str], dict[str, list[dict[str, Any]]]]:
    if isinstance(raw, dict):
        subs = raw.get("subcollections")
        if isinstance(subs, dict):
            return list(subs.keys()), subs
        if "patchinfo" in raw and isinstance(raw["patchinfo"], list):
            raw = raw["patchinfo"]
        else:
            # If it's a single patch object, wrap it in a list
            raw = [raw]
    subcollections: dict[str, list[dict[str, Any]]] = {}
    if isinstance(raw, list):
        for idx, item in enumerate(raw):
            if not isinstance(item, dict):
                continue
            patch_id = str(item.get("patchId") or item.get("referenceData", {}).get("patchId") or f"patch-{idx}")
            subcollections.setdefault(patch_id, []).append(item)
    return list(subcollections.keys()), subcollections


@app.get("/api/kernel-detail")
def kernel_detail(docId: str | None = None, cveId: str | None = None, patchId: str | None = None):
    if docId:
        row = fetch_one("SELECT cveid, patchinfo FROM kernel_data WHERE cveid = %s", (docId,))
    elif cveId:
        row = fetch_one("SELECT cveid, patchinfo FROM kernel_data WHERE cveid = %s", (cveId,))
    else:
        raise HTTPException(status_code=400, detail="docId or cveId is required")

    if not row:
        raise HTTPException(status_code=404, detail="Kernel data not found")

    patch_ids, subcollections = normalize_subcollections(row.get("patchinfo"))
    if patchId:
        subcollections = {patchId: subcollections.get(patchId, [])}
        patch_ids = [patchId]

    return {
        "id": row["cveid"],
        "cveId": row["cveid"],
        "summary": "",
        "patchIds": patch_ids,
        "subcollections": subcollections,
    }


@app.get("/api/kernel-detail/by-cve")
def kernel_by_cve(cveId: str):
    return kernel_detail(cveId=cveId)


@app.get("/api/kernel-detail/by-cve-patch")
def kernel_by_cve_patch(cveId: str, patchId: str):
    return kernel_detail(cveId=cveId, patchId=patchId)


@app.get("/api/kernel-detail/by-doc-id")
def kernel_by_doc_id(docId: str):
    return kernel_detail(docId=docId)


def _decode_file_content(blob: Any) -> str:
    if blob is None:
        return ""
    if isinstance(blob, memoryview):
        blob = bytes(blob)
    if isinstance(blob, (bytes, bytearray)):
        try:
            return blob.decode("utf-8", errors="replace")
        except Exception:
            return blob.decode("latin-1", errors="replace")
    return str(blob)


def _basename(path: str) -> str:
    return path.rsplit("/", 1)[-1]


@app.get("/api/kernel-detail/file")
def kernel_file(type: str, cveId: str, patchId: str, fileName: str):
    table = "kernel_vulnerable_files" if type == "vulnerable_file" else "kernel_nonvulnerable_files"
    row = fetch_one(
        f"SELECT filename, data FROM {table} WHERE cveid = %s AND (filename = %s OR filename = %s) LIMIT 1",
        (cveId, fileName, _basename(fileName)),
    )
    content = _decode_file_content(row["data"]) if row else ""
    return {"content": content, "fileName": fileName, "type": type, "cveId": cveId, "patchId": patchId}


@app.get("/api/kernel-detail/function")
def kernel_function(type: str, cveId: str, patchId: str, fileName: str):
    table = "kernel_vulnerable_files" if type == "vulnerable_function" else "kernel_nonvulnerable_files"
    row = fetch_one(
        f"SELECT filename, data FROM {table} WHERE cveid = %s AND (filename = %s OR filename = %s) LIMIT 1",
        (cveId, fileName, _basename(fileName)),
    )
    content = _decode_file_content(row["data"]) if row else ""
    return {"content": content, "fileName": fileName, "type": type, "cveId": cveId, "patchId": patchId}


@app.get("/api/github-detail")
def github_detail(cveId: str, patchId: str | None = None):
    row = fetch_one("SELECT cveid, patchinfo FROM github_data WHERE cveid = %s", (cveId,))
    if not row:
        raise HTTPException(status_code=404, detail="Github data not found")

    patch_ids, subcollections = normalize_subcollections(row.get("patchinfo"))

    if patchId:
        docs = subcollections.get(patchId, [])
        if not docs:
            return []
        return [
            {
                "fileName": item.get("fileName") or item.get("filename") or item.get("id") or "",
                "fileContent": item.get("fileContent") or item.get("content") or "",
                **item,
            }
            for item in docs
        ]

    sha_rows = fetch_all(
        "SELECT referencelink, shaid, shadetail FROM githubreferencedetail WHERE cveid = %s ORDER BY shaid",
        (cveId,),
    )
    sha_details = []
    links_map: dict[str, list[dict[str, Any]]] = {}
    for sha in sha_rows:
        detail = sha.get("shadetail") or {}
        item = {
            "sha": sha.get("shaid"),
            "id": sha.get("shaid"),
            "referencelink": sha.get("referencelink"),
            "github_commit_data": detail.get("github_commit_data", detail),
            **(detail if isinstance(detail, dict) else {}),
        }
        sha_details.append(item)
        link = str(sha.get("referencelink") or "")
        links_map.setdefault(link, []).append(item)

    link_rows = fetch_all("SELECT referencelink, cvegithubdata FROM githubdata WHERE cveid = %s", (cveId,))
    file_groups = []
    for idx, link_row in enumerate(link_rows):
        data = link_row.get("cvegithubdata")
        file_groups.append(
            {
                "fileId": f"file-{idx}",
                "documents": data if isinstance(data, list) else [data] if data else [],
            }
        )

    links = [{"referencelink": key, "shaDetails": value} for key, value in links_map.items() if key]
    return {
        "id": cveId,
        "cveId": cveId,
        "shalist": [item.get("sha") for item in sha_details if item.get("sha")],
        "shaDetails": sha_details,
        "links": links,
        "fileGroups": file_groups,
        "patchIds": patch_ids,
        "subcollections": subcollections,
    }


@app.get("/api/github-detail/by-cve")
def github_by_cve(cveId: str):
    return github_detail(cveId=cveId)


@app.get("/api/github-detail/by-cve-patch")
def github_by_cve_patch(cveId: str, patchId: str):
    return github_detail(cveId=cveId, patchId=patchId)


@app.get("/api/github-detail/by-sha")
def github_by_sha(cveId: str, sha: str):
    row = fetch_one(
        "SELECT referencelink, shaid, shadetail FROM githubreferencedetail WHERE cveid = %s AND shaid = %s LIMIT 1",
        (cveId, sha),
    )
    if not row:
        raise HTTPException(status_code=404, detail="SHA not found")
    detail = row.get("shadetail") or {}
    return {
        "sha": row.get("shaid"),
        "id": row.get("shaid"),
        "cveId": cveId,
        "referencelink": row.get("referencelink"),
        "github_commit_data": detail.get("github_commit_data", detail),
        **(detail if isinstance(detail, dict) else {}),
    }


@app.get("/api/github-detail/file")
def github_file(type: str, cveId: str, patchId: str, fileName: str):
    table = "github_vulnerable_files" if type == "vulnerable_files" else "github_nonvulnerable_files"
    row = fetch_one(
        f"SELECT filename, data FROM {table} WHERE cveid = %s AND (filename = %s OR filename = %s) LIMIT 1",
        (cveId, fileName, _basename(fileName)),
    )
    content = _decode_file_content(row["data"]) if row else ""
    return {"content": content, "fileName": fileName, "type": type, "cveId": cveId, "patchId": patchId}


@app.get("/api/github-detail/function")
def github_function(type: str, cveId: str, patchId: str, fileName: str):
    table = "github_vulnerable_files" if type == "vulnerable_function" else "github_nonvulnerable_files"
    row = fetch_one(
        f"SELECT filename, data FROM {table} WHERE cveid = %s AND (filename = %s OR filename = %s) LIMIT 1",
        (cveId, fileName, _basename(fileName)),
    )
    content = _decode_file_content(row["data"]) if row else ""
    return {"content": content, "fileName": fileName, "type": type, "cveId": cveId, "patchId": patchId}


@app.get("/api/statistics/avg-stats")
def avg_stats():
    row = fetch_one("SELECT * FROM cve_avg_percentages LIMIT 1")
    if not row:
        return None
    return {
        "avg_base_score": maybe_float(row.get("avg_base_score")) or 0,
        "avg_exploit_score": maybe_float(row.get("avg_exploit_score")) or 0,
        "avg_percentile": maybe_float(row.get("avg_percentile")) or 0,
        "avg_probability": maybe_float(row.get("avg_probability")) or 0,
    }


def _zip_response_from_rows(rows: list[dict[str, Any]], filename_col: str, data_col: str, zip_name: str):
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for idx, row in enumerate(rows):
            file_name = row.get(filename_col) or f"file_{idx}.txt"
            data = row.get(data_col)
            if isinstance(data, memoryview):
                data = bytes(data)
            if isinstance(data, str):
                data = data.encode("utf-8")
            zf.writestr(str(file_name), data or b"")
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={zip_name}"},
    )


@app.get("/api/download/github_files")
def download_github_files():
    rows = fetch_all(
        "SELECT filename, data FROM github_vulnerable_files UNION ALL SELECT filename, data FROM github_nonvulnerable_files"
    )
    if not rows:
        raise HTTPException(status_code=404, detail="No github files found")
    return _zip_response_from_rows(rows, "filename", "data", "github_files.zip")


@app.get("/api/download/kernel_files")
def download_kernel_files():
    rows = fetch_all(
        "SELECT filename, data FROM kernel_vulnerable_files UNION ALL SELECT filename, data FROM kernel_nonvulnerable_files"
    )
    if not rows:
        raise HTTPException(status_code=404, detail="No kernel files found")
    return _zip_response_from_rows(rows, "filename", "data", "kernel_files.zip")


@app.get("/api/download/gitlab_files")
def download_gitlab_files():
    rows = fetch_all("SELECT file_name AS filename, file_content AS data FROM vulnerable_files")
    if not rows:
        raise HTTPException(status_code=404, detail="No files found")
    return _zip_response_from_rows(rows, "filename", "data", "gitlab_files.zip")


@app.get("/api/download/chromium_files")
def download_chromium_files():
    rows = fetch_all("SELECT file_name AS filename, file_content AS data FROM vulnerable_files")
    if not rows:
        raise HTTPException(status_code=404, detail="No files found")
    return _zip_response_from_rows(rows, "filename", "data", "chromium_files.zip")


@app.get("/api/download/android_files")
def download_android_files():
    rows = fetch_all("SELECT file_name AS filename, file_content AS data FROM vulnerable_files")
    if not rows:
        raise HTTPException(status_code=404, detail="No files found")
    return _zip_response_from_rows(rows, "filename", "data", "android_files.zip")


@app.get("/api/download/cve_files")
def download_cve_files():
    return download_github_files()


@app.get("/api/update-patched")
def update_patched():
    return {"success": True, "message": "No-op in local Postgres mode"}


async def _proxy_ai(path: str, payload: dict[str, Any] | None = None, method: str = "GET"):
    if not AI_BACKEND_URL:
        raise HTTPException(status_code=501, detail="AI backend is not configured")

    import httpx

    target = urljoin(f"{AI_BACKEND_URL}/", path.lstrip("/"))
    async with httpx.AsyncClient(timeout=60.0) as client:
        if method == "POST":
            resp = await client.post(target, json=payload or {})
        else:
            resp = await client.get(target)

    if "application/json" in resp.headers.get("content-type", ""):
        return JSONResponse(resp.json(), status_code=resp.status_code)
    return Response(content=resp.content, status_code=resp.status_code, media_type=resp.headers.get("content-type"))


@app.post("/api/vulnerability/analyze")
async def vulnerability_analyze(request: Request):
    payload = await request.json()
    return await _proxy_ai("/api/v1/vulnerability/analyze", payload=payload, method="POST")


@app.get("/api/vulnerability/health")
async def vulnerability_health():
    return await _proxy_ai("/api/v1/vulnerability/health", method="GET")


@app.post("/api/ai-recommendation")
async def ai_recommendation(request: Request):
    payload = await request.json()
    return await _proxy_ai("/api/v1/ai/recommendation", payload=payload, method="POST")


@app.post("/api/get_ai_analytics")
async def ai_analytics(request: Request):
    payload = await request.json()
    return await _proxy_ai("/api/v1/ai/analytics", payload=payload, method="POST")
