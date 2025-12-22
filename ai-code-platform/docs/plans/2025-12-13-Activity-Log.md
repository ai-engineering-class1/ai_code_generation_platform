# ✅ **Recommended Table: activity_log**

```sql
CREATE TABLE activity_log (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

    ticket_id BIGINT NOT NULL,
    operator_id BIGINT NOT NULL,

    activity_start_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    activity_end_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Workflow state transition
    state_before VARCHAR(50) NOT NULL,
    state_after  VARCHAR(50) NOT NULL,

    -- START Framework fields
    situation TEXT NOT NULL,
    task TEXT NOT NULL,
    action TEXT NOT NULL,
    result TEXT NOT NULL,
    tie_back TEXT NOT NULL,

    -- Optional metadata
    activity_type VARCHAR(50),
    is_public BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

---

# ✅ **Why this is the right structure**

### **1. Explicit workflow transitions**
You now capture:
- **state_before** — e.g., `"In Progress"`
- **state_after** — e.g., `"Ready for Review"`

This gives you:
- a complete audit trail  
- the ability to reconstruct the ticket’s lifecycle  
- analytics like “average time in each state”  

### **2. START Framework is fully represented**

Each component gets its own column:
- Situation — context or trigger
- Task — role/responsibility
- Action — what was done
- Result — outcome
- Tie‑back — summary or reflection

This keeps your activity logs structured and teachable:
- search by action or result
- generate structured reports
- feed to AI models as RAG Knowledge Base data source
- train junior devs on clear documentation habits
 
### **3. Metadata stays flexible**
`activity_type` and `is_public` give you future extensibility without schema changes.

---

# ✅ **Activity Attachments Table**

This is the cleanest way to support screenshots, logs, documents, etc.

```sql
CREATE TABLE activity_attachment (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

    activity_id BIGINT NOT NULL REFERENCES activity_log(id) ON DELETE CASCADE,

    file_url TEXT NOT NULL,
    file_name TEXT,
    file_type VARCHAR(100),   -- e.g., image/png, text/plain, application/pdf
    file_size BIGINT,         -- bytes

    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Why this design works**
- Supports **multiple attachments per activity**
- Keeps the main log table lean
- Allows you to store metadata for validation or UI display
- `ON DELETE CASCADE` ensures cleanup when an activity is removed

---

# ✅ **Optional: Workflow State Lookup Table**

If you want strict control over allowed states:

```sql
CREATE TABLE workflow_state (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);
```

Then `state_before` and `state_after` can reference this table.

---

# ✅ Example Activity Entry (with workflow transition)

| Field | Example |
|-------|---------|
| state_before | `"Investigating"` |
| state_after | `"Fix Implemented"` |
| situation | "API latency spike detected during peak hours." |
| task | "As backend engineer, responsible for root cause analysis." |
| action | "Traced latency to Redis node failure, executed failover." |
| result | "Service restored, latency normalized." |
| tie_back | "Added Redis cluster health alert to prevent recurrence." |

Attachments might include:
- screenshot of reproduced issue 
- log snippet  
- diagram helping the explanation

