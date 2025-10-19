#!/usr/bin/env python3
"""
MCP Server for LogSense incident investigation tools.

This implements a proper Model Context Protocol server that can be called
by MCP clients (like the AI agent) to perform incident investigation tasks.

Usage:
    python mcp_server.py

The server exposes tools for:
- Fetching Sentry issue details
- Getting stack traces
- Searching knowledge base
- Analyzing error patterns
- Getting user impact metrics
"""

import asyncio
import json
import sys
from typing import Any, Dict, List, Optional

from mcp.server.models import InitializationOptions
from mcp.server import NotificationOptions, Server
from mcp.server.stdio import stdio_server
from mcp.types import (
    Resource,
    Tool,
    TextContent,
    ImageContent,
    EmbeddedResource,
    LoggingLevel
)

# Import our tool implementations
from tools.tools import (
    get_sentry_issue_details,
    get_stacktrace,
    search_knowledge_base,
    analyze_error_frequency,
    get_user_impact
)

# Create the MCP server instance
server = Server("logsense-incident-tools")


@server.list_tools()
async def handle_list_tools() -> List[Tool]:
    """
    List all available tools that this MCP server provides.

    Returns:
        List of Tool objects describing each available tool
    """
    return [
        Tool(
            name="get_sentry_issue_details",
            description="Fetch detailed information about a Sentry issue including metadata, stats, and tags",
            inputSchema={
                "type": "object",
                "properties": {
                    "issue_id": {
                        "type": "string",
                        "description": "The Sentry issue ID to fetch details for"
                    }
                },
                "required": ["issue_id"]
            }
        ),
        Tool(
            name="get_stacktrace",
            description="Get the stack trace for the most recent event of a Sentry issue",
            inputSchema={
                "type": "object",
                "properties": {
                    "issue_id": {
                        "type": "string",
                        "description": "The Sentry issue ID to get stack trace for"
                    }
                },
                "required": ["issue_id"]
            }
        ),
        Tool(
            name="search_knowledge_base",
            description="Search for similar past incidents in the knowledge base using semantic similarity",
            inputSchema={
                "type": "object",
                "properties": {
                    "error_message": {
                        "type": "string",
                        "description": "The error message to search for similar incidents"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of results to return",
                        "default": 3,
                        "minimum": 1,
                        "maximum": 10
                    }
                },
                "required": ["error_message"]
            }
        ),
        Tool(
            name="analyze_error_frequency",
            description="Analyze error frequency patterns and trends for a Sentry issue",
            inputSchema={
                "type": "object",
                "properties": {
                    "issue_id": {
                        "type": "string",
                        "description": "The Sentry issue ID to analyze frequency for"
                    }
                },
                "required": ["issue_id"]
            }
        ),
        Tool(
            name="get_user_impact",
            description="Get user impact metrics for a Sentry issue",
            inputSchema={
                "type": "object",
                "properties": {
                    "issue_id": {
                        "type": "string",
                        "description": "The Sentry issue ID to get user impact for"
                    }
                },
                "required": ["issue_id"]
            }
        )
    ]


@server.call_tool()
async def handle_call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    """
    Handle tool calls from MCP clients.

    Args:
        name: Name of the tool to call
        arguments: Arguments to pass to the tool

    Returns:
        List of TextContent with the tool results
    """
    try:
        # Map tool names to implementation functions
        tool_map = {
            "get_sentry_issue_details": get_sentry_issue_details,
            "get_stacktrace": get_stacktrace,
            "search_knowledge_base": search_knowledge_base,
            "analyze_error_frequency": analyze_error_frequency,
            "get_user_impact": get_user_impact
        }

        if name not in tool_map:
            raise ValueError(f"Unknown tool: {name}")

        # Call the tool function
        tool_func = tool_map[name]
        result = await tool_func(**arguments)

        # Return result as TextContent
        return [
            TextContent(
                type="text",
                text=json.dumps(result, indent=2, default=str)
            )
        ]

    except Exception as e:
        # Return error as TextContent
        return [
            TextContent(
                type="text",
                text=json.dumps({
                    "error": str(e),
                    "tool": name,
                    "arguments": arguments
                }, indent=2)
            )
        ]


@server.list_resources()
async def handle_list_resources() -> List[Resource]:
    """
    List available resources (none for this server).

    Returns:
        Empty list since we don't provide resources
    """
    return []


@server.read_resource()
async def handle_read_resource(uri: str) -> str:
    """
    Read a resource (not implemented for this server).

    Args:
        uri: Resource URI to read

    Returns:
        Resource content
    """
    raise ValueError(f"Resource not found: {uri}")


async def main():
    """Main entry point for the MCP server."""
    # Configuration options
    options = InitializationOptions(
        server_name="LogSense Incident Tools",
        server_version="1.0.0",
        capabilities={
            "tools": {},
            "resources": {},
            "logging": {}
        }
    )

    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            options
        )


if __name__ == "__main__":
    # Run the MCP server
    asyncio.run(main())