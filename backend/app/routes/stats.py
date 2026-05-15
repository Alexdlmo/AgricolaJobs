from fastapi import APIRouter
import os

router = APIRouter()

def get_supabase_client():
    from supabase import create_client, ClientOptions
    SUPABASE_URL = os.getenv("SUPABASE_URL", "https://smjbepcthtzqtkjjhttr.supabase.co")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtamJlcGN0aHR6cXRrampodHRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzYyODkyNiwiZXhwIjoyMDkzMjA0OTI2fQ.wCXn688NE-xIM4ppnx5Tk-N5xSkZm0rX3d0VTjp4wJ8")
    return create_client(SUPABASE_URL, SUPABASE_KEY, options=ClientOptions(auto_refresh_token=False, persist_session=False))

@router.get("/dashboard")
async def get_dashboard_stats():
    try:
        supabase = get_supabase_client()
        offers_count = supabase.table("offers").select("*", count="exact").execute()
        users_count = supabase.table("users").select("*", count="exact").execute()
        
        return {
            "total_offers": offers_count.count,
            "total_users": users_count.count,
            "active_offers": offers_count.count
        }
    except Exception as e:
        return {"error": str(e)}

@router.get("/offers-by-region")
async def get_offers_by_region():
    try:
        supabase = get_supabase_client()
        response = supabase.table("offers").select("location").execute()
        locations = [offer.get("location", "Unknown") for offer in response.data]
        
        region_counts = {}
        for loc in locations:
            region_counts[loc] = region_counts.get(loc, 0) + 1
        
        return {"regions": region_counts}
    except Exception as e:
        return {"error": str(e)}