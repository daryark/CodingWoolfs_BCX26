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

LangchainInstrumentor().instrument()

app = BedrockAgentCoreApp()
log = app.logger

_llm = None

def get_or_create_model():
    global _llm
    if _llm is None:
        _llm = load_model()
    return _llm


DEFAULT_SYSTEM_PROMPT = """
You are a helpful assistant. Use tools when appropriate.

"""


# Define a simple function tool
@tool
def add_numbers(a: int, b: int) -> int:
    """Return the sum of two numbers"""
    return a + b


# Define a collection of tools used by the model
tools = [add_numbers]



class ConfigBundleCallback(BaseCallbackHandler):
    """Injects config bundle values into LangGraph agent at runtime.

    BedrockAgentCoreContext.get_config_bundle() fetches the component configuration
    for the current runtime ARN from the config bundle service. The SDK caches the
    result and refreshes on bundle version changes.
    """

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

    # Define the agent using create_react_agent
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

    # Return result
    output = result["messages"][-1].content
    log.info(f"Agent output: {output}")
    return {"result": output}


if __name__ == "__main__":
    app.run()
