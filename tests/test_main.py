from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app, MAX_CONCURRENT_SCANS
from app.database import get_db_session

client = TestClient(app)
INSTANCE_ID = 99


def test_start_scan_success():
    """Test that a user can successfully start a scan when the system is not full."""

    mock_db = MagicMock()
    # Tells the fake DB- when the API checks for active scans, return 0
    mock_db.query.return_value.filter.return_value.count.return_value = 0

    def mock_refresh(instance):
        instance.id = INSTANCE_ID

    mock_db.refresh.side_effect = mock_refresh

    # Tells FastAPI to use the fake db instead of PostgreSQL
    app.dependency_overrides[get_db_session] = lambda: mock_db

    # Intercept the background task, so we don't actually wait 10 seconds
    with patch("app.main.MockScannerService.run_scan") as mock_run_scan:
        payload = {
            "target": "austria",
            "subnets_s3_url": "https://buck1.ams3.digitaloceanspaces.com/src/subnets.txt",
            "ports_s3_url": "https://buck1.ams3.digitaloceanspaces.com/src/ports.txt"
        }
        response = client.post("/v1/scan", json=payload)

        assert response.status_code == 201
        data = response.json()

        assert data["message"] == "Scan successfully initiated."
        assert data["job_id"] == INSTANCE_ID
        assert data["status"] == "pending"

        # Verify the background task was actually triggered
        assert mock_run_scan.called

    app.dependency_overrides.clear()


def test_start_scan_system_at_capacity():
    """Test that the API correctly rejects a scan if the system is full."""

    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.count.return_value = MAX_CONCURRENT_SCANS

    app.dependency_overrides[get_db_session] = lambda: mock_db

    payload = {
        "target": "germany",
        "subnets_s3_url": "https://buck1.ams3.digitaloceanspaces.com/src/subnets.txt",
        "ports_s3_url": "https://buck1.ams3.digitaloceanspaces.com/src/ports.txt"
    }
    response = client.post("/v1/scan", json=payload)

    assert response.status_code == 429
    assert response.json() == {"detail": "System at capacity."}

    app.dependency_overrides.clear()
