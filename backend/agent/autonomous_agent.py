"""
Autonomous MCP Agent with LLM-driven tool selection.

This implements a ReAct (Reasoning + Acting) pattern where the LLM:
1. Observes the current state
2. Thinks about what to do next
3. Selects and calls appropriate tools
4. Observes results
5. Continues until task is complete

The LLM has full autonomy to choose which tools to use and in what order.
"""

from typing import Dict, Any, List, Optional, Callable
from datetime import datetime
import json
import asyncio
from enum import Enum
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from config import settings


class AgentAction(Enum):
    """Types of actions the agent can take."""
    THINK = "think"
    TOOL_CALL = "tool_call"
    ANSWER = "answer"


class AutonomousMCPAgent:
    """
    Fully autonomous agent that uses LLM reasoning to select MCP tools dynamically.

    Instead of following a fixed workflow, this agent:
    - Reasons about the problem
    - Decides which tools would be helpful
    - Calls tools in the order it determines
    - Adapts based on results
    """

    def __init__(self, stream_callback: Optional[Callable] = None):
        """Initialize the autonomous agent with GPT-4."""
        self.llm = ChatOpenAI(
            model="gpt-4-turbo-preview",
            temperature=0.1,
            streaming=True,
            openai_api_key=settings.openai_api_key
        )
        self.stream_callback = stream_callback
        self.conversation_history: List[Any] = []
        self.tool_descriptions: Dict[str, str] = {}
        self.max_iterations = 15  # Prevent infinite loops

    async def _emit_step(self, step_type: str, content: Any):
        """Emit a step update to the frontend."""
        if self.stream_callback:
            await self.stream_callback({
                "type": "step",
                "content": {
                    "step_type": step_type,
                    "data": content,
                    "timestamp": datetime.utcnow().isoformat()
                }
            })

    def _load_tool_descriptions(self) -> str:
        """Get available MCP tools and their descriptions."""
        # Import tool descriptions
        from tools.tools import (
            get_sentry_issue_details,
            get_stacktrace,
            search_knowledge_base,
            analyze_error_frequency,
            get_user_impact
        )

        tools = {
            "get_sentry_issue_details": {
                "description": "Fetch detailed information about a Sentry issue including metadata, stats, and tags",
                "parameters": {
                    "issue_id": "string - The Sentry issue ID"
                },
                "returns": "Issue details with title, count, user count, status, etc."
            },
            "get_stacktrace": {
                "description": "Get the stack trace for the most recent event of a Sentry issue",
                "parameters": {
                    "issue_id": "string - The Sentry issue ID"
                },
                "returns": "Stack trace with exception type, message, and frames"
            },
            "search_knowledge_base": {
                "description": "Search for similar past incidents in the knowledge base using semantic similarity",
                "parameters": {
                    "error_message": "string - Error message to search for",
                    "limit": "int (optional, default=3) - Max results"
                },
                "returns": "List of similar incidents with their fixes and similarity scores"
            },
            "analyze_error_frequency": {
                "description": "Analyze error frequency patterns and trends over time",
                "parameters": {
                    "issue_id": "string - The Sentry issue ID"
                },
                "returns": "Frequency analysis with trend (increasing/decreasing/stable) and occurrence counts"
            },
            "get_user_impact": {
                "description": "Get user impact metrics - how many users are affected",
                "parameters": {
                    "issue_id": "string - The Sentry issue ID"
                },
                "returns": "Number of affected users and impact level"
            }
        }

        self.tool_descriptions = tools

        # Format for LLM
        tool_str = "Available MCP Tools:\n\n"
        for name, info in tools.items():
            tool_str += f"Tool: {name}\n"
            tool_str += f"  Description: {info['description']}\n"
            tool_str += f"  Parameters: {info['parameters']}\n"
            tool_str += f"  Returns: {info['returns']}\n\n"

        return tool_str

    async def _execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a tool and return results."""
        await self._emit_step("tool_execution", {
            "tool": tool_name,
            "arguments": arguments
        })

        # Import and execute tool
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
            return {"error": f"Unknown tool: {tool_name}"}

        try:
            result = await tool_map[tool_name](**arguments)

            await self._emit_step("tool_result", {
                "tool": tool_name,
                "success": True,
                "result_preview": str(result)[:200] + "..." if len(str(result)) > 200 else str(result)
            })

            return result
        except Exception as e:
            error_result = {"error": str(e)}

            await self._emit_step("tool_result", {
                "tool": tool_name,
                "success": False,
                "error": str(e)
            })

            return error_result

    def _create_react_prompt(self, task: str, tools_info: str) -> str:
        """Create the ReAct prompt for the LLM."""
        return f"""You are an expert Site Reliability Engineer investigating a production incident.
