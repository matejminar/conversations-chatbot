# AI Chatbot

A simple conversational chatbot built with Python, FastAPI, and the OpenAI SDK, instrumented with Sentry for error tracking and AI monitoring.

## Getting Started

### Prerequisites

Set your OpenAI API key as an environment variable:

```bash
export OPENAI_API_KEY=your-api-key-here
```

Or create a `.env` file in the project root:

```
OPENAI_API_KEY=your-api-key-here
```

### Install dependencies

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Run the development server

```bash
uvicorn main:app --reload
```

Open [http://localhost:8000](http://localhost:8000) in your browser.
