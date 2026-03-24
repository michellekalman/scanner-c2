import logging
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.staticfiles import StaticFiles
import os

from sqlalchemy.orm import Session

from app.entities.scan import ScanConfig
from app.database import get_db_session
from app.entities.models import ScanJob, ScanStatus
from app.scanner import MockScannerService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

app = FastAPI(title="Scanner Control Hub")
app.mount("/static", StaticFiles(directory="static"), name="static")

MAX_CONCURRENT_SCANS = int(os.getenv("MAX_CONCURRENT_SCANS", 3))


@app.post("/v1/scan", status_code=201)
async def start_scan(config: ScanConfig, background_tasks: BackgroundTasks, db: Session = Depends(get_db_session)):
    logger.info(f"Received scan request for target: {config.target}")

    active_scans = db.query(ScanJob).filter(ScanJob.status.in_([ScanStatus.PENDING, ScanStatus.RUNNING])).count()
    if active_scans >= MAX_CONCURRENT_SCANS:
        logger.warning(
            f"Scan rejected for {config.target}: System at capacity ({active_scans}/{MAX_CONCURRENT_SCANS} active).")
        raise HTTPException(status_code=429, detail="System at capacity.")

    new_job = ScanJob(
        target=config.target,
        config=config.model_dump()
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    background_tasks.add_task(MockScannerService.run_scan, job_id=new_job.id, target=config.target)

    logger.info(f"Successfully initiated Scan Job {new_job.id} for target: {config.target}")

    return {
        "message": "Scan successfully initiated.",
        "job_id": new_job.id,
        "status": ScanStatus.PENDING
    }


@app.get("/v1/scans")
async def list_scans(limit: int = 20, offset: int = 0, db: Session = Depends(get_db_session)):
    logger.info(f"Fetching list of scans (limit={limit}, offset={offset})")
    scans = db.query(ScanJob).order_by(ScanJob.created_at.desc()).limit(limit).offset(offset).all()
    return scans


@app.get("/v1/scan/{job_id}")
async def check_scan_status(job_id: int, db: Session = Depends(get_db_session)):
    job = db.query(ScanJob).filter(ScanJob.id == job_id).first()
    if not job:
        logger.warning(f"Status check failed: Job {job_id} not found in database.")
        raise HTTPException(status_code=404, detail="Job not found.")
    return job
