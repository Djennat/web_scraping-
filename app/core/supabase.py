
from app.core.config import settings
from supabase import Client, create_client


# Initialize Supabase client
supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_KEY
)

def get_supabase_client() -> Client:
    """
    Get the Supabase client instance.
    Returns:
        Client: The Supabase client instance
    """
    return supabase 