from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Required — must be set explicitly in every environment.
    # Railway injects this automatically via the Postgres plugin.
    database_url: str

    # Required — set API_KEY in Railway Variables and VITE_API_KEY in Vercel.
    # No default: app refuses to start if this is missing.
    # DEPRECATED: will be removed after the JWT transition is confirmed in production.
    api_key: str

    # Required — set JWT_SECRET in Railway Variables.
    # Must be a long random string (e.g. `openssl rand -hex 32`).
    # No default: app refuses to start if this is missing.
    jwt_secret: str

    # Algorithm used to sign and verify JWTs. HS256 is the only supported value.
    # Changing this requires re-issuing all active tokens.
    jwt_algorithm: str = "HS256"

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
