# Flowday API Reference

Backend version **0.1.0** · Base URL `http://localhost:8000`

---

## Table of Contents

- [Global error shape](#global-error-shape)
- [System](#system)
  - [GET /health](#get-health)
- [Clients](#clients)
  - [GET /api/v1/clients/](#get-apiv1clients)
  - [POST /api/v1/clients/](#post-apiv1clients)
  - [PATCH /api/v1/clients/{id}](#patch-apiv1clientsid)
  - [DELETE /api/v1/clients/{id}](#delete-apiv1clientsid)
- [Assignments](#assignments)
  - [GET /api/v1/assignments/](#get-apiv1assignments)
  - [GET /api/v1/assignments/today](#get-apiv1assignmentstoday)
  - [POST /api/v1/assignments/](#post-apiv1assignments)
  - [PATCH /api/v1/assignments/{id}/status](#patch-apiv1assignmentsidstatus)
- [Schedule](#schedule)
  - [GET /api/v1/schedule/](#get-apiv1schedule)

---

## Global error shape

All error responses — whether from the global exception handlers or from
FastAPI's built-in validation — use a consistent envelope:

```json
{
  "error": true,
  "message": "Human-readable description of what went wrong",
  "detail": null
}
```

FastAPI's `422 Unprocessable Entity` responses keep the standard Pydantic
`detail` array shape so the frontend can map field-level errors.

### asyncpg errors mapped globally

| DB error | HTTP status | `message` |
|---|---|---|
| `ForeignKeyViolationError` | `400` | Invalid reference — the related record does not exist |
| `UniqueViolationError` | `409` | A record with this value already exists |
| `CheckViolationError` | `400` | Value is not allowed for this field |
| Any other `Exception` | `500` | An unexpected error occurred |

---

## System

### GET /health

Returns the health of the API service and its database connection.

**No request body.**

#### Success response `200`

```json
{
  "status": "ok",
  "service": "flowday-api",
  "database": "connected",
  "environment": "development"
}
```

| Field | Type | Values |
|---|---|---|
| `status` | string | `"ok"` · `"degraded"` |
| `service` | string | always `"flowday-api"` |
| `database` | string | `"connected"` · `"unreachable"` |
| `environment` | string | `"development"` · `"production"` |

> `status` is `"degraded"` and `database` is `"unreachable"` if the pool
> cannot execute `SELECT 1`. The HTTP status code is still **200** so
> load-balancer health checks always receive a parseable response.

---

## Clients

### GET /api/v1/clients/

Returns all **active** clients ordered by name.

**No request body.**

#### Success response `200`

```json
[
  {
    "id": "1c273a0f-8bd1-41a7-9dab-9620f5abd1a3",
    "name": "Globex Ltd",
    "platform": "Email",
    "priority": "High",
    "notes": "Pays on time, strict deadlines",
    "is_active": true,
    "created_at": "2026-07-03T19:31:35.692173Z",
    "updated_at": "2026-07-03T19:31:35.692173Z"
  }
]
```

---

### POST /api/v1/clients/

Creates a new client.

#### Request body

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `name` | string | ✅ | — | 1–100 characters |
| `platform` | string | ❌ | `"WhatsApp"` | max 50 characters |
| `priority` | string | ❌ | `"Medium"` | `"High"` · `"Medium"` · `"Low"` |
| `notes` | string \| null | ❌ | `null` | free text |

```json
{
  "name": "Globex Ltd",
  "platform": "Email",
  "priority": "High",
  "notes": "Pays on time, strict deadlines"
}
```

#### Success response `201`

Returns the full client object (same shape as the list item above).

#### Error codes

| Code | Trigger |
|---|---|
| `422` | Missing `name`, or `priority` is not one of the allowed values |

---

### PATCH /api/v1/clients/{id}

Partially updates a client. All fields are optional; only supplied fields
are updated. `updated_at` is always refreshed.

#### Path parameter

| Parameter | Type | Description |
|---|---|---|
| `id` | UUID | The client's unique identifier |

#### Request body (all fields optional)

| Field | Type | Notes |
|---|---|---|
| `name` | string \| null | 1–100 characters |
| `platform` | string \| null | max 50 characters |
| `priority` | string \| null | `"High"` · `"Medium"` · `"Low"` |
| `notes` | string \| null | free text |

```json
{
  "priority": "Low",
  "notes": "Moved to retainer"
}
```

#### Success response `200`

Returns the updated client object.

#### Error codes

| Code | Trigger |
|---|---|
| `404` | No active client with the given `id` |
| `422` | `priority` value not in the allowed set |

---

### DELETE /api/v1/clients/{id}

Soft-deletes a client by setting `is_active = false`. The record is
retained in the database. Deleted clients no longer appear in list
or PATCH responses.

#### Path parameter

| Parameter | Type | Description |
|---|---|---|
| `id` | UUID | The client's unique identifier |

**No request body.**

#### Success response `204`

Empty body.

#### Error codes

| Code | Trigger |
|---|---|
| `404` | No active client with the given `id` (or already deleted) |

---

## Assignments

### GET /api/v1/assignments/

Returns **all active** assignments with `client_name` from the clients
table, ordered by `deadline ASC`. Includes all statuses.

**No request body.**

#### Success response `200`

```json
[
  {
    "id": "229f8946-b32a-4299-bf23-175cd4e29804",
    "client_id": "c74b1bd8-cc4e-4975-8279-5e7560fe21a5",
    "client_name": "Globex International",
    "assignment_type": "Essay",
    "course": "ENGL 201",
    "word_count": 1500,
    "estimated_hours": "5.0",
    "deadline": "2026-07-04T19:00:00Z",
    "status": "Submitted",
    "payment_kes": "1200.00",
    "notes": "APA format, double-spaced",
    "is_active": true,
    "received_at": "2026-07-03T19:41:09.009388Z",
    "submitted_at": "2026-07-03T19:45:59.418459Z",
    "created_at": "2026-07-03T19:41:09.009388Z",
    "updated_at": "2026-07-03T19:45:59.418459Z"
  }
]
```

---

### GET /api/v1/assignments/today

Returns active assignments for the **current Nairobi work day**, excluding
`Submitted` and `Cancelled` statuses.

**Work-day boundary:** 08:00 Africa/Nairobi to 07:59 the following
calendar day. An assignment due at 02:00 Wednesday (EAT) is returned
when queried at any time on Tuesday after 08:00 EAT through to Wednesday
07:59 EAT.

**No request body.**

#### Success response `200`

Same shape as `GET /api/v1/assignments/`. Returns `[]` when there are no
qualifying assignments for today's window.

---

### POST /api/v1/assignments/

Creates a new assignment. `estimated_hours` is auto-calculated from
`word_count` using `⌈word_count ÷ 300⌉` rounded up to the nearest `0.5`
and must **not** be supplied by the caller.

#### Request body

| Field | Type | Required | Notes |
|---|---|---|---|
| `client_id` | UUID | ✅ | Must reference an existing client |
| `assignment_type` | string | ✅ | See allowed values below |
| `course` | string \| null | ❌ | max 150 characters |
| `word_count` | integer \| null | ❌ | must be > 0; drives `estimated_hours` |
| `deadline` | ISO 8601 datetime | ✅ | timezone-aware recommended |
| `payment_kes` | number \| null | ❌ | must be ≥ 0 |
| `notes` | string \| null | ❌ | free text |

**Allowed `assignment_type` values:**
`Discussion post` · `Essay` · `Assignment` · `Module response` ·
`Knowledge quiz` · `Research paper` · `Exam` · `Simulation` · `Other`

```json
{
  "client_id": "1c273a0f-8bd1-41a7-9dab-9620f5abd1a3",
  "assignment_type": "Essay",
  "course": "ENGL 201",
  "word_count": 1500,
  "deadline": "2026-07-04T22:00:00+03:00",
  "payment_kes": 1200.00,
  "notes": "APA format, double-spaced"
}
```

#### Success response `201`

Returns the full assignment object, including the auto-calculated
`estimated_hours` (`"5.0"` for 1500 words) and `client_name`.

#### Error codes

| Code | Trigger |
|---|---|
| `400` | `client_id` does not reference an existing client (FK violation) |
| `400` | `assignment_type` or `status` fails the DB CHECK constraint |
| `422` | Missing required fields, or `assignment_type` not in the allowed set |

---

### PATCH /api/v1/assignments/{id}/status

Updates the `status` of an assignment. When `status` is set to
`"Submitted"`, `submitted_at` is automatically set to the current UTC
timestamp. Every status change is written to `assignment_status_log`.

#### Path parameter

| Parameter | Type | Description |
|---|---|---|
| `id` | UUID | The assignment's unique identifier |

#### Request body

| Field | Type | Required | Notes |
|---|---|---|---|
| `status` | string | ✅ | See allowed values below |

**Allowed `status` values:**
`Not started` · `In progress` · `Submitted` · `Overdue` · `Cancelled`

```json
{
  "status": "Submitted"
}
```

#### Success response `200`

Returns the full updated assignment object with `status`, `submitted_at`,
and `updated_at` reflecting the change.

#### Error codes

| Code | Trigger |
|---|---|
| `404` | No active assignment with the given `id` |
| `422` | `status` is not one of the five allowed values |

---

## Schedule

### GET /api/v1/schedule/

Returns all **active** schedule blocks ordered by `start_time ASC`,
`sort_order ASC`. The schedule is seeded and read-only through the API.

**No request body.**

#### Success response `200`

```json
[
  {
    "id": "5fa1ddc3-b09e-49ee-8505-ddba95fbebb8",
    "start_time": "07:30:00",
    "label": "Wake up — check WhatsApp for updates",
    "block_type": "Personal",
    "is_protected": false,
    "sort_order": 1,
    "notes": "Check for new assignments only — do not start working yet",
    "is_active": true,
    "created_at": "2026-07-02T21:08:42.808736Z",
    "updated_at": "2026-07-02T21:08:42.808736Z"
  }
]
```

| Field | Type | Values |
|---|---|---|
| `start_time` | string | `HH:MM:SS` (24-hour) |
| `block_type` | string | `Personal` · `Family` · `Work` · `Break` · `PROTECTED` |
| `is_protected` | boolean | `true` — must not be overridden by work tasks |
