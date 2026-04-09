import logging
import os
from urllib.parse import urlparse

import boto3
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import FileResponse, Response

from app.database import get_db_session
from app.entities.models import ScanJob, ScanStatus
from app.entities.scan import ScanConfig
from app.scanner import MockScannerService


MAX_CONCURRENT_SCANS = int(os.getenv("MAX_CONCURRENT_SCANS", 3))

load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

app = FastAPI(title="Scanner Control Hub")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# This ensures that <script src="/assets/index.js"> works.
app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")


@app.get("/", include_in_schema=False)
async def read_index():
    return FileResponse("static/index.html")


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


@app.get("/manifest.json", include_in_schema=False)
async def silence_manifest():
    return Response(status_code=204)


@app.api_route("/api/apps/{path:path}", methods=["GET", "POST", "PUT", "DELETE"], include_in_schema=False)
async def silence_base44_internal_calls(path: str):
    """
    Catch-all for Base44 analytics, user auth, and settings calls.
    Returns 204 (No Content) to keep the frontend happy and the logs clean.
    """
    return Response(status_code=204)


@app.get("/api/v1/fetch-s3-content")
async def fetch_s3_content(url: str):
    try:
        parsed_url = urlparse(url)
        if "digitaloceanspaces.com" in url:
            domain_parts = parsed_url.netloc.split('.')
            bucket = domain_parts[0]
            region = domain_parts[1]
            custom_endpoint = f"https://{region}.digitaloceanspaces.com"
            key = parsed_url.path.lstrip("/")
            s3_client = boto3.client('s3', endpoint_url=custom_endpoint)
        else:
            raise HTTPException(status_code=400, detail="Unsupported URL format")

        response = s3_client.get_object(Bucket=bucket, Key=key)
        content = response['Body'].read().decode('utf-8')
        return {"content": content}
    except Exception as e:
        print(f"S3 Fetch Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

