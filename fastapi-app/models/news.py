from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class NewsItem(BaseModel):
    title: Optional[str] = None 
    link: str
    published_at: Optional[str] = None 
    source: Optional[str] = None