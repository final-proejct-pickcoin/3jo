from utils.admin_logger import log_admin_action
from service.user_service import delete_user
from api.auth import get_current_admin
from fastapi import APIRouter, Depends

router = APIRouter()

@router.delete("/admin/users/{email}")
async def admin_delete_user(email: str, current_admin: str = Depends(get_current_admin)):
    await delete_user(email, current_admin)
    # delete_user 내부에서 이미 로그 호출을 하므로 중복 호출 필요 없음
    
    return {"msg": "삭제 완료"}