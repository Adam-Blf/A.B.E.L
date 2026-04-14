from typing import Optional
from .config import settings


class DatabaseError(Exception):
    """Custom database error."""
    pass


def _has_supabase_config() -> bool:
    return bool(settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY)


def get_supabase_client():
    """Get Supabase client singleton. Returns None if not configured."""
    if not _has_supabase_config():
        return None
    try:
        from supabase import create_client
        from functools import lru_cache

        @lru_cache(maxsize=1)
        def _client():
            return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)

        return _client()
    except Exception:
        return None


def get_supabase_admin():
    """Get Supabase admin client. Returns None if not configured."""
    if not (settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY):
        return None
    try:
        from supabase import create_client
        from functools import lru_cache

        @lru_cache(maxsize=1)
        def _admin():
            return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

        return _admin()
    except Exception:
        return None


async def check_database_connection() -> bool:
    """Check if database connection is healthy. Returns False if not configured."""
    if not _has_supabase_config():
        return False
    try:
        client = get_supabase_client()
        if client is None:
            return False
        client.table("api_directory").select("id").limit(1).execute()
        return True
    except Exception:
        return False
