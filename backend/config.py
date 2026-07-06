from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Required — must be set explicitly in every environment.
    # Railway injects this automatically via the Postgres plugin.
    database_url: str

    # Safe to have defaults — override these in Railway's Variables tab
    # for production values.
    environment:     str = "development"
    allowed_origins: str = "http://localhost:5173"
    
    # Web Push Notifications (Override these in Railway Variables!)
    vapid_private_key: str = "DUMMY_PRIVATE_KEY_SET_IN_ENV"
    vapid_subject:     str = "mailto:dummy@example.com"

    model_config = {
        # Loads .env in local development; env vars take precedence.
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }


settings = Settings()
