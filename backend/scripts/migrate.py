"""
Run all migrations in order.
Usage: python scripts/migrate.py
"""
import asyncio
import os
import sys
import asyncpg
from pathlib import Path
from dotenv import load_dotenv

# Ensure backend root is in sys.path so 'config' can be imported when run directly
sys.path.insert(0, str(Path(__file__).parent.parent))

load_dotenv()

MIGRATIONS_DIR = Path(__file__).parent.parent / "migrations"


async def run_migrations():
    try:
        from config import settings
        dsn = settings.database_url
    except Exception:
        dsn = os.getenv("DATABASE_URL")

    if not dsn:
        raise ValueError("DATABASE_URL not set in environment or config")

    if dsn.startswith("postgres://"):
        dsn = dsn.replace("postgres://", "postgresql://", 1)

    conn = await asyncpg.connect(dsn=dsn)

    try:
        # Create tracking table if it does not exist
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS _migrations (
                filename   TEXT PRIMARY KEY,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        """)

        applied = {
            row["filename"]
            for row in await conn.fetch("SELECT filename FROM _migrations")
        }

        migration_files = sorted(MIGRATIONS_DIR.glob("*.sql"))

        for migration_file in migration_files:
            if migration_file.name in applied:
                print(f"  skipped  {migration_file.name}")
                continue

            sql = migration_file.read_text()
            try:
                await conn.execute(sql)
                await conn.execute(
                    "INSERT INTO _migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING",
                    migration_file.name,
                )
                print(f"  applied  {migration_file.name}")
            except (
                asyncpg.exceptions.DuplicateTableError,
                asyncpg.exceptions.DuplicateColumnError,
                asyncpg.exceptions.DuplicateObjectError,
                asyncpg.exceptions.UniqueViolationError,
            ) as err:
                # Table/column/constraint already exists on DB — record as applied & proceed
                print(f"  already exists ({err.__class__.__name__}), marking applied: {migration_file.name}")
                await conn.execute(
                    "INSERT INTO _migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING",
                    migration_file.name,
                )

        print("\nAll migrations complete.")

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run_migrations())
