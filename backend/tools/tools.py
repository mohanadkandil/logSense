"""
MCP Tool implementations for LogSense incident investigation.
These tools are called by the AI agent during investigation workflow.
"""

from typing import Dict, Any, List
import json
from datetime import datetime
from integrations.sentry_client import SentryClient
from integrations.rag import RAGSystem


# Initialize clients
sentry_client = SentryClient()
rag_system = RAGSystem()


async def get_sentry_issue_details(issue_id: str) -> Dict[str, Any]:
    """
    Fetch detailed information about a Sentry issue.

    Args:
        issue_id: Sentry issue ID

    Returns:
        Issue details including metadata, stats, and tags
    """
    try:
        details = await sentry_client.get_issue_details(issue_id)

        # Extract relevant fields
        return {
            "id": details.get("id"),
            "title": details.get("title"),
            "culprit": details.get("culprit"),
            "level": details.get("level"),
            "status": details.get("status"),
            "count": details.get("count"),
            "user_count": details.get("userCount", 0),
            "first_seen": details.get("firstSeen"),
            "last_seen": details.get("lastSeen"),
            "metadata": details.get("metadata"),
            "tags": [tag["key"] for tag in details.get("tags", [])][:5],
            "permalink": details.get("permalink")
        }
    except Exception as e:
        return {
            "error": str(e),
            "issue_id": issue_id
        }


async def get_stacktrace(issue_id: str) -> Dict[str, Any]:
    """
    Get stack trace for the most recent event of an issue.

    Args:
        issue_id: Sentry issue ID

    Returns:
        Stack trace with frames and exception details
    """
    try:
        # Get recent events for the issue
        events = await sentry_client.get_issue_events(issue_id, limit=1)

        if not events:
            return {"error": "No events found", "issue_id": issue_id}

        event = events[0]

        # Extract stack trace from event
        entries = event.get("entries", [])
        for entry in entries:
            if entry.get("type") == "exception":
                exception_data = entry.get("data", {})
                values = exception_data.get("values", [])

                if values:
                    exception = values[0]
                    return {
                        "type": exception.get("type", "Unknown"),
                        "value": exception.get("value", ""),
                        "stacktrace": exception.get("stacktrace", {}),
                        "mechanism": exception.get("mechanism", {})
                    }

        # Fallback: return basic event data
        return {
            "event_id": event.get("id"),
            "platform": event.get("platform"),
            "message": event.get("message", ""),
            "entries": len(entries)
        }

    except Exception as e:
        return {
            "error": str(e),
            "issue_id": issue_id
        }


async def search_knowledge_base(
    error_message: str,
    limit: int = 3
) -> List[Dict[str, Any]]:
    """
    Search for similar past incidents in the knowledge base.

    Args:
        error_message: Error message to search for
        limit: Maximum number of results

    Returns:
        List of similar incidents with fixes and similarity scores
    """
    try:
        results = await rag_system.search_similar_incidents(
            error_message=error_message,
            limit=limit
        )

        # Format results for agent consumption
        formatted_results = []
        for result in results:
            formatted_results.append({
                "incident_id": result.get("incident_id"),
                "error_message": result.get("error_message"),
                "root_cause": result.get("root_cause"),
                "fix": result.get("fix"),
                "similarity": round(result.get("score", 0) * 100, 1),
                "confidence": result.get("metadata", {}).get("confidence", 0)
            })

        return formatted_results

    except Exception as e:
        # Return empty list if knowledge base is not available
        return []


async def analyze_error_frequency(issue_id: str) -> Dict[str, Any]:
    """
    Analyze error frequency patterns and trends.

    Args:
        issue_id: Sentry issue ID

    Returns:
        Frequency analysis with trend information
    """
    try:
        details = await sentry_client.get_issue_details(issue_id)

        # Get stats for different time periods
        stats = details.get("stats", {})

        # Calculate trend (simplified)
        if "24h" in stats:
            hourly_data = stats["24h"]

            # Get first half and second half averages
            mid_point = len(hourly_data) // 2
            first_half = [count for _, count in hourly_data[:mid_point]]
            second_half = [count for _, count in hourly_data[mid_point:]]

            first_avg = sum(first_half) / len(first_half) if first_half else 0
            second_avg = sum(second_half) / len(second_half) if second_half else 0

            if second_avg > first_avg * 1.5:
                trend = "increasing"
            elif second_avg < first_avg * 0.5:
                trend = "decreasing"
            else:
                trend = "stable"
        else:
            trend = "unknown"

        return {
            "issue_id": issue_id,
            "total_occurrences": details.get("count", 0),
            "trend": trend,
            "first_seen": details.get("firstSeen"),
            "last_seen": details.get("lastSeen"),
            "frequency": "high" if int(details.get("count", 0)) > 100 else "medium" if int(details.get("count", 0)) > 10 else "low"
        }

    except Exception as e:
        return {
            "error": str(e),
            "issue_id": issue_id,
            "trend": "unknown"
        }


async def get_user_impact(issue_id: str) -> Dict[str, Any]:
    """
    Get user impact metrics for an issue.

    Args:
        issue_id: Sentry issue ID

    Returns:
        User impact data
    """
    try:
        details = await sentry_client.get_issue_details(issue_id)

        user_count = details.get("userCount", 0)
        total_count = details.get("count", 0)

        # Determine impact level
        if user_count > 1000:
            impact_level = "critical"
        elif user_count > 100:
            impact_level = "high"
        elif user_count > 10:
            impact_level = "medium"
        else:
            impact_level = "low"

        return {
            "issue_id": issue_id,
            "affected_users": user_count,
            "total_occurrences": total_count,
            "impact_level": impact_level,
            "avg_per_user": round(total_count / user_count, 2) if user_count > 0 else 0
        }

    except Exception as e:
        return {
            "error": str(e),
            "issue_id": issue_id,
            "affected_users": 0,
            "impact_level": "unknown"
        }


# Export all tools
__all__ = [
    "get_sentry_issue_details",
    "get_stacktrace",
    "search_knowledge_base",
    "analyze_error_frequency",
    "get_user_impact"
]