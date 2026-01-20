from supabase import create_client, Client
from functools import lru_cache
from .config import settings


@lru_cache()
def get_supabase_client() -> Client:
    """Get Supabase client singleton."""
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_ANON_KEY
    )


@lru_cache()
def get_supabase_admin() -> Client:
    """Get Supabase admin client with service role key."""
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY
    )


# Convenience exports
supabase = get_supabase_client()


class DatabaseError(Exception):
    """Custom database error."""
    pass


async def check_database_connection() -> bool:
    """Check if database connection is healthy."""
    try:
        result = supabase.table("api_directory").select("id").limit(1).execute()
        return True
    except Exception:
        return False
