from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from news_api.news_router import router as news_router

# 전체 서버
app = FastAPI()

# CORS 허용 설정
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
    "http://localhost",
    "http://127.0.0.1"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(news_router)

@app.get("/")
def home():
    return {"message": "Bloomingbit News API Running!"}