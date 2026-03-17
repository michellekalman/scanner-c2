from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from app.database import init_job, get_job_status, get_all_scans
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="Scanner Control Hub")


# This defines exactly what the M&C must send to the API
class ScanConfig(BaseModel):
    target: str
    subnets_s3_url: str
    ports_s3_url: str
    fleet_size: int = 5
    masscan_rate: int = 1000
    partitions: int = 10


@app.post("/v1/scan", status_code=201)
async def start_scan(config: ScanConfig):
    # Pass the whole config object to the database helper
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
async def list_scans():
    scans = get_all_scans()
    return scans

