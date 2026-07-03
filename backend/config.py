from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # All three variables must be set in the environment.
    # No hardcoded fallbacks — Railway (production) and .env (local) must
    # both supply them explicitly.
    database_url:    str
    environment:     str
    allowed_origins: str

    model_config = {
        # Loads .env in local development; ignored when real env vars exist.
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }


settings = Settings()
