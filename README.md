# LogSense

**AI-Powered Microservices Log Analysis & Incident Intelligence Platform**

> An autonomous AI agent system that performs real-time root cause analysis on production incidents using Model Context Protocol (MCP) tools, RAG-based knowledge retrieval, and LLM-driven troubleshooting orchestration.

![Tech Stack](https://img.shields.io/badge/Python-3.11+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-13+-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

---

## Overview

LogSense is a production-ready incident intelligence platform that combines AI agents, MCP tools, and RAG pipelines to automate the investigation and resolution of microservices incidents. The system continuously monitors production errors via Sentry, performs autonomous root cause analysis using GPT-4, and learns from past incidents to improve resolution accuracy over time.

**Key Features:**

- Autonomous AI agent with ReAct (Reasoning + Acting) architecture
- 5 custom MCP tools for incident investigation
- RAG-based knowledge base with semantic search (Qdrant vector DB)
- Real-time WebSocket streaming for live analysis updates
- Multi-tenant architecture with organization-level isolation
- Authentication with Clerk
- Real-time observability and confidence scoring

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
│              Real-time Dashboard & Visualization             │
└────────────────────────┬────────────────────────────────────┘
                         │ WebSocket + REST
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                         │
│              API Gateway & WebSocket Server                  │
└────────────┬────────────────────────┬────────────────────────┘
             │                        │
             ↓                        ↓
┌────────────────────────┐  ┌────────────────────────────────┐
│   AI Agent (GPT-4)     │  │     MCP Server (STDIO)         │
│   - ReAct Pattern      │←→│   - 5 Investigation Tools      │
│   - LLM Tool Selection │  │   - JSON-RPC Protocol          │
│   - Adaptive Reasoning │  │   - Async Execution            │
└────────────┬───────────┘  └──────────┬─────────────────────┘
             │                         │
             ↓                         ↓
┌────────────────────────┐  ┌────────────────────────────────┐
│  RAG System (Qdrant)   │  │     Sentry Integration         │
│  - Vector Embeddings   │  │   - Real-time Incidents        │
│  - Semantic Search     │  │   - Stack Traces               │
│  - Knowledge Base      │  │   - Event Metadata             │
└────────────────────────┘  └────────────────────────────────┘
```

### MCP Tools

The system implements 5 specialized MCP tools for incident investigation:

| Tool                       | Description                       | Use Case                  |
| -------------------------- | --------------------------------- | ------------------------- |
| `get_sentry_issue_details` | Fetch issue metadata, stats, tags | Initial context gathering |
| `get_stacktrace`           | Extract stack trace frames        | Code-level debugging      |
| `search_knowledge_base`    | Semantic similarity search        | Find historical fixes     |
| `analyze_error_frequency`  | Pattern and trend analysis        | Identify systemic issues  |
| `get_user_impact`          | User and service impact metrics   | Prioritization            |

---

## Tech Stack

### Backend

- **Python 3.11+** - Core language
- **FastAPI** - High-performance async API framework
- **Prisma ORM** - Type-safe database ORM with multi-tenancy
- **SQLite** - Local database (production: PostgreSQL ready)
- **Qdrant** - Vector database for RAG
- **LangChain** - LLM orchestration framework
- **OpenAI GPT-4** - Language model for reasoning
- **MCP SDK** - Model Context Protocol implementation

### Frontend

- **Next.js 13+** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Clerk** - Authentication & user management
- **Framer Motion** - Animation library
- **WebSocket API** - Real-time communication

### Infrastructure

- **Sentry** - Error monitoring and tracking

---

## Key Features

### 1. Autonomous AI Agent

The core of LogSense is an autonomous agent that uses the **ReAct pattern** (Reasoning + Acting):

```python
# Agent reasoning loop
for iteration in range(max_iterations):
    # 1. Observe current state
    observation = gather_context()

    # 2. LLM decides next action
    action = llm.choose_tool(observation, available_tools)

    # 3. Execute MCP tool
    result = await mcp_client.call_tool(action.tool, action.params)

    # 4. Update context
    context.append(result)

    # 5. Check if complete
    if agent.is_complete(context):
        break
```

**Benefits:**

- No hardcoded workflows - agent adapts to each incident
- LLM-driven tool selection based on context
- Max 15 iterations to prevent infinite loops
- Real-time streaming of reasoning steps

### 2. MCP Protocol Implementation

LogSense uses **Model Context Protocol** to decouple the AI agent from tool execution:

```
AI Agent (MCP Client) ←→ MCP Server (Tool Registry)
         ↓ STDIO                    ↓
    JSON-RPC Messages          Tool Execution
```

### 3. RAG-Based Knowledge Base

Implements **Retrieval-Augmented Generation** for learning from past incidents:

- **Embedding Model:** OpenAI text-embedding-ada-002
- **Vector Store:** Qdrant with cosine similarity
- **Confidence Threshold:** 70%+ for knowledge storage
- **Semantic Search:** Find similar incidents by error message

**Workflow:**

1. High-confidence analysis (>70%) → Store in Qdrant
2. New incident → Search for similar past incidents
3. Retrieve historical fixes → Feed to LLM
4. Improve resolution accuracy over time

### 4. Real-Time Streaming

WebSocket-based streaming for live investigation updates:

```typescript
// Frontend WebSocket connection
const ws = new WebSocket(`ws://localhost:8000/ws/analyze/${issueId}`);

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case "start": /* Investigation started */
    case "step": /* Agent progress update */
    case "complete": /* Final analysis */
  }
};
```

### 5. Multi-Tenant Architecture

Organization-level data isolation using Clerk + Prisma:

```prisma
model Organization {
  id         String     @id
  clerkOrgId String     @unique
  members    OrganizationMember[]
  analyses   Analysis[]
}

