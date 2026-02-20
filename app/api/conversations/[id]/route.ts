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
