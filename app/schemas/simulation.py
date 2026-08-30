"""Pydantic schemas for Monte Carlo simulation job tracking (Phase 6)."""
from datetime import datetime
from typing import Optional
import uuid

from pydantic import BaseModel, ConfigDict

from app.models.enums import SimulationStatus


class SimulationJobResponse(BaseModel):
    """Status and progress metadata for an asynchronous Monte Carlo simulation job."""
    model_config = ConfigDict(from_attributes=True)

    job_id: uuid.UUID
    status: SimulationStatus
    progress: int
    simulations_completed: int
    total_simulations: int
    error_message: Optional[str] = None
    created_at: datetime
