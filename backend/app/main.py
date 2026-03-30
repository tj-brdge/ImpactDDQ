from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine, seed_database
from app.routes import companies, documents, analysis, tags

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ImpactDDQ", description="AI Research Systematization Tool for Impact Investing Due Diligence")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(companies.router)
app.include_router(documents.router)
app.include_router(analysis.router)
app.include_router(tags.router)


@app.on_event("startup")
def startup():
    seed_database()


@app.get("/api/health")
def health():
    return {"status": "ok"}
