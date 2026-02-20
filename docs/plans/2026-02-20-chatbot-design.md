# AI Chatbot with Conversations — Design

## Overview

A simple text-only AI chatbot with a sidebar for managing multiple conversation threads. Built for demo purposes with no authentication.

## Stack

- **Next.js 15** (App Router)
- **Vercel AI SDK** with `@ai-sdk/anthropic`
- **SQLite** via `better-sqlite3`
- **Tailwind CSS**

## Data Model

```sql
conversations (
  id TEXT PRIMARY KEY,        -- UUID
  title TEXT,
  created_at INTEGER,         -- unix timestamp
  updated_at INTEGER          -- unix timestamp
)

messages (
  id TEXT PRIMARY KEY,        -- UUID
  conversation_id TEXT,       -- FK → conversations.id
  role TEXT,                  -- 'user' | 'assistant'
  content TEXT,
  created_at INTEGER          -- unix timestamp
)
```

## UI Layout

```
┌──────────────┬──────────────────────────────────┐
│  Sidebar     │  Chat Area                       │
│              │                                  │
│ [+ New Chat] │  ┌────────────────────────────┐  │
│              │  │ Message bubbles             │  │
│ Conv 1  ●    │  │ (scrollable)                │  │
│ Conv 2       │  │                             │  │
│ Conv 3       │  │                             │  │
│              │  └────────────────────────────┘  │
│              │  ┌────────────────────────────┐  │
│              │  │ Input box          [Send]  │  │
│              │  └────────────────────────────┘  │
└──────────────┴──────────────────────────────────┘
```

- Sidebar: conversation list sorted by updated_at desc, "New Chat" button, active highlight, delete per conversation
- Chat area: message history, streaming responses, text input at bottom

## API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/chat` | POST | Stream chat completions via `streamText` |
| `/api/conversations` | GET | List all conversations |
| `/api/conversations` | POST | Create a new conversation |
| `/api/conversations/[id]` | GET | Get conversation with messages |
| `/api/conversations/[id]` | DELETE | Delete a conversation |

## Key Behaviors

- New chat navigates to it and focuses input
- First user message auto-generates title from first ~50 chars
- Messages stream via Vercel AI SDK `useChat`
- After completed response, both messages persisted to SQLite
- Sidebar updates as conversations are created/updated

## File Structure

```
app/
├── layout.tsx
├── page.tsx
├── chat/
│   ├── page.tsx
│   └── [id]/page.tsx
├── api/
│   ├── chat/route.ts
│   └── conversations/
│       ├── route.ts
│       └── [id]/route.ts
lib/
├── db.ts
└── queries.ts
components/
├── sidebar.tsx
├── chat-messages.tsx
└── chat-input.tsx
```
