from fastapi import APIRouter
from app.routes import get_supabase_admin

router = APIRouter()

@router.get("/")
async def get_offers():
    try:
        supabase = get_supabase_admin()
        response = supabase.table("offers").select("*").execute()
        return {"offers": response.data}
    except Exception as e:
        return {"error": str(e)}

@router.get("/search")
async def search_offers(q: str = ""):
    try:
        supabase = get_supabase_admin()
        response = supabase.table("offers").select("*").ilike("title", f"%{q}%").execute()
        return {"results": response.data}
    except Exception as e:
        return {"error": str(e)}

@router.get("/filter")
async def filter_offers(location: str = None, job_type: str = None):
    try:
        supabase = get_supabase_admin()
        query = supabase.table("offers").select("*")
        
        if location:
            query = query.eq("location", location)
        if job_type:
            query = query.eq("job_type", job_type)
        
        response = query.execute()
        return {"offers": response.data}
    except Exception as e:
        return {"error": str(e)}