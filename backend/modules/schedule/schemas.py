from datetime import datetime, time
from typing import Literal
from uuid import UUID

from pydantic import BaseModel


BlockType = Literal["Personal", "Family", "Work", "Break", "PROTECTED"]


class ScheduleBlockResponse(BaseModel):
    id: UUID
    start_time: time
    label: str
    block_type: BlockType
    is_protected: bool
    sort_order: int
    notes: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
