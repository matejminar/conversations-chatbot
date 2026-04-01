import os

import sentry_sdk
from dotenv import load_dotenv

load_dotenv()

sentry_sdk.init(
    dsn="https://3718f1abd807010819ed9436e5e797f0@o339668.ingest.us.sentry.io/4511144192114688",
    traces_sample_rate=1.0,
    send_default_pii=True,
)

import openai
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from db import (
    init_db,
    list_conversations,
    get_conversation,
    get_messages,
    create_conversation,
    delete_conversation,
    add_message,
    update_conversation_title,
)

init_db()

app = FastAPI()

client = openai.OpenAI()


# --- API routes ---


@app.get("/api/conversations")
def api_list_conversations():
    return list_conversations()


@app.post("/api/conversations")
async def api_create_conversation(request: Request):
    body = await request.json()
    title = body.get("title", "New Chat")
    return create_conversation(title)


@app.get("/api/conversations/{conversation_id}")
def api_get_conversation(conversation_id: str):
    conv = get_conversation(conversation_id)
    if not conv:
        return JSONResponse({"error": "Not found"}, status_code=404)
    messages = get_messages(conversation_id)
    return {**conv, "messages": messages}


@app.delete("/api/conversations/{conversation_id}")
def api_delete_conversation(conversation_id: str):
    delete_conversation(conversation_id)
    return {"success": True}


@app.post("/api/chat")
async def api_chat(request: Request):
    body = await request.json()
    conversation_id = body["conversationId"]
    messages = body["messages"]

    sentry_sdk.set_tag("conversation_id", conversation_id)

    # Save user message
    user_message = messages[-1]
    user_text = user_message["content"]
    add_message(conversation_id, "user", user_text)

    # Auto-title from first message
    all_messages = get_messages(conversation_id)
    if len(all_messages) == 1:
        update_conversation_title(conversation_id, user_text[:50])

    # Build OpenAI message history
    openai_messages = [{"role": m["role"], "content": m["content"]} for m in messages]

    async def generate():
        full_response = ""
        stream = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=openai_messages,
            stream=True,
        )
        for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                full_response += delta.content
                yield delta.content

        add_message(conversation_id, "assistant", full_response)

    return StreamingResponse(generate(), media_type="text/plain")


# --- Serve frontend ---

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
@app.get("/chat")
@app.get("/chat/{conversation_id}")
def serve_frontend():
    with open("static/index.html") as f:
        return HTMLResponse(f.read())
