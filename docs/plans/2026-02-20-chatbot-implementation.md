# AI Chatbot Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a text-only AI chatbot with conversation management sidebar using Next.js, Vercel AI SDK, and SQLite.

**Architecture:** Next.js 15 App Router with server-side API routes for chat streaming and conversation CRUD. SQLite for persistence. Client-side state managed by Vercel AI SDK's `useChat` hook plus React state for conversation list.

**Tech Stack:** Next.js 15, Vercel AI SDK (`ai`, `@ai-sdk/anthropic`), `better-sqlite3`, Tailwind CSS, TypeScript

---

### Task 1: Scaffold Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, etc. (via create-next-app)

**Step 1: Create Next.js app**

Run from the project root (`/Users/mminar/Projects/2026-02-20-conversations-chatbot`):

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src=no --import-alias="@/*" --use-npm
```

**Step 2: Install dependencies**

```bash
npm install ai @ai-sdk/anthropic better-sqlite3 uuid
npm install -D @types/better-sqlite3 @types/uuid
```

**Step 3: Create `.env.local`**

```
ANTHROPIC_API_KEY=your-key-here
```

**Step 4: Verify it runs**

Run: `npm run dev`
Expected: Next.js dev server starts on localhost:3000

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with dependencies"
```

---

### Task 2: SQLite Database Layer

**Files:**
- Create: `lib/db.ts`
- Create: `lib/queries.ts`

**Step 1: Create `lib/db.ts`**

This file initializes the SQLite connection and creates tables on first import.

```typescript
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "chat.db");

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma("journal_mode = WAL");

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
`);

export default db;
```

**Step 2: Create `lib/queries.ts`**

```typescript
import db from "./db";
import { v4 as uuidv4 } from "uuid";

export interface Conversation {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: number;
}

export function listConversations(): Conversation[] {
  return db
    .prepare("SELECT * FROM conversations ORDER BY updated_at DESC")
    .all() as Conversation[];
}

export function getConversation(id: string): Conversation | undefined {
  return db
    .prepare("SELECT * FROM conversations WHERE id = ?")
    .get(id) as Conversation | undefined;
}

export function getMessages(conversationId: string): Message[] {
  return db
    .prepare(
      "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC"
    )
    .all(conversationId) as Message[];
}

export function createConversation(title: string): Conversation {
  const id = uuidv4();
  const now = Date.now();
  db.prepare(
    "INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)"
  ).run(id, title, now, now);
  return { id, title, created_at: now, updated_at: now };
}

export function deleteConversation(id: string): void {
  db.prepare("DELETE FROM messages WHERE conversation_id = ?").run(id);
  db.prepare("DELETE FROM conversations WHERE id = ?").run(id);
}

export function addMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string
): Message {
  const id = uuidv4();
  const now = Date.now();
  db.prepare(
    "INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(id, conversationId, role, content, now);
  db.prepare("UPDATE conversations SET updated_at = ? WHERE id = ?").run(
    now,
    conversationId
  );
  return { id, conversation_id: conversationId, role, content, created_at: now };
}

export function updateConversationTitle(id: string, title: string): void {
  db.prepare("UPDATE conversations SET title = ? WHERE id = ?").run(title, id);
}
```

**Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add lib/db.ts lib/queries.ts
git commit -m "feat: add SQLite database layer with conversations and messages"
```

---

### Task 3: Conversation API Routes

**Files:**
- Create: `app/api/conversations/route.ts`
- Create: `app/api/conversations/[id]/route.ts`

**Step 1: Create `app/api/conversations/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { listConversations, createConversation } from "@/lib/queries";

export async function GET() {
  const conversations = listConversations();
  return NextResponse.json(conversations);
}

export async function POST(req: Request) {
  const { title } = await req.json();
  const conversation = createConversation(title || "New Chat");
  return NextResponse.json(conversation);
}
```

**Step 2: Create `app/api/conversations/[id]/route.ts`**

```typescript
import { NextResponse } from "next/server";
import {
  getConversation,
  getMessages,
  deleteConversation,
} from "@/lib/queries";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const conversation = getConversation(id);
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const messages = getMessages(id);
  return NextResponse.json({ ...conversation, messages });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  deleteConversation(id);
  return NextResponse.json({ success: true });
}
```

**Step 3: Verify with curl**

Run: `npm run dev` then:
```bash
curl -X POST http://localhost:3000/api/conversations -H 'Content-Type: application/json' -d '{"title":"Test"}'
curl http://localhost:3000/api/conversations
```
Expected: Conversation created and listed

**Step 4: Commit**

```bash
git add app/api/conversations/
git commit -m "feat: add conversation CRUD API routes"
```

---

### Task 4: Chat Streaming API Route

**Files:**
- Create: `app/api/chat/route.ts`

**Step 1: Create `app/api/chat/route.ts`**

```typescript
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { addMessage, updateConversationTitle, getMessages } from "@/lib/queries";

export async function POST(req: Request) {
  const { messages, conversationId } = await req.json();

  // Save the user message
  const userMessage = messages[messages.length - 1];
  addMessage(conversationId, "user", userMessage.content);

  // Auto-title: if this is the first message, set title from content
  const allMessages = getMessages(conversationId);
  if (allMessages.length === 1) {
    const title = userMessage.content.substring(0, 50);
    updateConversationTitle(conversationId, title);
  }

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    messages,
    onFinish: async ({ text }) => {
      addMessage(conversationId, "assistant", text);
    },
  });

  return result.toDataStreamResponse();
}
```

**Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add app/api/chat/route.ts
git commit -m "feat: add chat streaming API route with message persistence"
```

---

### Task 5: Sidebar Component

**Files:**
- Create: `components/sidebar.tsx`

**Step 1: Create `components/sidebar.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface Conversation {
  id: string;
  title: string;
  updated_at: number;
}

export function Sidebar() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  const activeId = pathname.startsWith("/chat/")
    ? pathname.split("/chat/")[1]
    : null;

  const fetchConversations = async () => {
    const res = await fetch("/api/conversations");
    const data = await res.json();
    setConversations(data);
  };

  useEffect(() => {
    fetchConversations();
  }, [pathname]);

  const createNewChat = async () => {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Chat" }),
    });
    const conversation = await res.json();
    router.push(`/chat/${conversation.id}`);
  };

  const deleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (activeId === id) {
      router.push("/chat");
    }
    fetchConversations();
  };

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-screen">
      <div className="p-4">
        <button
          onClick={createNewChat}
          className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
        >
          + New Chat
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-2">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => router.push(`/chat/${conv.id}`)}
            className={`group flex items-center justify-between px-3 py-2 mb-1 rounded-lg cursor-pointer text-sm truncate transition-colors ${
              activeId === conv.id
                ? "bg-gray-700 text-white"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <span className="truncate">{conv.title}</span>
            <button
              onClick={(e) => deleteChat(conv.id, e)}
              className="hidden group-hover:block text-gray-400 hover:text-red-400 ml-2 shrink-0"
            >
              &times;
            </button>
          </div>
        ))}
      </nav>
    </aside>
  );
}
```

**Step 2: Commit**

```bash
git add components/sidebar.tsx
git commit -m "feat: add sidebar component with conversation list"
```

---

### Task 6: Chat UI Components

**Files:**
- Create: `components/chat-messages.tsx`
- Create: `components/chat-input.tsx`

**Step 1: Create `components/chat-messages.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import type { Message } from "ai";

interface ChatMessagesProps {
  messages: Message[];
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <p>Send a message to start the conversation.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[70%] px-4 py-2 rounded-2xl whitespace-pre-wrap ${
              msg.role === "user"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-900"
            }`}
          >
            {msg.content}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
