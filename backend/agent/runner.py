import re
import json
from agent.llm import chat_with_ai
from agent.tools import TOOLS
from agent.prompts import build_system_prompt
from agent.context import build_user_context


AGENT_SYSTEM = """
You are FinanceAI, a personal finance AI agent with access to tools.

When you need to calculate something, analyze spending, or create a plan — use a tool.
To use a tool, respond with EXACTLY this format on its own line:

TOOL: tool_name
ARGS: {{"arg1": "value1", "arg2": "value2"}}

Available tools:
- calculator: Math calculations. Args: {{"expression": "50000 * 0.2"}}
- budget_analyzer: Analyze spending. Args: {{}} (no extra args needed)
- savings_planner: Create savings plan. Args: {{"goal_amount": 10000, "months": 3}}

Rules:
- Use calculator for ANY arithmetic — never do math in your head
- Use budget_analyzer when user asks about spending patterns or budget
- Use savings_planner when user wants to save a specific amount
- After getting a tool result, give a clear friendly response using the data
- Always use real numbers from the tool results
- Format currency as ₹X,XXX
"""


async def run_agent(
    messages: list,
    user_id: str,
    user_context: str,
) -> str:
    """
    Runs the agent loop:
    1. Ask AI what to do
    2. If AI wants a tool, run it
    3. Feed result back to AI
    4. Return final response
    """

    system = AGENT_SYSTEM + "\n\n" + build_system_prompt(user_context)

    # Step 1 — First AI call
    response = await chat_with_ai(messages=messages, system_prompt=system)

    # Step 2 — Check if AI wants to use a tool
    tool_match = re.search(
        r"TOOL:\s*(\w+)\s*\nARGS:\s*(\{.*?\})",
        response,
        re.DOTALL
    )

    if not tool_match:
        # No tool needed — return response directly
        return response

    tool_name = tool_match.group(1).strip()
    try:
        args = json.loads(tool_match.group(2))
    except json.JSONDecodeError:
        args = {}

    # Step 3 — Run the tool
    if tool_name not in TOOLS:
        return response

    tool = TOOLS[tool_name]
    try:
        if tool["requires_user_id"]:
            result = tool["fn"](user_id, **args)
        else:
            result = tool["fn"](**args)
    except Exception as e:
        result = f"Tool error: {str(e)}"

    # Step 4 — Feed result back to AI
    tool_result_message = {
        "role": "user",
        "content": f"Tool '{tool_name}' returned:\n\n{result}\n\nNow give me a clear, friendly response based on this data."
    }

    final_messages = messages + [
        {"role": "assistant", "content": response},
        tool_result_message,
    ]

    final_response = await chat_with_ai(
        messages=final_messages,
        system_prompt=system,
    )

    return final_response