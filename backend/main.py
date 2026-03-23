from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.chat import router as chat_router
from routes.transactions import router as transactions_router
from routes.profile import router as profile_router

app = FastAPI(title="Finance Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(transactions_router)
app.include_router(profile_router)

@app.get("/")
def root():
    return {"message": "Finance Agent API is running"}

@app.get("/health")
def health():
    return {"status": "ok"}