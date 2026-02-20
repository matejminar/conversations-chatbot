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
