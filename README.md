# Personal Finance AI Agent

A full-stack AI-powered personal finance assistant built with FastAPI, Next.js, and Supabase.

## Live Demo
[Try it here](https://personal-finance-ai-agent.vercel.app) — no signup needed, click "Try Demo"

## Features
- AI chat assistant personalized to your finances
- Expense and income tracking
- Live dashboard with charts
- AI-generated insights
- Agent tools: calculator, budget analyzer, savings planner
- Dark mode

## Tech Stack
- **Frontend**: Next.js 14, Tailwind CSS, Recharts
- **Backend**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenRouter API
- **Deploy**: Vercel + Railway

## Run Locally

### Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

### Frontend
cd frontend
npm install
npm run dev
```

