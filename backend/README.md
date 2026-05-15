# StudySync AI - Backend

FastAPI backend for the StudySync AI platform.

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

3. Run the development server:
   ```bash
   uvicorn app.main:app --reload
   ```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Database Migrations

```bash
# Run migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "Description"
```

## Testing

```bash
pytest tests/ -v
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| SUPABASE_URL | Your Supabase project URL |
| SUPABASE_ANON_KEY | Supabase anonymous key |
| SUPABASE_SERVICE_KEY | Supabase service role key |
| SUPABASE_DB_PASSWORD | Database password |
| GROQ_API_KEY | Your Groq API key |
| APP_ENV | development or production |
| LOG_LEVEL | INFO, DEBUG, etc. |