# ImpactDDQ — AI Research Systematization Tool

AI-powered research pipeline for impact investing due diligence.

## Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### Frontend

```bash
cd frontend
npm install
```

### Environment

Copy `.env.example` to `.env` and add your Anthropic API key:

```bash
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY
```

## Running

```bash
# Terminal 1 — Backend
cd backend
ANTHROPIC_API_KEY=your-key python -m uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open http://localhost:5173
