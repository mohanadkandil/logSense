import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from prisma import Prisma


class DatabaseService:
    """Service for saving and retrieving analysis results"""

    def __init__(self):
        self.db = Prisma()
        self._connected = False

    async def ensure_connected(self):
        """Ensure database connection is active"""
        if not self._connected:
            await self.db.connect()
            self._connected = True

    async def connect(self):
        """Connect to the database"""
        await self.ensure_connected()

    async def disconnect(self):
        """Disconnect from the database"""
        if self._connected:
            await self.db.disconnect()
            self._connected = False

    async def save_analysis(
        self,
        issue_id: str,
        error_message: str,
        root_cause: Optional[str] = None,
        confidence: Optional[float] = None,
        suggested_fixes: Optional[List[Dict[str, Any]]] = None,
        similar_incidents: Optional[List[Dict[str, Any]]] = None,
        duration_seconds: Optional[float] = None,
        steps: Optional[List[Dict[str, Any]]] = None,
        status: str = "completed"
    ) -> str:
        """
        Save analysis results to database

        Returns:
            analysis_id: ID of the saved analysis
        """
        await self.ensure_connected()

        try:
            # Create analysis record
            analysis = await self.db.analysis.create(
                data={
                    "issueId": issue_id,
                    "errorMessage": error_message,
                    "rootCause": root_cause,
                    "confidence": confidence,
                    "suggestedFixes": json.dumps(suggested_fixes) if suggested_fixes else None,
                    "similarIncidents": json.dumps(similar_incidents) if similar_incidents else None,
                    "durationSeconds": duration_seconds,
                    "status": status
                }
            )

            # Save analysis steps if provided
            if steps:
                for step in steps:
                    await self.db.analysisstep.create(
                        data={
                            "analysisId": analysis.id,
                            "step": step.get("step", ""),
                            "tool": step.get("tool"),
                            "output": step.get("output", ""),
                            "timestamp": datetime.fromisoformat(step.get("timestamp", datetime.utcnow().isoformat()).replace('Z', '+00:00'))
                        }
                    )

            return analysis.id

        except Exception as e:
            raise e

    async def get_analysis(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        """Get analysis by ID with steps"""
        await self.ensure_connected()

        try:
            analysis = await self.db.analysis.find_unique(
                where={"id": analysis_id},
                include={"steps": True}
            )

            if not analysis:
                return None

            return {
                "id": analysis.id,
                "issue_id": analysis.issueId,
                "error_message": analysis.errorMessage,
                "root_cause": analysis.rootCause,
                "confidence": analysis.confidence,
                "suggested_fixes": json.loads(analysis.suggestedFixes) if analysis.suggestedFixes else None,
                "similar_incidents": json.loads(analysis.similarIncidents) if analysis.similarIncidents else None,
                "duration_seconds": analysis.durationSeconds,
                "status": analysis.status,
                "created_at": analysis.createdAt.isoformat(),
                "steps": [
                    {
                        "step": step.step,
                        "tool": step.tool,
                        "output": step.output,
                        "timestamp": step.timestamp.isoformat()
                    }
                    for step in analysis.steps
                ]
            }

        except Exception as e:
            raise e

    async def get_analysis_by_issue(self, issue_id: str) -> Optional[Dict[str, Any]]:
        """Get most recent analysis for an issue"""
        await self.ensure_connected()

        try:
            analysis = await self.db.analysis.find_first(
                where={"issueId": issue_id},
                include={"steps": True},
                order={"createdAt": "desc"}
            )

            if not analysis:
                return None

            return {
                "id": analysis.id,
                "issue_id": analysis.issueId,
                "error_message": analysis.errorMessage,
                "root_cause": analysis.rootCause,
                "confidence": analysis.confidence,
                "suggested_fixes": json.loads(analysis.suggestedFixes) if analysis.suggestedFixes else None,
                "similar_incidents": json.loads(analysis.similarIncidents) if analysis.similarIncidents else None,
                "duration_seconds": analysis.durationSeconds,
                "status": analysis.status,
                "created_at": analysis.createdAt.isoformat(),
                "steps": [
                    {
                        "step": step.step,
                        "tool": step.tool,
                        "output": step.output,
                        "timestamp": step.timestamp.isoformat()
                    }
                    for step in analysis.steps
                ]
            }

        except Exception as e:
            raise e

    async def list_analyses(self, limit: int = 20) -> List[Dict[str, Any]]:
        """List recent analyses"""
        await self.ensure_connected()

        try:
            analyses = await self.db.analysis.find_many(
                include={"steps": True},
                order={"createdAt": "desc"},
                take=limit
            )

            return [
                {
                    "id": analysis.id,
                    "issue_id": analysis.issueId,
                    "error_message": analysis.errorMessage,
                    "root_cause": analysis.rootCause,
                    "confidence": analysis.confidence,
                    "suggested_fixes": json.loads(analysis.suggestedFixes) if analysis.suggestedFixes else None,
                    "similar_incidents": json.loads(analysis.similarIncidents) if analysis.similarIncidents else None,
                    "duration_seconds": analysis.durationSeconds,
                    "status": analysis.status,
                    "created_at": analysis.createdAt.isoformat(),
                    "steps": [
                        {
                            "step": step.step,
                            "tool": step.tool,
                            "output": step.output,
                            "timestamp": step.timestamp.isoformat()
                        }
                        for step in analysis.steps
                    ]
                }
                for analysis in analyses
            ]

        except Exception as e:
            raise e


# Global instance
db_service = DatabaseService()