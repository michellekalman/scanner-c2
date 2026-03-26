import json

from pydantic import BaseModel, model_validator


class ScanConfig(BaseModel):
    """Defines exactly what the M&C must send to the API"""
    target: str
    subnets_s3_url: str
    ports_s3_url: str
    fleet_size: int = 5
    masscan_rate: int = 1000
    partitions: int = 10

    @model_validator(mode='before')
    @classmethod
    def un_stringify(cls, data):
        """Catches raw bytes or strings from the frontend and parses them."""
        # Check if it's a string OR raw bytes
        if isinstance(data, (str, bytes)):
            return json.loads(data)
        return data
