from uuid import UUID

import asyncpg

from modules.clients.schemas import CreateClientRequest, UpdateClientRequest


async def get_all_clients(
    conn: asyncpg.Connection,
    tenant_id: UUID,
) -> list[asyncpg.Record]:
    return await conn.fetch(
        """
        SELECT
            c.id, c.name, c.platform, c.priority, c.notes, c.is_active, c.created_at, c.updated_at,
            COUNT(a.id) FILTER (WHERE a.status NOT IN ('Submitted', 'Cancelled') AND a.is_active = TRUE AND a.tenant_id = $1) AS active_assignments_count,
            COUNT(a.id) FILTER (WHERE a.status = 'Submitted' AND a.submitted_at >= date_trunc('week', NOW()) AND a.is_active = TRUE AND a.tenant_id = $1) AS submitted_this_week_count,
            COUNT(a.id) FILTER (WHERE a.status = 'Overdue' AND a.is_active = TRUE AND a.tenant_id = $1) AS overdue_assignments_count,
            COALESCE(SUM(a.payment_kes) FILTER (WHERE a.status = 'Submitted' AND a.is_active = TRUE AND a.tenant_id = $1), 0) AS total_earnings
        FROM clients c
        LEFT JOIN assignments a ON c.id = a.client_id
        WHERE c.tenant_id = $1
          AND c.is_active = TRUE
        GROUP BY c.id
        ORDER BY c.name ASC
        """,
        tenant_id,
    )


async def create_client(
    conn: asyncpg.Connection,
    data: CreateClientRequest,
    tenant_id: UUID,
) -> asyncpg.Record:
    return await conn.fetchrow(
        """
        INSERT INTO clients (tenant_id, name, platform, priority, notes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, platform, priority, notes, is_active, created_at, updated_at
        """,
        tenant_id,
        data.name,
        data.platform,
        data.priority,
        data.notes,
    )


async def update_client(
    conn: asyncpg.Connection,
    client_id: UUID,
    data: UpdateClientRequest,
    tenant_id: UUID,
) -> asyncpg.Record | None:
    # Build SET clause dynamically from only the fields that were provided
    fields = data.model_dump(exclude_unset=True)
    if not fields:
        # Nothing to update — return current state.
        # tenant_id check here ensures cross-tenant lookups return None → 404,
        # indistinguishable from "record doesn't exist."
        return await conn.fetchrow(
            """
            SELECT id, name, platform, priority, notes, is_active, created_at, updated_at
            FROM clients
            WHERE id = $1
              AND tenant_id = $2
              AND is_active = TRUE
            """,
            client_id,
            tenant_id,
        )

    set_clauses = [f"{col} = ${i + 1}" for i, col in enumerate(fields)]
    set_clauses.append("updated_at = NOW()")
    set_sql = ", ".join(set_clauses)
    values = list(fields.values())
    # Positional params: fields occupy $1..$N, then client_id, then tenant_id
    values.append(client_id)   # WHERE id = $N+1
    values.append(tenant_id)   # AND tenant_id = $N+2

    return await conn.fetchrow(
        f"""
        UPDATE clients
        SET {set_sql}
        WHERE id = ${len(values) - 1}
          AND tenant_id = ${len(values)}
          AND is_active = TRUE
        RETURNING id, name, platform, priority, notes, is_active, created_at, updated_at
        """,
        *values,
    )


async def soft_delete_client(
    conn: asyncpg.Connection,
    client_id: UUID,
    tenant_id: UUID,
) -> asyncpg.Record | None:
    return await conn.fetchrow(
        """
        UPDATE clients
        SET is_active = FALSE, updated_at = NOW()
        WHERE id = $1
          AND tenant_id = $2
          AND is_active = TRUE
        RETURNING id
        """,
        client_id,
        tenant_id,
    )


async def get_financial_analytics(
    conn: asyncpg.Connection,
    tenant_id: UUID,
) -> dict:
    row = await conn.fetchrow(
        """
        SELECT
            COALESCE(SUM(payment_kes) FILTER (WHERE status = 'Submitted'), 0) AS total_collected_kes,
            COALESCE(SUM(payment_kes) FILTER (WHERE status NOT IN ('Submitted', 'Cancelled')), 0) AS pending_payout_kes,
            COALESCE(SUM(word_count) FILTER (WHERE status = 'Submitted'), 0) AS total_words_submitted,
            COALESCE(COUNT(id) FILTER (WHERE status = 'Submitted'), 0) AS completed_assignments_count
        FROM assignments
        WHERE tenant_id = $1 AND is_active = TRUE
        """,
        tenant_id,
    )

    total_collected = float(row["total_collected_kes"])
    pending_payout = float(row["pending_payout_kes"])
    total_words = int(row["total_words_submitted"])
    completed_count = int(row["completed_assignments_count"])

    avg_rate_per_1000 = (
        round((total_collected / (total_words / 1000.0)), 2)
        if total_words > 0
        else 0.0
    )
    monthly_target = 100000.0  # Default 100,000 KES monthly goal
    progress_pct = min(100, round((total_collected / monthly_target) * 100))

    return {
        "total_collected_kes": total_collected,
        "pending_payout_kes": pending_payout,
        "total_words_submitted": total_words,
        "completed_assignments_count": completed_count,
        "avg_rate_per_1000_words": avg_rate_per_1000,
        "monthly_target_kes": monthly_target,
        "monthly_progress_pct": progress_pct,
    }

