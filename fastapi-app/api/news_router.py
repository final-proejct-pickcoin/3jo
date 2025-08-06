from fastapi import APIRouter
from service.news_service import bloomingbit_news
from models.news import NewsItem
from typing import List

router = APIRouter()

@router.get("/news", response_model=List[NewsItem])
def get_latest_news(limit: int = 5):
    return bloomingbit_news(limit)