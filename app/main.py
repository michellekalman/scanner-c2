from fastapi import FastAPI, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
import os

from sqlalchemy.orm import Session

from app.entities.scan import ScanConfig
from app.database import get_db_session
from app.entities.models import ScanJob

app = FastAPI(title="Scanner Control Hub")
app.mount("/static", StaticFiles(directory="static"), name="static")


MAX_CONCURRENT_SCANS = int(os.getenv("MAX_CONCURRENT_SCANS", 3))


@app.post("/v1/scan", status_code=201)
async def start_scan(config: ScanConfig, db: Session = Depends(get_db_session)):
    active_scans = db.query(ScanJob).filter(ScanJob.status.in_(['pending', 'running'])).count()
    if active_scans >= MAX_CONCURRENT_SCANS:
        raise HTTPException(status_code=429, detail="System at capacity.")

    new_job = ScanJob(
        target=config.target,
        config=config.dict()
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return {"job_id": new_job.id, "status": new_job.status}


@app.get("/v1/scans")
async def list_scans(limit: int = 20, offset: int = 0, db: Session = Depends(get_db_session)):
    scans = db.query(ScanJob).order_by(ScanJob.created_at.desc()).limit(limit).offset(offset).all()
    return scans


@app.get("/v1/scan/{job_id}")
async def check_scan_status(job_id: int, db: Session = Depends(get_db_session)):
    job = db.query(ScanJob).filter(ScanJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    return job

