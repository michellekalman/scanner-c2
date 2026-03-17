from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
import os
from app.database import init_job, get_job_status, get_all_scans, get_active_scan_count
from app.entities.scan import ScanConfig

app = FastAPI(title="Scanner Control Hub")
app.mount("/static", StaticFiles(directory="static"), name="static")


MAX_CONCURRENT_SCANS = int(os.getenv("MAX_CONCURRENT_SCANS", 3))


@app.post("/v1/scan", status_code=201)
async def start_scan(config: ScanConfig):
    active_scans = get_active_scan_count()
    if active_scans >= MAX_CONCURRENT_SCANS:
        raise HTTPException(
            status_code=429,  # 429 means 'Too Many Requests'
            detail=f"System at capacity. There are already {active_scans} active scans. Please wait."
        )

    job_id = init_job(config.dict())

    if not job_id:
        raise HTTPException(status_code=500, detail="Database insertion failed.")

    return {"job_id": job_id, "status": "pending"}


@app.get("/v1/scan/{job_id}")
async def check_scan_status(job_id: int):
    job = get_job_status(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    return job


@app.get("/v1/scans")
async def list_scans(limit: int = 20, offset: int = 0):
    """Fetches a list of scans with pagination."""
    scans = get_all_scans(limit=limit, offset=offset)
    return scans

