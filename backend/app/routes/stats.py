from fastapi import APIRouter
from app.routes import get_supabase_admin

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_stats():
    try:
        supabase = get_supabase_admin()
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
        supabase = get_supabase_admin()
        response = supabase.table("offers").select("location").execute()
        locations = [offer.get("location", "Unknown") for offer in response.data]
        
        region_counts = {}
        for loc in locations:
            region_counts[loc] = region_counts.get(loc, 0) + 1
        
        return {"regions": region_counts}
    except Exception as e:
        return {"error": str(e)}