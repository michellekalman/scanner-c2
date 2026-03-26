import asyncio
from app.database import SessionLocal
from app.entities.models import ScanJob, ScanStatus
import logging

logger = logging.getLogger(__name__)


class MockScannerService:
    """
    A temporary mock class to simulate the Axiom/tmux scanning logic.
    """

    @staticmethod
    async def run_scan(job_id: int, **kwargs):
        logger.info(f"Initiating scan sequence for Job {job_id}...")
        db = SessionLocal()
        try:
            job = db.query(ScanJob).filter(ScanJob.id == job_id).first()
            if job:
                job.status = ScanStatus.RUNNING
                db.commit()

            # Simulate the scan taking 10 seconds to run
            await asyncio.sleep(10)

            if job:
                job.status = ScanStatus.COMPLETED
                db.commit()

            logger.info(f"Scan completed for Job {job_id}!")

        finally:
            db.close()
