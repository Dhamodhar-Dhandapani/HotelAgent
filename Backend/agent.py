import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from langchain.agents import create_agent
from agent_tools import (
    ask_hotel_policy,
    get_booking_details,
    execute_checkout,
    create_service_request,
    escalate_to_human
)

load_dotenv()

# 1. Initialize the LLM (Optimized for GPT-OSS-20B)
llm = ChatOpenAI(
    base_url=os.environ.get("LLM_BASE_URL"),
    api_key=os.environ.get("LLM_API_KEY"),
    model=os.environ.get("LLM_MODEL_NAME"),  # e.g., "openai/gpt-oss-20b"
    temperature=0.0,
    max_tokens=512,        # cap response length
    top_p=0.9,             # balanced sampling
    frequency_penalty=0.2, # reduce repetition
    presence_penalty=0.1,  # encourage variety
    streaming=True         # stream responses for faster user experience
)

# 2. Lean System Guardrails (shortened to save tokens)
system_prompt = """
You are the Virtual Receptionist for the Grand Metropolitan Hotel.

Rules:
1. Always require Booking ID + Phone Number before checkout or service requests.
2. Use 'ask_hotel_policy' for hotel questions.
3. Use 'get_room_types_by_occupancy' for room capacity/price queries.
4. Escalate to human if guest is angry, requests refund, or personal data changes.
5. Never modify guest names, emails, or pricing.
"""

# 3. Bind Tools
tools = [
    ask_hotel_policy,
    get_booking_details,
    execute_checkout,
    create_service_request,
    escalate_to_human
]

# 4. Create the LangGraph Agent
agent_executor = create_agent(llm, tools=tools, system_prompt=system_prompt)

if __name__ == "__main__":
    print("🤖 Hotel Agent Online (Powered by LangGraph). Type 'exit' to quit.")

    chat_history = []
    MAX_HISTORY = 5  # keep only last 5 turns

    while True:
        user_input = input("\nGuest: ")
        if user_input.lower() in ['exit', 'quit']:
            break

        # Add new guest message
        chat_history.append(HumanMessage(content=user_input))
        chat_history = chat_history[-MAX_HISTORY:]  # trim history

        try:
            # Invoke agent with current state
            response = agent_executor.invoke({"messages": chat_history})

            # Agent's final answer is last message
            agent_reply = response["messages"][-1]
            print(f"\nAgent: {agent_reply.content}")

            # Save reply to history
            chat_history.append(agent_reply)

        except Exception as e:
            print(f"\n[System Error] -> {e}")
