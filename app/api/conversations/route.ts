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
