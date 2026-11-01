# 🏨 HotelAgentAI

> **An intelligent AI-powered virtual receptionist for hotels, built with LangChain, LangGraph, RAG, and a PostgreSQL backend.**

![HotelAgentAI Banner](hotel_ai_agent.png)

---

## 📖 Overview

**HotelAgentAI** is a conversational AI agent designed to act as the virtual front desk of **Grand Metropolitan Hotel**. It handles real guest interactions — answering policy questions, retrieving booking details, processing checkouts, creating service requests, and escalating complex issues to a human manager — all through a natural language interface.

The agent is powered by a large language model (LLM) connected to a PostgreSQL database and a Retrieval-Augmented Generation (RAG) pipeline that reads the hotel's policy documents to answer questions accurately.

---

## 🏗️ Architecture

```
Guest Message
      │
      ▼
┌─────────────────────────────────┐
│        LangGraph Agent          │  ← Orchestrates tool usage
│   (GPT-OSS via OpenAI compat.)  │
└────────────┬────────────────────┘
             │ Invokes
    ┌─────────┴──────────┐
    │      Tools         │
    ├────────────────────┤
    │ ask_hotel_policy   │ ← RAG: Pinecone + HuggingFace Embeddings
    │ get_booking_details│ ← PostgreSQL (READ)
    │ execute_checkout   │ ← PostgreSQL (WRITE)
    │ create_service_req │ ← PostgreSQL (WRITE)
    │ escalate_to_human  │ ← PostgreSQL (WRITE → Flag for staff)
    └────────────────────┘
```

---

## ✨ Features

| Feature | Description |
|---|---|
| 🗣️ **Conversational AI** | Natural language chat with streaming LLM responses |
| 📄 **Hotel Policy RAG** | Answers questions from hotel policy PDF using Pinecone vector search |
| 📋 **Booking Lookup** | Retrieves booking status and dates by Booking ID |
| ✅ **Checkout Processing** | Securely marks a booking as checked-out after identity verification |
| 🛎️ **Service Requests** | Creates housekeeping/concierge tickets (e.g., "Extra towels", "Fix AC") |
| 🚨 **Human Escalation** | Automatically pages a human manager for refunds, angry guests, or data changes |
| 🔒 **Guardrails** | Never modifies guest names, emails, or pricing — enforced in the system prompt |
| 🧠 **Chat Memory** | Maintains a rolling 5-turn conversation history for context |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **LLM** | OpenAI-compatible API (GPT-OSS-20B or similar) |
| **Agent Framework** | LangChain + LangGraph |
| **RAG / Vector Store** | Pinecone + HuggingFace (`all-MiniLM-L6-v2`) |
| **Document Loader** | PyPDF (hotel policy PDF) |
| **Database ORM** | SQLAlchemy (PostgreSQL) |
| **Config** | python-dotenv |

---

## 📁 Project Structure

```
HotelAgentAI/
├── Backend/
│   ├── agent.py              # Main agent entry point & chat loop
│   ├── agent_tools.py        # LangChain tools (policy, booking, checkout, etc.)
│   ├── database.py           # SQLAlchemy models (Guest, Booking, ServiceRequest, RoomType)
│   ├── rag_engine.py         # Pinecone RAG retriever setup
│   ├── hotel_policies.pdf    # Source document for policy Q&A
│   ├── requirements.txt      # Python dependencies
│   └── .env                  # Environment variables (not committed)
├── .gitignore
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites

- Python 3.10+
- PostgreSQL database (with `HotelAgentSchema` schema)
- Pinecone account
- OpenAI-compatible LLM API endpoint

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/HotelAgentAI.git
cd HotelAgentAI/Backend
```

### 2. Create & Activate Virtual Environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the `Backend/` directory:

```env
# LLM Configuration
LLM_BASE_URL=https://your-llm-api-endpoint
LLM_API_KEY=your_llm_api_key
LLM_MODEL_NAME=openai/gpt-oss-20b

# PostgreSQL Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Pinecone Vector Store
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=hotel-policies
```

### 5. Run the Agent

```bash
python agent.py
```

---

## 💬 Example Conversation

```
🤖 Hotel Agent Online (Powered by LangGraph). Type 'exit' to quit.

Guest: What is your check-in time?
Agent: Our standard check-in time is 3:00 PM. Early check-in may be available upon request, subject to room availability.

Guest: I'd like to check out. My booking ID is 1042.
Agent: I've successfully processed your checkout for Booking #1042. Thank you for staying with us at Grand Metropolitan Hotel!

Guest: My AC is broken in room 204. Booking ID is 1042.
Agent: I've created a service ticket for your AC issue in room 204. Our maintenance team will be with you shortly. Ticket #7 has been logged.
```

---

## 🗄️ Database Schema

The agent works with the `HotelAgentSchema` PostgreSQL schema containing:

- **`guests`** — Guest profiles (name, email, phone)
- **`room_types`** — Room categories with pricing and occupancy limits
- **`booking`** — Reservation records with status tracking
- **`service_requests`** — Housekeeping and concierge tickets with escalation flags

---

## 🔐 Security & Guardrails

- Identity verification (Booking ID required) before any write operation
- LLM is prohibited from modifying guest PII or pricing
- Angry guests, refund requests, and personal data changes are automatically escalated to human staff
- `.env` and `venv/` are excluded from version control via `.gitignore`

---

## 📄 License

This project is licensed under the terms in the [LICENSE](LICENSE) file.