model Analysis {
  id             String   @id
  organizationId String   // Tenant isolation
  issueId        String
  rootCause      String
  confidence     Float
}
```

---

## Getting Started

### Prerequisites

```bash
# Required
- Python 3.11+
- Node.js 18+
- npm/yarn/pnpm

# Optional (for production)
- Docker
- PostgreSQL
```

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/mohanadkandil/logSense.git
cd logSense
```

2. **Backend Setup**

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Generate Prisma client
prisma generate

# Run migrations
prisma db push

# Set environment variables
cp .env.example .env
# Edit .env with your API keys:
# - OPENAI_API_KEY
# - SENTRY_AUTH_TOKEN
# - SENTRY_ORG
# - SENTRY_PROJECT
```

3. **Frontend Setup**

```bash
cd ../frontend

# Install dependencies
npm install

# Set environment variables
cp .env.local.example .env.local
# Edit .env.local with:
# - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# - CLERK_SECRET_KEY
```

### Running the Application

**Terminal 1: Backend**

```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Terminal 2: MCP Server (optional, for real MCP mode)**

```bash
cd backend
python mcp_server.py
```

**Terminal 3: Frontend**

```bash
cd frontend
npm run dev
```

**Access the application:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Usage

### 1. View Incidents

The dashboard automatically fetches recent incidents from Sentry and displays them with real-time stats.

### 2. Start AI Investigation

Click "Start AI Investigation" or select a specific incident to trigger autonomous analysis.

### 3. Watch Real-Time Analysis

The AI agent streams its reasoning process:

- Tool selection decisions
- Data gathered from each tool
- Root cause hypothesis
- Suggested fixes

### 4. Review Results

Final analysis includes:

- **Root Cause:** Detailed explanation of the issue
- **Confidence Score:** 0-100% accuracy estimate
- **Suggested Fixes:** Ranked list of solutions
- **Similar Incidents:** Historical context from knowledge base

### 5. Learn Over Time

High-confidence analyses (>70%) are automatically stored in the knowledge base for future reference.

---

## API Documentation

### REST Endpoints

```
GET  /api/incidents              # List recent incidents
GET  /api/incidents/{id}         # Get incident details
GET  /api/analyses               # List analyses
GET  /api/analyses/{id}          # Get analysis details
GET  /api/knowledge/search       # Search knowledge base
POST /api/incidents/{id}/resolve # Mark as resolved
```

### WebSocket

```
WS /ws/analyze/{issue_id}  # Stream real-time analysis
```

**Message Types:**

- `start` - Investigation begins
- `step` - Agent progress update
- `complete` - Final analysis
- `error` - Error occurred

---

## Configuration

### Agent Modes

LogSense supports 3 agent implementations (configured in `config.py`):

```python
# config.py
use_autonomous_agent = True   # ReAct pattern with LLM tool selection
use_real_mcp = False          # Real MCP client-server
# Default: Mock mode (direct imports)
```

### Environment Variables

**Backend (`.env`):**

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Sentry
SENTRY_AUTH_TOKEN=...
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=optional

# Database
DATABASE_URL=file:./dev.db
```

**Frontend (`.env.local`):**

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# API
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Project Structure

```
logSense/
├── backend/
│   ├── agent/
│   │   ├── autonomous_agent.py    # ReAct agent
│   │   ├── mcp_workflow.py        # Real MCP client
│   │   └── workflow.py            # Mock agent
│   ├── integrations/
│   │   ├── sentry_client.py       # Sentry API
│   │   └── rag.py                 # RAG system
│   ├── tools/
│   │   ├── server.py              # FastMCP tools
│   │   └── tools.py               # Tool implementations
│   ├── main.py                    # FastAPI app
│   ├── mcp_server.py              # MCP server
│   ├── database.py                # Prisma client
│   ├── config.py                  # Settings
│   └── schema.prisma              # Database schema
├── frontend/
│   ├── app/
│   │   ├── app/                   # Protected routes
│   │   ├── sign-in/               # Auth pages
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Landing page
│   ├── components/
│   │   ├── incident-card.tsx      # UI components
│   │   ├── ai-activity-feed.tsx
│   │   └── onboarding-dialog.tsx
│   ├── hooks/
│   │   └── useWebSocket.ts        # WebSocket hook
│   └── middleware.ts              # Clerk middleware
└── README.md
```

---

## Performance & Metrics

- **Analysis Time:** 5-30 seconds (depending on complexity)
- **Confidence Threshold:** 70%+ for knowledge storage
- **Max Agent Iterations:** 15
- **WebSocket Latency:** <100ms
- **Database:** Multi-tenant with row-level isolation
- **Concurrent Analyses:** Unlimited (async architecture)

---

## Future Enhancements

- [ ] Kubernetes deployment with Helm charts
- [ ] PostgreSQL migration for production
- [ ] Prometheus metrics & Grafana dashboards
- [ ] Slack/Teams integration for alerts
- [ ] GitHub integration for automatic PR creation
- [ ] Advanced RAG with reranking models
- [ ] Multi-model support (Claude, Llama, etc.)
- [ ] Cost tracking and optimization
- [ ] A/B testing for agent improvements

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- **OpenAI** - GPT-4 language model
- **Anthropic** - Model Context Protocol specification
- **Sentry** - Error monitoring platform
- **Qdrant** - Vector database
- **Clerk** - Authentication infrastructure

---

## Contact

**Mohanned Kandil**

- GitHub: [@yourusername](https://github.com/mohanadkandil)
- LinkedIn: [Your Profile](https://linkedin.com/in/mohanadkandil)

---

**Built with ❤️ for intelligent infrastructure automation and looking forward to expand it!**
