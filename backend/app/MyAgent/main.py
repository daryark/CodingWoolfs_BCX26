import logging
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.prebuilt import create_react_agent
from langchain.tools import tool
from langchain_core.callbacks import BaseCallbackHandler
from bedrock_agentcore.runtime.context import BedrockAgentCoreContext
from opentelemetry.instrumentation.langchain import LangchainInstrumentor
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from model.load import load_model
from mcp_client.client import get_streamable_http_mcp_client

# Import your MongoDB functions
from mongo_tools import get_machine_status, get_latest_cnc_events, add_shift_note

LangchainInstrumentor().instrument()

app = BedrockAgentCoreApp()
log = logging.getLogger("MyAgent")

_llm = None

def get_or_create_model():
    global _llm
    if _llm is None:
        _llm = load_model()
    return _llm


DEFAULT_SYSTEM_PROMPT = """
You are a helpful assistant overseeing factory CNC machines. Use tools when appropriate.
"""


# --- Convert your MongoDB functions into LangChain Tools ---

@tool
def check_machine_status(machine_id: str) -> dict:
    """
    Retrieves the details and current setup state of a specific CNC machine.
    Use this tool whenever the user asks about a machine's parameters or specifications.
    """
    return get_machine_status(machine_id)

@tool
def fetch_latest_cnc_events(limit: int = 5) -> list:
    """
    Retrieves the most recent CNC error logs, alerts, or operational events.
    Use this tool when looking up recent issues or telemetry data from the factory floor.
    """
    return get_latest_cnc_events(limit)

@tool
def log_shift_note(author: str, machine_id: str, note_text: str) -> dict:
    """
    Inserts a new operational or maintenance note for a machine during a shift handover.
    Use this tool when an operator wants to log a comment, event, or warning.
    """
    return add_shift_note(author, machine_id, note_text)


# Define a simple function tool
@tool
def add_numbers(a: int, b: int) -> int:
    """Return the sum of two numbers"""
    return a + b


# Gather your native tools into the list LangGraph checks
tools = [add_numbers, check_machine_status, fetch_latest_cnc_events, log_shift_note]


class ConfigBundleCallback(BaseCallbackHandler):
    """Injects config bundle values into LangGraph agent at runtime."""

    def on_chain_start(self, serialized: dict, inputs: dict, **kwargs: Any) -> None:
        config = BedrockAgentCoreContext.get_config_bundle()
        prompt = config.get("systemPrompt", DEFAULT_SYSTEM_PROMPT)

        messages = inputs.get("messages", [])
        if messages and isinstance(messages[0], SystemMessage):
            messages[0] = SystemMessage(content=prompt)
        else:
            messages.insert(0, SystemMessage(content=prompt))
        inputs["messages"] = messages


@app.entrypoint
async def invoke(payload, context):
    log.info("Invoking Agent.....")

    # Get MCP Client
    mcp_client = get_streamable_http_mcp_client()

    # Load MCP Tools
    mcp_tools = []
    if mcp_client:
        mcp_tools = await mcp_client.get_tools()

    # Pass BOTH your custom MongoDB tools array and the MCP tools list to LangGraph
    graph = create_react_agent(get_or_create_model(), tools=mcp_tools + tools, prompt=DEFAULT_SYSTEM_PROMPT)
    callback = ConfigBundleCallback()

    # Process the user prompt
    prompt = payload.get("prompt", "What can you help me with?")
    log.info(f"Agent input: {prompt}")

    # Run the agent with config bundle callback
    result = await graph.ainvoke(
        {"messages": [HumanMessage(content=prompt)]},
        config={"callbacks": [callback]},
    )

    # Safely extract the final text output from the assistant
    output = "I couldn't generate a text response."
    
    # Loop backward to find the last AI response that contains text content
    for msg in reversed(result.get("messages", [])):
        if msg.type == "ai" and msg.content:
            output = msg.content
            break

    log.info(f"Agent output: {output}")
    return {"result": output}


if __name__ == "__main__":
    app.run()