```

**Step 2: Create `components/chat-input.tsx`**

```tsx
"use client";

import { useRef, useEffect } from "react";

interface ChatInputProps {
  input: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export function ChatInput({ input, onChange, onSubmit, isLoading }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  return (
    <form onSubmit={onSubmit} className="border-t border-gray-200 p-4">
      <div className="flex gap-2 max-w-3xl mx-auto">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </div>
    </form>
  );
}
```

**Step 3: Commit**

```bash
git add components/chat-messages.tsx components/chat-input.tsx
git commit -m "feat: add chat messages and input components"
```

---

### Task 7: Wire Up Layout and Pages

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Create: `app/chat/page.tsx`
- Create: `app/chat/[id]/page.tsx`

**Step 1: Update `app/layout.tsx`**

Replace the default layout with the sidebar layout:

```tsx
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Chatbot",
  description: "A simple AI chatbot with conversation management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <div className="flex h-screen">
          <Sidebar />
          <main className="flex-1 flex flex-col">{children}</main>
        </div>
      </body>
    </html>
  );
}
```

**Step 2: Update `app/page.tsx`**

Redirect root to `/chat`:

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/chat");
}
```

**Step 3: Create `app/chat/page.tsx`**

Empty state page when no conversation is selected:

```tsx
export default function ChatIndex() {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-400">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">AI Chatbot</h2>
        <p>Create a new chat or select an existing conversation.</p>
      </div>
    </div>
  );
}
```

**Step 4: Create `app/chat/[id]/page.tsx`**

The main chat page that wires everything together:

```tsx
"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useState, use } from "react";
import { ChatMessages } from "@/components/chat-messages";
import { ChatInput } from "@/components/chat-input";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    fetch(`/api/conversations/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.messages) {
          setInitialMessages(
            data.messages.map((m: { id: string; role: string; content: string }) => ({
              id: m.id,
              role: m.role as "user" | "assistant",
              content: m.content,
            }))
          );
        }
        setLoaded(true);
      });
  }, [id]);

  if (!loaded) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  return <ChatView id={id} initialMessages={initialMessages} />;
}

function ChatView({
  id,
  initialMessages,
}: {
  id: string;
  initialMessages: Message[];
}) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/chat",
      body: { conversationId: id },
      initialMessages,
    });

  return (
    <>
      <ChatMessages messages={messages} />
      <ChatInput
        input={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </>
  );
}
```

**Step 5: Verify the app runs end-to-end**

Run: `npm run dev`
Expected: App loads at localhost:3000, redirects to /chat, sidebar shows, can create conversations, send messages, and get AI responses.

**Step 6: Commit**

```bash
git add app/layout.tsx app/page.tsx app/chat/
git commit -m "feat: wire up layout with sidebar and chat pages"
```

---

### Task 8: Polish and Final Verification

**Step 1: Update `globals.css`**

Strip defaults down to just Tailwind:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 2: Add `chat.db` to `.gitignore`**

Append to `.gitignore`:
```
chat.db
```

**Step 3: Full manual test**

1. `npm run dev`
2. Create a new chat via sidebar button
3. Send a message, verify streaming response
4. Create a second chat, verify sidebar shows both
5. Switch between chats, verify message history loads
6. Delete a chat, verify it's removed from sidebar

**Step 4: Commit**

```bash
git add app/globals.css .gitignore
git commit -m "chore: clean up globals.css and gitignore chat.db"
```
