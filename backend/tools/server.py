from fastmcp import FastMCP
from integrations.sentry_client import SentryClient
from integrations.rag import RAGSystem

# Create MCP server
mcp = FastMCP("LogSense MCP Server")

# Initialize clients
sentry_client = SentryClient()
rag_system = RAGSystem()


@mcp.tool()
async def get_sentry_issue_details(issue_id: str) -> dict:
    """
    Fetch detailed information about a Sentry issue.
    
    Args:
        issue_id: The Sentry issue ID to investigate
    
    Returns:
        Dictionary with issue details, error counts, and metadata
    """
    details = await sentry_client.get_issue_details(issue_id)
    return {
        "title": details["title"],
        "level": details["level"],
        "count": details["count"],
        "first_seen": details["firstSeen"],
        "last_seen": details["lastSeen"],
    }


@mcp.tool()
async def search_knowledge_base(error_message: str, limit: int = 3) -> list:
    """
    Search for similar past incidents using semantic similarity.
    
    Args:
        error_message: The error message to search for
        limit: Maximum number of results to return
    
    Returns:
        List of similar incidents with fixes and confidence scores
    """
    similar = await rag_system.search_similar_incidents(
        error_message, 
        limit=limit
    )
    return similar


@mcp.tool()
async def get_stacktrace(issue_id: str) -> dict:
    """
    Retrieve full stack trace for debugging.
    
    Args:
        issue_id: The Sentry issue ID
    
    Returns:
        Formatted stack trace with file/line information
    """
    events = await sentry_client.get_issue_events(issue_id, limit=1)
    if not events:
        return {"error": "No events found"}
    
    event_id = events[0]["id"]
    stacktrace = await sentry_client.get_stacktrace(event_id)
    
    if "values" in stacktrace:
        frames = stacktrace["values"][0].get("stacktrace", {}).get("frames", [])
        return {
            "frames": [
                {
                    "filename": f["filename"],
                    "function": f["function"],
                    "line": f["lineNo"],
                    "code": f.get("context", []),
                }
                for f in frames[-5:]
            ]
        }
    
    return stacktrace


@mcp.resource("sentry://issues/recent")
async def get_recent_issues() -> str:
    """
    Resource: Get recent Sentry issues as formatted text.
    """
    issues = await sentry_client.get_recent_issues(limit=10)
    return "\n".join([
        f"• {issue.title} ({issue.count} occurrences)"
        for issue in issues
    ])


if __name__ == "__main__":
    # Run MCP server
    mcp.run()