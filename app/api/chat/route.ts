import { streamText, convertToModelMessages } from "ai";
import type { UIMessage } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { addMessage, updateConversationTitle, getMessages } from "@/lib/queries";

function getTextFromUIMessage(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");
}

export async function POST(req: Request) {
  const { messages, conversationId } = await req.json();

  // Save the user message
  const userMessage = messages[messages.length - 1] as UIMessage;
  const userText = getTextFromUIMessage(userMessage);
  addMessage(conversationId, "user", userText);

  // Auto-title: if this is the first message, set title from content
  const allMessages = getMessages(conversationId);
  if (allMessages.length === 1) {
    const title = userText.substring(0, 50);
    updateConversationTitle(conversationId, title);
  }

  // Convert UI messages to model messages for the LLM
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    messages: modelMessages,
    onFinish: async ({ text }) => {
      addMessage(conversationId, "assistant", text);
    },
  });

  return result.toUIMessageStreamResponse();
}
