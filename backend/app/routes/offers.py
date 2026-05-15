from fastapi import APIRouter
import os

router = APIRouter()

def get_supabase_client():
    from supabase import create_client, ClientOptions
    SUPABASE_URL = os.getenv("SUPABASE_URL", "https://smjbepcthtzqtkjjhttr.supabase.co")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtamJlcGN0aHR6cXRrampodHRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzYyODkyNiwiZXhwIjoyMDkzMjA0OTI2fQ.wCXn688NE-xIM4ppnx5Tk-N5xSkZm0rX3d0VTjp4wJ8")
    return create_client(SUPABASE_URL, SUPABASE_KEY, options=ClientOptions(auto_refresh_token=False, persist_session=False))

@router.get("/")
async def get_offers():
    try:
        supabase = get_supabase_client()
        response = supabase.table("offers").select("*").execute()
        return {"offers": response.data}
    except Exception as e:
        return {"error": str(e)}

@router.get("/search")
async def search_offers(q: str = ""):
    try:
        supabase = get_supabase_client()
        response = supabase.table("offers").select("*").ilike("title", f"%{q}%").execute()
        return {"results": response.data}
    except Exception as e:
        return {"error": str(e)}

@router.get("/filter")
async def filter_offers(location: str = None, job_type: str = None):
    try:
        supabase = get_supabase_client()
        query = supabase.table("offers").select("*")
        
        if location:
            query = query.eq("location", location)
        if job_type:
            query = query.eq("job_type", job_type)
        
        response = query.execute()
        return {"offers": response.data}
    except Exception as e:
        return {"error": str(e)}