from pydantic import BaseModel


class ScanConfig(BaseModel):
    """Defines exactly what the M&C must send to the API"""
    target: str
    subnets_s3_url: str
    ports_s3_url: str
    fleet_size: int = 5
    masscan_rate: int = 1000
    partitions: int = 10
