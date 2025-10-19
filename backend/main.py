from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
from datetime import datetime
import json

from config import settings
from models import SentryIssue, IncidentStatus
from integrations.sentry_client import SentryClient
from integrations.rag import RAGSystem
# Choose agent implementation based on configuration
if settings.use_autonomous_agent:
    from agent.autonomous_agent import AutonomousMCPAgent as MCPIncidentAgent
elif settings.use_real_mcp:
    from agent.mcp_workflow import RealMCPIncidentAgent as MCPIncidentAgent
else:
    from agent.workflow import MCPIncidentAgent

# Initialize FastAPI
app = FastAPI(
    title="LogSense API",
    description="AI-powered incident intelligence platform",
    version="1.0.0"
)

# CORS - allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services (global instances)
sentry_client = SentryClient()
rag_system = RAGSystem()


# ==================== ROUTES ====================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "name": "LogSense API",
        "version": "1.0.0",
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/api/health")
async def health_check():
    """Detailed health check with service status"""
    try:
        # Test Sentry connection
        await sentry_client.get_recent_issues(limit=1)
        sentry_status = "connected"
    except Exception as e:
        sentry_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "sentry": sentry_status,
            "qdrant": "connected",  # Assume healthy if no error
            "openai": "configured" if settings.openai_api_key else "missing"
        },
        "config": {
            "sentry_org": settings.sentry_org,
            "sentry_project": settings.sentry_project,
            "qdrant_url": settings.qdrant_url
        }
    }


@app.get("/api/incidents", response_model=List[SentryIssue])
async def get_incidents(
    limit: int = 10,
    status: str = "unresolved"
):
    """
    Get recent incidents from Sentry.
    
    Args:
        limit: Maximum number of incidents to return (default: 10)
        status: Filter by status - "unresolved", "resolved", "ignored" (default: unresolved)
    
    Returns:
        List of SentryIssue objects
    """
    try:
        issues = await sentry_client.get_recent_issues(limit=limit, status=status)
        return issues
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to fetch incidents: {str(e)}"
        )


@app.get("/api/incidents/{issue_id}")
async def get_incident_details(issue_id: str):
    """
    Get detailed information about a specific incident.
    
    Args:
        issue_id: Sentry issue ID
    
    Returns:
        Detailed issue information including metadata, tags, and stats
    """
    try:
        details = await sentry_client.get_issue_details(issue_id)
        return details
    except Exception as e:
        raise HTTPException(
            status_code=404, 
            detail=f"Issue not found: {str(e)}"
        )


@app.websocket("/ws/analyze/{issue_id}")
async def analyze_incident_stream(websocket: WebSocket, issue_id: str):
    """
    WebSocket endpoint for real-time AI investigation streaming.
    
    Flow:
    1. Client connects to ws://localhost:8000/ws/analyze/{issue_id}
    2. Server sends "start" message
    3. Server streams "step" messages as agent investigates
    4. Server sends "complete" message with final analysis
    
    Message Types:
    - start: Investigation begins
    - step: Agent progress update (MCP tool calls, AI reasoning)
    - complete: Final analysis with root cause and fixes
    - error: Something went wrong
    """
    await websocket.accept()
    print(f"[WebSocket] Client connected for issue {issue_id}")
    
    try:
        # Fetch issue details
        issue = await sentry_client.get_issue_details(issue_id)
        error_message = issue["title"]
        
        print(f"[WebSocket] Starting analysis for: {error_message}")
        
        # Stream callback function
        async def stream_callback(message: Dict[str, Any]):
            """Send updates to frontend via WebSocket"""
            await websocket.send_json(message)
            print(f"[WebSocket] Sent: {message['type']}")
        
        # Create agent with streaming
        agent = MCPIncidentAgent(stream_callback=stream_callback)
        
        # Send initial message
        await websocket.send_json({
            "type": "start",
            "content": {
                "issue_id": issue_id,
                "error_message": error_message,
                "timestamp": datetime.utcnow().isoformat()
            }
        })
        
        # Run investigation (streams updates automatically)
        result = await agent.investigate(issue_id, error_message)
        
        print(f"[WebSocket] Investigation complete. Confidence: {result['confidence']}")
        
        # Store in knowledge base if high confidence
        if result["confidence"] > 0.7 and result["suggested_fixes"]:
            try:
                await rag_system.add_incident(
                    incident_id=issue_id,
                    error_message=error_message,
                    root_cause=result["root_cause"],
                    fix=result["suggested_fixes"][0]["title"],
                    metadata={
                        "confidence": result["confidence"],
                        "timestamp": datetime.utcnow().isoformat(),
                        "fixes_count": len(result["suggested_fixes"])
                    }
                )
                print(f"[RAG] Stored incident {issue_id} in knowledge base")
            except Exception as e:
                print(f"[RAG] Failed to store: {e}")
        
    except WebSocketDisconnect:
        print(f"[WebSocket] Client disconnected from issue {issue_id}")
    
    except Exception as e:
        print(f"[WebSocket] Error: {e}")
        try:
            await websocket.send_json({
                "type": "error",
                "content": {
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                }
            })
        except:
            pass
        await websocket.close()


