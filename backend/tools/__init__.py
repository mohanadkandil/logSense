"""
MCP (Model Context Protocol) module for LogSense.
Contains tool implementations for incident investigation.
"""

from .tools import (
    get_sentry_issue_details,
    get_stacktrace,
    search_knowledge_base,
    analyze_error_frequency,
    get_user_impact
)

__all__ = [
    "get_sentry_issue_details",
    "get_stacktrace",
    "search_knowledge_base",
    "analyze_error_frequency",
    "get_user_impact"
]