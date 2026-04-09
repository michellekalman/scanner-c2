import json
from typing import Optional, List
from pydantic import BaseModel, model_validator


class ScanConfig(BaseModel):
    """Defines exactly what the M&C must send to the API"""
    target: str
    subnets_s3_url: Optional[str] = None
    manual_subnets: Optional[List[str]] = None
    ports_s3_url: Optional[str] = None
    manual_ports: Optional[List[int]] = None
    fleet_size: int = 5
    masscan_rate: int = 1000
    partitions: int = 10

    @model_validator(mode='before')
    @classmethod
    def un_stringify(cls, data):
        """Catches raw bytes or strings from the frontend and parses them."""
        if isinstance(data, (str, bytes)):
            return json.loads(data)
        return data

    @model_validator(mode='after')
    def check_sources(self):
        """Ensures at least one source is provided for both subnets and ports."""

        # Validate Subnets
        if not self.subnets_s3_url and not self.manual_subnets:
            raise ValueError('Either subnets_s3_url or manual_subnets must be provided')

        # Validate Ports
        if not self.ports_s3_url and not self.manual_ports:
            raise ValueError('Either ports_s3_url or manual_ports must be provided')

        return self