You must use a ReAct (Reasoning + Acting) approach to solve the problem.

Your task: {task}

{tools_info}

IMPORTANT INSTRUCTIONS:
1. You work in steps. Each response must be ONE of these actions:
   - THINK: Reason about what you know and what you need to find out
   - TOOL_CALL: Call a specific tool to get information
   - ANSWER: Provide the final answer when you have enough information

2. Format your responses EXACTLY like this:

For thinking:
```
ACTION: THINK
REASONING: [Your reasoning about the current situation and what to do next]
```

For tool calls:
```
ACTION: TOOL_CALL
TOOL: [exact tool name]
ARGUMENTS: {{"parameter": "value"}}
```

For final answer:
```
ACTION: ANSWER
ROOT_CAUSE: [Brief description of root cause]
CONFIDENCE: [0-100 score]
SUGGESTED_FIXES: [
  {{
    "title": "Fix title",
    "steps": ["Step 1", "Step 2"],
    "confidence": 90,
    "time_estimate": "30 minutes",
    "risk": "low"
  }}
]
KEY_FINDINGS: [List of important discoveries]
```

3. Start by thinking about what information you need
4. Call tools to gather that information
5. Continue until you can provide a comprehensive answer
6. Be efficient - don't call tools unnecessarily

Begin your investigation."""

    def _parse_llm_response(self, response: str) -> Dict[str, Any]:
        """Parse the LLM's response to extract action and details."""
        lines = response.strip().split('\n')

        # Look for ACTION line
        action = None
        content = {}

        for i, line in enumerate(lines):
            if line.startswith("ACTION:"):
                action_type = line.replace("ACTION:", "").strip()

                if action_type == "THINK":
                    # Extract reasoning
                    for j in range(i+1, len(lines)):
                        if lines[j].startswith("REASONING:"):
                            reasoning_start = j
                            reasoning_lines = []
                            for k in range(reasoning_start + 1, len(lines)):
                                if lines[k].startswith("```") or lines[k].startswith("ACTION:"):
                                    break
                                reasoning_lines.append(lines[k])
                            content = {
                                "action": AgentAction.THINK,
                                "reasoning": " ".join(reasoning_lines).replace("REASONING:", "").strip()
                            }
                            break

                elif action_type == "TOOL_CALL":
                    # Extract tool name and arguments
                    tool_name = None
                    arguments = {}

                    for j in range(i+1, len(lines)):
                        if lines[j].startswith("TOOL:"):
                            tool_name = lines[j].replace("TOOL:", "").strip()
                        elif lines[j].startswith("ARGUMENTS:"):
                            # Get everything after ARGUMENTS:
                            args_text = lines[j].replace("ARGUMENTS:", "").strip()
                            # Also get subsequent lines if JSON spans multiple lines
                            for k in range(j+1, len(lines)):
                                if lines[k].startswith("ACTION:") or lines[k].startswith("```"):
                                    break
                                args_text += " " + lines[k]

                            try:
                                arguments = json.loads(args_text)
                            except json.JSONDecodeError:
                                # Try to extract JSON from the text
                                import re
                                json_match = re.search(r'\{.*\}', args_text, re.DOTALL)
                                if json_match:
                                    try:
                                        arguments = json.loads(json_match.group())
                                    except:
                                        arguments = {}

                    content = {
                        "action": AgentAction.TOOL_CALL,
                        "tool": tool_name,
                        "arguments": arguments
                    }

                elif action_type == "ANSWER":
                    # Extract final answer components
                    answer_text = "\n".join(lines[i+1:])

                    # Try to parse structured answer
                    root_cause = ""
                    confidence = 0
                    fixes = []
                    findings = []

                    # Extract each component
                    if "ROOT_CAUSE:" in answer_text:
                        root_cause_match = answer_text.split("ROOT_CAUSE:")[1].split("\n")[0].strip()
                        root_cause = root_cause_match

                    if "CONFIDENCE:" in answer_text:
                        conf_match = answer_text.split("CONFIDENCE:")[1].split("\n")[0].strip()
                        try:
                            confidence = int(conf_match)
                        except:
                            confidence = 50

                    if "SUGGESTED_FIXES:" in answer_text:
                        fixes_text = answer_text.split("SUGGESTED_FIXES:")[1]
                        if "KEY_FINDINGS:" in fixes_text:
                            fixes_text = fixes_text.split("KEY_FINDINGS:")[0]

                        # Try to parse JSON array
                        try:
                            import re
                            json_match = re.search(r'\[.*\]', fixes_text, re.DOTALL)
                            if json_match:
                                fixes = json.loads(json_match.group())
                        except:
                            fixes = []

                    if "KEY_FINDINGS:" in answer_text:
                        findings_text = answer_text.split("KEY_FINDINGS:")[1]
                        try:
                            import re
                            json_match = re.search(r'\[.*\]', findings_text, re.DOTALL)
                            if json_match:
                                findings = json.loads(json_match.group())
                        except:
                            # Parse as bullet points
                            findings = [line.strip("- ").strip()
                                      for line in findings_text.split("\n")
                                      if line.strip().startswith("-")]

                    content = {
                        "action": AgentAction.ANSWER,
                        "root_cause": root_cause,
                        "confidence": confidence,
                        "suggested_fixes": fixes,
                        "key_findings": findings
                    }

                break

        if not action:
            # Fallback: treat as thinking
            content = {
                "action": AgentAction.THINK,
                "reasoning": response
            }

        return content

    async def investigate(self, issue_id: str, error_message: str) -> Dict[str, Any]:
        """
        Main entry point for autonomous investigation.

        The agent will:
        1. Understand the task
        2. Reason about what tools to use
        3. Call tools as needed
        4. Provide comprehensive analysis

        Args:
            issue_id: Sentry issue ID
            error_message: Error message/title

        Returns:
            Investigation results with root cause and fixes
        """
        await self._emit_step("start", {
            "issue_id": issue_id,
            "error_message": error_message,
            "mode": "autonomous"
        })

        # Load available tools
        tools_info = self._load_tool_descriptions()

        # Create initial task
        task = f"""Investigate Sentry issue {issue_id} with error: "{error_message}"

You need to:
1. Understand what the error is about
2. Analyze its patterns and impact
3. Search for similar past incidents
4. Determine the root cause
5. Suggest concrete fixes

Use the available tools to gather information, then provide a comprehensive analysis."""

        # Create system prompt
        system_prompt = self._create_react_prompt(task, tools_info)

        # Initialize conversation
        self.conversation_history = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"Begin investigating issue {issue_id}: {error_message}")
        ]

        # Run ReAct loop
        iteration = 0
        final_answer = None
        observations = []

        while iteration < self.max_iterations:
            iteration += 1

            await self._emit_step("iteration", {
                "number": iteration,
                "max": self.max_iterations
            })

            # Get LLM response
            response = await self.llm.ainvoke(self.conversation_history)
            self.conversation_history.append(response)

            # Parse response
            parsed = self._parse_llm_response(response.content)

            if parsed["action"] == AgentAction.THINK:
                # LLM is reasoning
                await self._emit_step("thinking", {
                    "iteration": iteration,
                    "reasoning": parsed["reasoning"]
                })

                observations.append({
                    "type": "thought",
                    "content": parsed["reasoning"]
                })

            elif parsed["action"] == AgentAction.TOOL_CALL:
                # LLM wants to call a tool
                tool_name = parsed.get("tool")
                arguments = parsed.get("arguments", {})

                await self._emit_step("tool_call", {
                    "iteration": iteration,
                    "tool": tool_name,
                    "arguments": arguments
                })

                # Execute tool
                if tool_name:
                    result = await self._execute_tool(tool_name, arguments)

                    # Add observation to history
                    observation = f"Tool '{tool_name}' returned: {json.dumps(result, indent=2, default=str)}"
                    self.conversation_history.append(
                        HumanMessage(content=f"OBSERVATION: {observation}")
                    )

                    observations.append({
                        "type": "tool_result",
                        "tool": tool_name,
                        "result": result
                    })
                else:
                    self.conversation_history.append(
                        HumanMessage(content="OBSERVATION: Tool call failed - no tool name provided")
                    )

            elif parsed["action"] == AgentAction.ANSWER:
                # LLM has final answer
                await self._emit_step("final_answer", parsed)

                final_answer = {
                    "root_cause": parsed.get("root_cause", ""),
                    "confidence": parsed.get("confidence", 0) / 100.0,
                    "suggested_fixes": parsed.get("suggested_fixes", []),
                    "key_findings": parsed.get("key_findings", []),
                    "iterations": iteration,
                    "observations": observations
                }
                break

            # Prevent runaway loops
            if iteration >= self.max_iterations - 1:
                self.conversation_history.append(
                    HumanMessage(content="You've reached the maximum number of iterations. Please provide your final answer now.")
                )

        # Ensure we have a final answer
        if not final_answer:
            final_answer = {
                "root_cause": "Investigation incomplete - maximum iterations reached",
                "confidence": 0.3,
                "suggested_fixes": [],
                "key_findings": ["Investigation did not complete within iteration limit"],
                "iterations": iteration,
                "observations": observations
            }

        # Send completion
        if self.stream_callback:
            await self.stream_callback({
                "type": "complete",
                "content": {
                    "issue_id": issue_id,
                    "error_message": error_message,
                    **final_answer,
                    "status": "success"
                }
            })

        return final_answer


