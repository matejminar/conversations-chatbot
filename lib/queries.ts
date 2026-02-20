import getDb from "./db";
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
  return getDb()
    .prepare("SELECT * FROM conversations ORDER BY updated_at DESC")
    .all() as Conversation[];
}

export function getConversation(id: string): Conversation | undefined {
  return getDb()
    .prepare("SELECT * FROM conversations WHERE id = ?")
    .get(id) as Conversation | undefined;
}

export function getMessages(conversationId: string): Message[] {
  return getDb()
    .prepare(
      "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC"
    )
    .all(conversationId) as Message[];
}

export function createConversation(title: string): Conversation {
  const id = uuidv4();
  const now = Date.now();
  getDb().prepare(
    "INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)"
  ).run(id, title, now, now);
  return { id, title, created_at: now, updated_at: now };
}

export function deleteConversation(id: string): void {
  getDb().prepare("DELETE FROM messages WHERE conversation_id = ?").run(id);
  getDb().prepare("DELETE FROM conversations WHERE id = ?").run(id);
}

export function addMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string
): Message {
  const id = uuidv4();
  const now = Date.now();
  getDb().prepare(
    "INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(id, conversationId, role, content, now);
  getDb().prepare("UPDATE conversations SET updated_at = ? WHERE id = ?").run(
    now,
    conversationId
  );
  return { id, conversation_id: conversationId, role, content, created_at: now };
}

export function updateConversationTitle(id: string, title: string): void {
  getDb().prepare("UPDATE conversations SET title = ? WHERE id = ?").run(title, id);
}
