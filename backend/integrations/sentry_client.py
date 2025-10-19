import httpx
from typing import List, Dict, Any, Optional
from config import settings
from models import SentryIssue
from datetime import datetime

class SentryClient: 
    def __init__(self):
        self.base_url = "https://sentry.io/api/0"
        self.headers = {
            "Authorization": f"Bearer {settings.sentry_auth_token}",
            "Content-Type": "application/json"
        }
        self.org = settings.sentry_org
        self.project = settings.sentry_project
    
    async def get_recent_issues(self, limit: int = 10, status: str = "unresolved") -> List[SentryIssue]:
        url = f"{self.base_url}/projects/{self.org}/{self.project}/issues/"
        params = {
            "query": f"is:{status}",
            "limit": limit,
            "statsPeriod": "24h"
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers = self.headers, params = params)
            response.raise_for_status()
            data = response.json()

            return [
                SentryIssue(
                    id=issue["id"],
                    title=issue["title"],
                    culprit=issue.get("culprit", "Unknown"),
                    level=issue["level"],
                    count=int(issue["count"]),
                    first_seen=datetime.fromisoformat(
                        issue["firstSeen"].replace("Z", "+00:00")
                    ),
                    last_seen=datetime.fromisoformat(
                        issue["lastSeen"].replace("Z", "+00:00")
                    ),
                    status=issue["status"],
                    metadata=issue.get("metadata", {})
                )
                for issue in data
            ]
    
    async def get_issue_details(self, issue_id: str) -> Dict[str, Any]:
        """Get detailed information about a specific issue"""
        # Correct endpoint format: /api/0/organizations/{org}/issues/{issue_id}/
        url = f"{self.base_url}/organizations/{self.org}/issues/{issue_id}/"

        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers = self.headers)
            response.raise_for_status()
            return response.json()
    
    async def get_issue_events(
        self,
        issue_id: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Get recent events for an issue (stack traces, breadcrumbs)"""
        # Correct endpoint format: /api/0/organizations/{org}/issues/{issue_id}/events/
        url = f"{self.base_url}/organizations/{self.org}/issues/{issue_id}/events/"
        params = {"limit": limit}

        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers=self.headers,
                params=params
            )
            response.raise_for_status()
            return response.json()
    
    async def get_stacktrace(self, event_id: str) -> Dict[str, Any]:
        """Get full stack trace for an event"""
        url = f"{self.base_url}/projects/{self.org}/{self.project}/events/{event_id}/"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers)
            response.raise_for_status()
            event = response.json()
            
            # Extract stack trace
            entries = event.get("entries", [])
            for entry in entries:
                if entry["type"] == "exception":
                    return entry["data"]
            
            return {}