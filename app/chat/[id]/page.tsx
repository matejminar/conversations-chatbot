"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useState, useMemo, use } from "react";
import { ChatMessages } from "@/components/chat-messages";
import { ChatInput } from "@/components/chat-input";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
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
              parts: [{ type: "text" as const, text: m.content }],
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
  initialMessages: UIMessage[];
}) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { conversationId: id },
      }),
    [id]
  );

  const { messages, sendMessage, status } = useChat({
    transport,
    messages: initialMessages,
  });

  const isLoading = status === "submitted" || status === "streaming";

  return (
    <>
      <ChatMessages messages={messages} />
      <ChatInput
        onSend={(text) => sendMessage({ text })}
        isLoading={isLoading}
      />
    </>
  );
}