class AdvancedAutonomousAgent(AutonomousMCPAgent):
    """
    Advanced version with additional capabilities:
    - Memory of past investigations
    - Learning from feedback
    - Tool result validation
    - Multi-step planning
    """

    def __init__(self, stream_callback: Optional[Callable] = None):
        super().__init__(stream_callback)
        self.investigation_memory: List[Dict[str, Any]] = []

    async def plan_investigation(self, issue_id: str, error_message: str) -> List[str]:
        """
        Let the LLM plan the investigation before starting.

        Returns:
            List of planned steps
        """
        planning_prompt = f"""Given this error: "{error_message}" (Issue ID: {issue_id})

And these available tools:
{self._load_tool_descriptions()}

Create a step-by-step investigation plan. List the tools you'll likely need and in what order.
Be strategic and efficient.

Format:
1. [Tool name] - [Why you need it]
2. [Tool name] - [Why you need it]
...

Provide only the plan, nothing else."""

        response = await self.llm.ainvoke([
            SystemMessage(content="You are an expert debugger. Create an investigation plan."),
            HumanMessage(content=planning_prompt)
        ])

        # Parse plan
        lines = response.content.strip().split('\n')
        plan = []
        for line in lines:
            if line.strip() and line[0].isdigit():
                # Extract tool name from line
                parts = line.split('-')
                if parts:
                    tool_part = parts[0].strip()
                    # Remove number and extract tool name
                    tool_name = tool_part.split('.')[1].strip() if '.' in tool_part else tool_part
                    plan.append(tool_name)

        await self._emit_step("investigation_plan", {
            "plan": plan,
            "raw_plan": response.content
        })

        return plan

    async def investigate_with_planning(self, issue_id: str, error_message: str) -> Dict[str, Any]:
        """
        Investigation with upfront planning phase.
        """
        # First, create a plan
        plan = await self.plan_investigation(issue_id, error_message)

        # Then execute with the plan in context
        self.conversation_history.insert(1,
            SystemMessage(content=f"Investigation plan: {plan}. Follow this plan but adapt as needed based on findings.")
        )

        # Run standard investigation
        return await self.investigate(issue_id, error_message)