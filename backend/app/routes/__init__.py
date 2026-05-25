import os
from supabase import create_client, ClientOptions

_supabase_admin_client = None

def get_supabase_admin():
    global _supabase_admin_client
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")

    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in environment")

    if _supabase_admin_client is None:
        _supabase_admin_client = create_client(
            SUPABASE_URL, SUPABASE_KEY,
            options=ClientOptions(auto_refresh_token=False, persist_session=False)
        )
    return _supabase_admin_client
