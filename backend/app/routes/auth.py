from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.routes import get_supabase_admin
from datetime import datetime, timedelta
import uuid

router = APIRouter()

class ResetPasswordRequest(BaseModel):
    user_id: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    email: str

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    try:
        supabase = get_supabase_admin()
        email = request.email.lower().strip()

        user_resp = supabase.table("users").select("id, email").ilike("email", email).execute()
        user = user_resp.data[0] if user_resp.data else None

        if not user:
            auth_users = supabase.auth.admin.list_users()
            auth_list = getattr(auth_users, 'users', [])
            if not auth_list and hasattr(auth_users, '__iter__'):
                auth_list = list(auth_users)
            for u in auth_list:
                u_email = getattr(u, 'email', '') or ''
                if u_email.lower() == email:
                    user = {"id": u.id, "email": u.email}
                    break

        if not user:
            raise HTTPException(status_code=404, detail="No existe ningún usuario con ese email")

        token = uuid.uuid4().hex
        expires_at = (datetime.utcnow() + timedelta(hours=1)).isoformat()

        supabase.table("password_resets").insert({
            "user_id": user["id"],
            "token": token,
            "expires_at": expires_at,
            "used": False
        }).execute()

        return {"token": token, "email": user["email"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    try:
        supabase = get_supabase_admin()
        supabase.auth.admin.update_user_by_id(
            request.user_id,
            {"password": request.new_password}
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/migrate-users")
async def migrate_users():
    try:
        supabase = get_supabase_admin()

        users_response = supabase.table("users").select("*").execute()
        existing_users = users_response.data or []

        if not existing_users:
            return {"migrated": 0, "message": "No hay usuarios en public.users"}

        # Get existing auth users by email
        auth_users_response = supabase.auth.admin.list_users()
        auth_emails = set()
        auth_users_list = getattr(auth_users_response, 'users', [])
        if not auth_users_list and hasattr(auth_users_response, '__iter__'):
            auth_users_list = list(auth_users_response)
        for u in auth_users_list:
            email = getattr(u, 'email', '') or ''
            if email:
                auth_emails.add(email.lower())

        migrated = 0
        skipped = 0
        errors = []

        for user in existing_users:
            email = user.get("email", "").lower()
            if not email:
                skipped += 1
                continue

            if email in auth_emails:
                skipped += 1
                continue

            password = user.get("password", email)
            if not password or len(password) < 6:
                password = email

            try:
                supabase.auth.admin.create_user({
                    "id": user["id"],
                    "email": email,
                    "password": password,
                    "email_confirm": True,
                    "user_metadata": {
                        "role": user.get("role", "worker"),
                        "name": user.get("name", ""),
                        "phone": user.get("phone", "")
                    }
                })
                migrated += 1
            except Exception as e:
                errors.append({"email": email, "error": str(e)})

        return {
            "migrated": migrated,
            "skipped": skipped,
            "errors": errors,
            "total": len(existing_users)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
