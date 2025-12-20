# RAG Knowledge Base Implementation

## Goal
Implement a Retrieval-Augmented Generation (RAG) system to enhance Agent responses by leveraging historical task activities. The system will use "STAR + Tie-back" data (Situation, Task, Action, Result, Tie-back) as key knowledge units.

## Core Components

### 1. Database Schema Updates
- **Table**: `task_workflow_history`
- **New Columns**:
  - `embedding`: `vector(1536)` (using `pgvector`) - stores semantic embedding of the `situation`.
  - `is_knowledge_base`: `boolean` - flags high-quality entries suitable for RAG.
  - `knowledge_score`: `float` - optional quality score.

### 2. Nightly Knowledge Refinement (Celery/Cron Job)
- **Trigger**: Runs nightly (e.g., 2 AM) or on-demand.
- **Process**:
  1.  **Scan**: finding recent activities completed in the last 24h that have `status='completed'`.
  2.  **Refine (LLM)**: Send the raw "S-T-A-R" to an LLM (e.g., Claude) to:
      - Generate a concise **Tie-back** if missing (summarizing the insight).
      - Generalize the **Situation** into a canonical form for better matching.
      - Rate the quality (should it be in KB?).
  3.  **Embed**: Generate embedding for the (Authorized) Situation using OpenAI/HF model.
  4.  **Update**: Save `tie_back`, `embedding`, and set `is_knowledge_base=True`.

### 3. Agent Retrieval (The "R" in RAG)
- **Input**: When Agent receives a new task/situation.
- **Search**: Convert current situation to vector -> Query `task_workflow_history` for `top_k` (e.g., 3) nearest neighbors using cosine similarity.
- **Context Injection**: Append the found `Action`, `Result`, and `Tie-back` to the Agent's system prompt or context window:
  > "Previously, when faced with [Historical Situation], we did [Action] which resulted in [Result]. Insight: [Tie-back]."

## Implementation Steps

### Phase 1: Infrastructure
[ ] Install `pgvector` extension in PostgreSQL (via Docker or manual migration).
[ ] Update `TaskWorkflowHistory` model in `backend/app/models/notification.py`.
[ ] Create migration script to add `embedding` column.

### Phase 2: Embeddings Service
[ ] Create `EmbeddingsService` in `backend/app/services/embeddings.py`.
    - Interface with OpenAI `text-embedding-3-small` or local model.

### Phase 3: Nightly Job
[ ] Create `KnowledgeRefinementJob` in `backend/app/worker/knowledge.py`.
    - Logic for LLM refinement + Embedding generation.
    - Schedule with Celery Beat or simple Cron on Docker.

### Phase 4: Integration
[ ] Update `ClaudeService.assign_task` to perform retrieval and inject context.