@app.post("/api/incidents/{issue_id}/resolve")
async def resolve_incident(
    issue_id: str,
    root_cause: str,
    fix: str,
    confidence: float
):
    """
    Manually mark an incident as resolved and add to knowledge base.
    
    Args:
        issue_id: Sentry issue ID
        root_cause: Description of the root cause
        fix: Description of the fix applied
        confidence: Confidence score (0.0 to 1.0)
    
    Returns:
        Success message
    """
    try:
        issue = await sentry_client.get_issue_details(issue_id)
        
        await rag_system.add_incident(
            incident_id=issue_id,
            error_message=issue["title"],
            root_cause=root_cause,
            fix=fix,
            metadata={
                "confidence": confidence,
                "timestamp": datetime.utcnow().isoformat(),
                "resolved_by": "manual",
                "service": issue.get("project", {}).get("slug", "unknown")
            }
        )
        
        return {
            "success": True,
            "message": f"Incident {issue_id} added to knowledge base",
            "incident_id": issue_id
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to resolve incident: {str(e)}"
        )


@app.get("/api/knowledge/search")
async def search_knowledge_base(query: str, limit: int = 5):
    """
    Search knowledge base for similar past incidents.
    
    Args:
        query: Error message or description to search for
        limit: Maximum number of results (default: 5)
    
    Returns:
        List of similar incidents with fixes and similarity scores
    """
    try:
        results = await rag_system.search_similar_incidents(
            error_message=query, 
            limit=limit
        )
        return {
            "query": query,
            "results": results,
            "count": len(results)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Search failed: {str(e)}"
        )


@app.get("/api/stats")
async def get_stats():
    """
    Get platform statistics.
    
    Returns:
        Stats about incidents, resolution rates, etc.
    """
    try:
        # Get recent issues
        unresolved = await sentry_client.get_recent_issues(limit=100, status="unresolved")
        resolved = await sentry_client.get_recent_issues(limit=100, status="resolved")
        
        return {
            "incidents": {
                "unresolved": len(unresolved),
                "resolved": len(resolved),
                "total": len(unresolved) + len(resolved)
            },
            "resolution_rate": len(resolved) / (len(resolved) + len(unresolved)) if (len(resolved) + len(unresolved)) > 0 else 0,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== STARTUP ====================

@app.on_event("startup")
async def startup_event():
    """Run on server startup"""
    print("=" * 60)
    print("🚀 LogSense API Starting...")
    print("=" * 60)
    print(f"Environment: {settings.environment}")
    print(f"Sentry Org: {settings.sentry_org}")
    print(f"Sentry Project: {settings.sentry_project}")
    print(f"Qdrant URL: {settings.qdrant_url}")
    print(f"OpenAI Configured: {'✅' if settings.openai_api_key else '❌'}")
    print("=" * 60)


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("👋 LogSense API Shutting down...")


# ==================== RUN ====================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )