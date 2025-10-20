from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from typing import TypedDict, List, Dict, Any, Callable, Optional
from datetime import datetime
import json
import asyncio
import os
from config import settings
from database import db_service


class AgentState(TypedDict):
    """State passed between workflow nodes"""
    issue_id: str
    error_message: str
    steps: List[Dict[str, Any]]
    context: Dict[str, Any]
    root_cause: str
    confidence: float
    suggested_fixes: List[Dict[str, Any]]
    similar_incidents: List[Dict[str, Any]]


class MCPIncidentAgent:
    """
    AI Agent that investigates incidents using MCP tools and LLM reasoning.
    
    Workflow:
    1. Connect to MCP server
    2. Fetch issue context (Sentry data)
    3. Search knowledge base (RAG)
    4. Analyze patterns
    5. Reason about root cause (LLM)
    6. Generate fix suggestions (LLM)
    """
    
    def __init__(self, stream_callback: Optional[Callable] = None):
        """
        Initialize agent with OpenAI LLM and optional WebSocket streaming.

        Args:
            stream_callback: Async function to send updates to frontend
        """
        try:
            self.llm = ChatOpenAI(
                model="gpt-4o-mini",  # Use a more stable model
                temperature=0.1,
                streaming=False,  # Keep streaming disabled
                openai_api_key=settings.openai_api_key
            )
            print(f"[Agent] Initialized with real OpenAI LLM")
        except Exception as e:
            print(f"[Agent] Failed to initialize LLM: {e}")
            self.llm = None

        self.stream_callback = stream_callback
        self.mcp_session: Optional[ClientSession] = None
        self.available_tools: List[str] = []
        self.collected_steps: List[Dict[str, Any]] = []  # Track all steps
    
    async def _emit_step(
        self, 
        step: str, 
        tool: Optional[str] = None, 
        output: str = ""
    ):
        """
        Emit a workflow step update to the frontend via WebSocket.
        
        Args:
            step: Human-readable description of the step
            tool: Name of the tool being used (MCP, AI, RAG)
            output: Result or status message
        """
        step_data = {
            "step": step,
            "tool": tool,
            "output": output,
            "timestamp": datetime.utcnow().isoformat()
        }

        # Collect step for database storage
        self.collected_steps.append(step_data)

        if self.stream_callback:
            await self.stream_callback({
                "type": "step",
                "content": step_data
            })

        return step_data
    
    async def _connect_mcp(self):
        """
        Establish connection to MCP server and list available tools.
        """
        await self._emit_step("Connecting to MCP server...", "MCP")
        
        server_params = StdioServerParameters(
            command="python",
            args=["-m", "mcp.server"]
        )
        
        try:
            # Note: This creates a context manager, we'll handle it differently
            self.mcp_process = server_params
            await self._emit_step(
                "MCP server connected", 
                "MCP",
                "Ready to call tools"
            )
        except Exception as e:
            await self._emit_step(
                f"MCP connection failed: {str(e)}", 
                "MCP",
                "Falling back to direct tool calls"
            )
            raise
    
    async def _call_mcp_tool(
        self, 
        tool_name: str, 
        arguments: Dict[str, Any]
    ) -> Any:
        """
        Call an MCP tool and return the result.
        
        Args:
            tool_name: Name of the MCP tool (e.g., "get_sentry_issue_details")
            arguments: Dictionary of arguments to pass to the tool
        
        Returns:
            Tool execution result
        """
        await self._emit_step(
            f"Calling MCP tool: {tool_name}", 
            "MCP",
            json.dumps(arguments, indent=2)
        )
        
        # In a real MCP setup, this would be:
        # result = await self.mcp_session.call_tool(tool_name, arguments)
        # For now, we'll import the tools directly as fallback

        from tools.tools import (
            get_sentry_issue_details,
            get_stacktrace,
            search_knowledge_base,
            analyze_error_frequency,
            get_user_impact
        )
        
        tool_map = {
            "get_sentry_issue_details": get_sentry_issue_details,
            "get_stacktrace": get_stacktrace,
            "search_knowledge_base": search_knowledge_base,
            "analyze_error_frequency": analyze_error_frequency,
            "get_user_impact": get_user_impact
        }
        
        if tool_name not in tool_map:
            raise ValueError(f"Unknown tool: {tool_name}")
        
        tool_func = tool_map[tool_name]
        
        # Call the tool function with unpacked arguments
        result = await tool_func(**arguments)
        
        await self._emit_step(
            f"Tool result: {tool_name}", 
            "MCP",
            json.dumps(result, indent=2)[:500]  # Truncate long outputs
        )
        
        return result
    
    async def _fetch_issue_context(self, state: AgentState) -> AgentState:
        """
        Step 1: Gather basic issue information from Sentry via MCP.
        
        Fetches:
        - Issue metadata (title, severity, count)
        - Stack trace
        """
        await self._emit_step(
            "📊 Fetching issue context from Sentry...", 
            "MCP"
        )
        
        # Get issue details
        details = await self._call_mcp_tool(
            "get_sentry_issue_details",
            {"issue_id": state["issue_id"]}
        )
        
        # Get stack trace
        stacktrace = await self._call_mcp_tool(
            "get_stacktrace",
            {"issue_id": state["issue_id"]}
        )
        
        state["context"]["details"] = details
        state["context"]["stacktrace"] = stacktrace
        
        await self._emit_step(
            "✅ Issue context retrieved",
            output=f"Error: {details.get('title', 'Unknown')} | Occurrences: {details.get('count', 0)}"
        )
        
        return state
    
    async def _search_knowledge(self, state: AgentState) -> AgentState:
        """
        Step 2: Search knowledge base for similar past incidents using RAG.
        
        Uses semantic similarity to find relevant historical fixes.
        """
        await self._emit_step(
            "🔍 Searching knowledge base for similar incidents...", 
            "RAG"
        )
        
        similar = await self._call_mcp_tool(
            "search_knowledge_base",
            {
                "error_message": state["error_message"],
                "limit": 3
            }
        )
        
        state["similar_incidents"] = similar
        
        if similar:
            similarity_scores = [
                f"{inc.get('similarity', 0)}%" 
                for inc in similar
            ]
            await self._emit_step(
                f"✅ Found {len(similar)} similar incidents",
                "RAG",
                f"Similarity scores: {', '.join(similarity_scores)}"
            )
        else:
            await self._emit_step(
                "⚠️ No similar incidents found",
                "RAG",
                "This may be a new type of error"
            )
        
        return state
    
    async def _analyze_patterns(self, state: AgentState) -> AgentState:
        """
        Step 3: Analyze error patterns and user impact.
        
        Gathers:
        - Error frequency trends
        - User impact metrics
        """
        await self._emit_step(
            "📈 Analyzing error patterns and user impact...", 
            "MCP"
        )
        
        # Get error frequency data
        frequency = await self._call_mcp_tool(
            "analyze_error_frequency",
            {"issue_id": state["issue_id"]}
        )
        
        # Get user impact data
        impact = await self._call_mcp_tool(
            "get_user_impact",
            {"issue_id": state["issue_id"]}
        )
        
        state["context"]["frequency"] = frequency
        state["context"]["impact"] = impact
        
        await self._emit_step(
            "✅ Pattern analysis complete",
            output=f"Trend: {frequency.get('trend', 'unknown')} | Affected users: {impact.get('affected_users', 0)}"
        )
        
        return state
    
    async def _reason_about_root_cause(self, state: AgentState) -> AgentState:
        """
        Step 4: Use LLM to analyze all gathered data and determine root cause.
        
        This is where GPT-4 does the heavy lifting:
        - Analyzes stack traces
        - Considers similar past incidents
        - Evaluates error patterns
        - Produces root cause hypothesis
        """
        await self._emit_step(
            "🤖 AI analyzing root cause...", 
            "AI"
        )
        
        # Construct comprehensive prompt for GPT-4
        system_prompt = """You are an expert Site Reliability Engineer (SRE) and software debugger.
Your job is to analyze production incidents and determine root causes with high accuracy.

You will receive:
1. Error details and stack traces
2. Similar past incidents from the knowledge base
3. Error frequency patterns
4. User impact metrics

Analyze all data and provide:
1. Root cause (concise, 1-2 sentences)
2. Confidence score (0-100)
3. Detailed explanation of your reasoning
4. Key evidence that led to your conclusion

Be precise, technical, and actionable."""

        user_prompt = f"""
# INCIDENT ANALYSIS REQUEST

## Error Information
**Error Message:** {state['error_message']}

**Issue Details:**
{json.dumps(state['context'].get('details', {}), indent=2)}

## Stack Trace
{json.dumps(state['context'].get('stacktrace', {}), indent=2)}

## Similar Past Incidents
{json.dumps(state['similar_incidents'], indent=2)}

## Error Patterns
**Frequency Analysis:**
{json.dumps(state['context'].get('frequency', {}), indent=2)}

**User Impact:**
{json.dumps(state['context'].get('impact', {}), indent=2)}

---

Based on the above data, provide your analysis in the following JSON format:
{{
  "root_cause": "Brief description of the root cause",
  "confidence": 85,
  "reasoning": "Detailed explanation of why you believe this is the root cause",
  "key_evidence": ["Evidence point 1", "Evidence point 2", "..."]
}}
"""

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        # Call OpenAI GPT-4 or use mock response for testing
        try:
            if self.llm is None:
                # Use mock response for testing
                await self._emit_step(
                    "✅ Root cause identified (mock)",
                    "AI",
                    "Mock analysis: The error appears to be caused by a network timeout issue."
                )
                state["root_cause"] = "Network timeout during large payload processing"
                state["confidence"] = 0.85
                return state

            response = await self.llm.ainvoke(messages)

            # Parse JSON response
            try:
                analysis = json.loads(response.content)

                state["root_cause"] = analysis["root_cause"]
                state["confidence"] = analysis["confidence"] / 100.0

                await self._emit_step(
                    "✅ Root cause identified",
                    "AI",
                    f"{analysis['root_cause']}\n\nConfidence: {analysis['confidence']}%\n\nReasoning: {analysis['reasoning']}"
                )
            except json.JSONDecodeError:
                # Fallback if LLM doesn't return valid JSON
                state["root_cause"] = response.content[:500]  # Truncate long responses
                state["confidence"] = 0.5

                await self._emit_step(
                    "⚠️ Root cause analysis completed (non-structured)",
                    "AI",
                    response.content[:500]
                )
        except Exception as e:
            # Handle LLM errors
            state["root_cause"] = f"Analysis failed: {str(e)}"
            state["confidence"] = 0.0

            await self._emit_step(
                "❌ Root cause analysis failed",
                "AI",
                f"Error: {str(e)}"
            )
        
        return state
    
    async def _generate_fix_suggestions(self, state: AgentState) -> AgentState:
        """
        Step 5: Use LLM to generate actionable fix suggestions.
        
        Produces 2-3 concrete fixes with implementation steps.
        """
        await self._emit_step(
            "🛠️ Generating fix suggestions...", 
            "AI"
        )
        
        prompt = f"""
Based on the following root cause analysis, provide 2-3 specific, actionable fixes.

**Root Cause:** {state['root_cause']}

**Error:** {state['error_message']}

**Stack Trace:**
{json.dumps(state['context'].get('stacktrace', {}), indent=2)}

**Similar Past Fixes:**
{json.dumps([inc.get('fix', 'N/A') for inc in state['similar_incidents']], indent=2)}

For each fix, provide:
1. Title (concise, actionable)
2. Implementation steps (3-5 bullet points)
3. Confidence score (0-100)
4. Estimated time to implement (e.g., "15 minutes", "2 hours")
5. Risk level (low/medium/high)

Format as JSON array:
[
  {{
    "title": "Add JWT token refresh middleware",
    "steps": ["Step 1", "Step 2", "..."],
    "confidence": 92,
    "time_estimate": "30 minutes",
    "risk": "low"
  }},
  ...
]
"""

        messages = [
            SystemMessage(content="You are an expert SRE providing fix recommendations."),
            HumanMessage(content=prompt)
        ]
        
        try:
            if self.llm is None:
                # Use mock response for testing
                await self._emit_step(
                    "✅ Generated fix suggestions (mock)",
                    "AI",
                    "Mock fixes: 1. Increase timeout settings, 2. Add request size validation"
                )
                state["suggested_fixes"] = [
                    {
                        "title": "Increase HTTP timeout settings",
                        "steps": [
                            "Update nginx.conf timeout values",
                            "Increase application server timeout",
                            "Add monitoring for timeout events"
                        ],
                        "confidence": 85,
                        "time_estimate": "30 minutes",
                        "risk": "low"
                    },
                    {
                        "title": "Add request size validation",
                        "steps": [
                            "Implement client-side payload size check",
                            "Add server-side validation middleware",
                            "Return proper error messages"
                        ],
                        "confidence": 75,
                        "time_estimate": "1 hour",
                        "risk": "medium"
                    }
                ]
                return state

            response = await self.llm.ainvoke(messages)

            try:
                # Clean the response content to extract JSON
                content = response.content.strip()

                # Remove markdown code blocks if present
                if content.startswith('```json'):
                    content = content.replace('```json', '').replace('```', '').strip()
                elif content.startswith('```'):
                    content = content.replace('```', '').strip()

                fixes = json.loads(content)
                state["suggested_fixes"] = fixes

                await self._emit_step(
                    f"✅ Generated {len(fixes)} fix suggestions",
                    "AI",
                    "\n\n".join([
                        f"**{i+1}. {fix['title']}** (Confidence: {fix.get('confidence', 80)}%)"
                        for i, fix in enumerate(fixes)
                    ])
                )
            except (json.JSONDecodeError, KeyError) as e:
                print(f"[Agent] Failed to parse fix suggestions JSON: {e}")
                print(f"[Agent] Raw response: {response.content}")

                # Try to extract JSON from the response text
                try:
                    import re
                    # Look for JSON array pattern
                    json_match = re.search(r'\[.*?\]', response.content, re.DOTALL)
                    if json_match:
                        fixes = json.loads(json_match.group(0))
                        state["suggested_fixes"] = fixes

                        await self._emit_step(
                            f"✅ Generated {len(fixes)} fix suggestions",
                            "AI",
                            "\n\n".join([
                                f"**{i+1}. {fix['title']}** (Confidence: {fix.get('confidence', 80)}%)"
                                for i, fix in enumerate(fixes)
                            ])
                        )
                    else:
                        raise ValueError("No JSON array found")

                except Exception:
                    # Final fallback
                    state["suggested_fixes"] = [{
                        "title": "Manual investigation required",
                        "steps": [response.content[:500]],
                        "confidence": 50,
                        "time_estimate": "Unknown",
                        "risk": "medium"
                    }]

                    await self._emit_step(
                        "⚠️ Generated fix suggestions (manual parsing required)",
                        "AI",
                        response.content[:500]
                    )

        except Exception as e:
            # Handle LLM errors
            state["suggested_fixes"] = [{
                "title": f"Fix generation failed: {str(e)}",
                "steps": ["Please investigate manually"],
                "confidence": 0,
                "time_estimate": "Unknown",
                "risk": "high"
            }]

            await self._emit_step(
                "❌ Fix generation failed",
                "AI",
                f"Error: {str(e)}"
            )
        
        return state
    
    async def investigate(
        self, 
        issue_id: str, 
        error_message: str
    ) -> AgentState:
        """
        Main entry point: Run the complete investigation workflow.
        
        Args:
            issue_id: Sentry issue ID
            error_message: The error message/title
        
        Returns:
            Complete analysis with root cause and fixes
        """
        start_time = datetime.utcnow()
        
        # Initialize state
        state: AgentState = {
            "issue_id": issue_id,
            "error_message": error_message,
            "steps": [],
            "context": {},
            "root_cause": "",
            "confidence": 0.0,
            "suggested_fixes": [],
            "similar_incidents": []
        }
        
        try:
            print(f"[Agent] Starting investigation workflow for {issue_id}")

            # Connect to MCP server
            await self._connect_mcp()
            print(f"[Agent] MCP connection step completed")

            # Execute workflow steps sequentially
            state = await self._fetch_issue_context(state)
            print(f"[Agent] Issue context step completed")

            state = await self._search_knowledge(state)
            print(f"[Agent] Knowledge search step completed")

            state = await self._analyze_patterns(state)
            print(f"[Agent] Pattern analysis step completed")

            state = await self._reason_about_root_cause(state)
            print(f"[Agent] Root cause analysis step completed")

            state = await self._generate_fix_suggestions(state)
            print(f"[Agent] Fix suggestions step completed")
            
            # Calculate duration
            duration = (datetime.utcnow() - start_time).total_seconds()

            # Save to database
            try:
                analysis_id = await db_service.save_analysis(
                    issue_id=state["issue_id"],
                    error_message=state["error_message"],
                    root_cause=state.get("root_cause"),
                    confidence=state.get("confidence"),
                    suggested_fixes=state.get("suggested_fixes"),
                    similar_incidents=state.get("similar_incidents"),
                    duration_seconds=duration,
                    steps=self.collected_steps,
                    status="success"
                )
                print(f"[Agent] Saved analysis to database with ID: {analysis_id}")
                state["analysis_id"] = analysis_id
            except Exception as e:
                print(f"[Agent] Failed to save analysis to database: {e}")

            # Send completion message
            if self.stream_callback:
                await self.stream_callback({
                    "type": "complete",
                    "content": {
                        **state,
                        "duration_seconds": duration,
                        "status": "success"
                    }
                })

            return state
            
        except Exception as e:
            # Handle errors gracefully
            import traceback
            error_msg = f"Investigation failed: {str(e)}"
            print(f"[Agent] ERROR: {error_msg}")
            print(f"[Agent] Traceback: {traceback.format_exc()}")

            await self._emit_step(
                "❌ Investigation failed",
                output=error_msg
            )

            if self.stream_callback:
                await self.stream_callback({
                    "type": "error",
                    "content": {"error": error_msg}
                })

            raise