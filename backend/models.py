from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class SeverityLevel(str, Enum):
    CRITICAL = "critical"
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"

class IncidentStatus(str, Enum):
    NEW = "new"
    ANALYZING = "analyzing"
    RESOLVED = "resolved"
    ARCHIVED = "archived"

class SentryIssue(BaseModel):
    id: str
    title: str
    culprit: str
    level: str
    count: int
    first_seen: datetime
    last_seen: datetime
    status: str
    metadata: Dict[str, Any]


class AgentStep(BaseModel):
    step: str
    tool: Optional[str] = None
    output: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class IncidentAnalysis(BaseModel):
    incident_id: str
    root_cause: str
    confidence: float
    suggested_fixes: List[Dict[str, Any]]
    similar_incidents: List[Dict[str, Any]]
    steps: List[AgentStep]
    duration_seconds: float


class WebSocketMessage(BaseModel):
    type: str  # "step", "thinking", "complete", "error"
    content: Any
    timestamp: datetime = Field(default_factory=datetime.utcnow)