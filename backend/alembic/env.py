from logging.config import fileConfig

from sqlalchemy import create_engine
from alembic import context
from app.config import get_settings

settings = get_settings()
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = None


def get_url():
    """Build Supabase connection URL from settings."""
    # Extract host from Supabase URL (e.g., "nqihwjruqxshrjcllkbp" from "https://nqihwjruqxshrjcllkbp.supabase.co")
    host = settings.supabase_url.replace("https://", "").replace("http://", "").split(".supabase.co")[0]
    # Supabase uses port 65432 for the connection pooler
    return f"postgresql://postgres:{settings.supabase_db_password}@{host}.supabase.co:65432/postgres"


def run_migrations_offline() -> None:
    url = get_url()
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    url = get_url()
    connectable = create_engine(url)

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()