# Flowday — API Reference

**Version:** 1.0  
**Base URL:** `/api/v1`  
**Status:** Draft — backend stubs exist; full implementation planned for M1

---

## 1. Conventions

| Topic | Rule |
|-------|------|
| Content type | `application/json` for all request and response bodies |
| Timestamps | ISO 8601 with timezone (e.g. `2026-07-01T23:59:00+03:00`). Stored in UTC in the database; converted at the app layer. |
| IDs | UUID strings (e.g. `"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`) |
| Work day | 08:00 today → 07:59 tomorrow (local time). Overnight assignments stay on the day they were started. |
| Auth | None for MVP (single user) |
| Soft delete | `DELETE` sets `is_active = false`; records are never hard-deleted |
| Estimated hours | Calculated on create/update: `CEILING(word_count / 300, 0.5)`, minimum `0.5` |

### 1.1 Error responses

All errors follow this shape:

```json
{
  "detail": "Human-readable error message"
}
```

| Status | When |
|--------|------|
| `400` | Invalid request (e.g. deleting a client with active assignments) |
| `404` | Resource not found or inactive |
| `422` | Validation error (missing/invalid fields) |
| `500` | Server error |

Validation errors (`422`) may include a list of field errors:

```json
{
  "detail": [
    {
      "loc": ["body", "word_count"],
      "msg": "ensure this value is greater than 0",
      "type": "value_error"
    }
  ]
}
```

---

## 2. Health

### `GET /health`

Liveness check. Not prefixed with `/api/v1`.

**Request body:** none

**Response `200`:**

```json
{
  "status": "ok",
  "service": "flowday-api"
}
```

---

## 3. Clients

Prefix: `/api/v1/clients`

Clients are the people the user writes for. Used to populate the client dropdown on the Add Assignment form.

### Shared types

**Client (full record):**

```json
{
  "id": "uuid",
  "name": "Lorah",
  "platform": "WhatsApp",
  "priority": "High",
  "notes": "Prefers APA format",
  "is_active": true,
  "created_at": "2026-07-01T08:00:00Z",
  "updated_at": "2026-07-01T08:00:00Z"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `name` | string (max 100) | Required on create |
| `platform` | string (max 50) | Default `"WhatsApp"` |
| `priority` | enum | `"High"` \| `"Medium"` \| `"Low"`. Default `"Medium"` |
| `notes` | string \| null | Optional |

---

### `GET /api/v1/clients`

List all active clients.

**Request body:** none

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `include_inactive` | boolean | `false` | Include archived clients |

**Response `200`:**

```json
{
  "clients": [
    {
      "id": "uuid",
      "name": "Lorah",
      "platform": "WhatsApp",
      "priority": "High",
      "notes": null,
      "is_active": true,
      "created_at": "2026-07-01T08:00:00Z",
      "updated_at": "2026-07-01T08:00:00Z"
    }
  ]
}
```

---

### `POST /api/v1/clients`

Create a new client.

**Request body:**

```json
{
  "name": "Lorah",
  "platform": "WhatsApp",
  "priority": "High",
  "notes": "Prefers APA format"
}
```

| Field | Required | Type |
|-------|----------|------|
| `name` | yes | string |
| `platform` | no | string |
| `priority` | no | enum |
| `notes` | no | string |

**Response `201`:** Client object (full record, as above)

---

### `GET /api/v1/clients/{id}`

Get a single client by ID.

**Request body:** none

**Path parameters:**

| Param | Type |
|-------|------|
| `id` | uuid |

**Response `200`:** Client object (full record)

**Response `404`:** Client not found

---

### `PATCH /api/v1/clients/{id}`

Update a client. Only supplied fields are changed.

**Request body:**

```json
{
  "name": "Lorah M.",
  "priority": "Medium",
  "notes": "Updated notes"
}
```

All fields optional. Same types as create.

**Response `200`:** Client object (full record)

**Response `404`:** Client not found

---

### `DELETE /api/v1/clients/{id}`

Archive a client (soft delete). Fails if the client has active assignments.

**Request body:** none

**Response `204`:** No content

**Response `400`:** Client has active assignments and cannot be archived

**Response `404`:** Client not found

---

### `GET /api/v1/clients/stats` *(Phase 2)*

Client tracker view — per-client assignment counts and earnings.

**Request body:** none

**Response `200`:**

```json
{
  "clients": [
    {
      "id": "uuid",
      "name": "Lorah",
      "platform": "WhatsApp",
      "priority": "High",
      "active_count": 3,
      "submitted_this_week": 2,
      "overdue_count": 0,
      "total_earned_kes": 1500.00
    }
  ]
}
```

---

## 4. Assignments

Prefix: `/api/v1/assignments`

The core resource. Every piece of work the user receives is tracked here.

### Shared types

**Assignment type enum:**

`"Discussion post"` \| `"Essay"` \| `"Assignment"` \| `"Module response"` \| `"Knowledge quiz"` \| `"Research paper"` \| `"Exam"` \| `"Simulation"` \| `"Other"`

**Status enum:**

`"Not started"` \| `"In progress"` \| `"Submitted"` \| `"Overdue"` \| `"Cancelled"`

**Assignment (full record):**

```json
{
  "id": "uuid",
  "client_id": "uuid",
  "client_name": "Lorah",
  "assignment_type": "Essay",
  "course": "Nursing 4400",
  "word_count": 1200,
  "estimated_hours": 4.0,
  "deadline": "2026-07-01T23:59:00+03:00",
  "status": "In progress",
  "payment_kes": 500.00,
  "notes": "Focus on patient safety",
  "is_active": true,
  "received_at": "2026-07-01T09:15:00+03:00",
  "submitted_at": null,
  "created_at": "2026-07-01T09:15:00+03:00",
  "updated_at": "2026-07-01T14:30:00+03:00"
}
```

**Assignment (list/today item — includes computed fields):**

```json
{
  "id": "uuid",
  "client_id": "uuid",
  "client_name": "Lorah",
  "assignment_type": "Essay",
  "course": "Nursing 4400",
  "word_count": 1200,
  "estimated_hours": 4.0,
  "deadline": "2026-07-01T23:59:00+03:00",
  "status": "In progress",
  "payment_kes": 500.00,
  "notes": "Focus on patient safety",
  "time_remaining_seconds": 5580,
  "urgency": "orange"
}
```

| Computed field | Type | Rule |
|----------------|------|------|
| `time_remaining_seconds` | integer | Seconds until deadline (negative if overdue) |
| `urgency` | enum | `"green"` (> 6 hrs) \| `"orange"` (≤ 6 hrs) \| `"red"` (≤ 2 hrs or overdue) |

---

### `GET /api/v1/assignments`

List assignments with optional filters.

**Request body:** none

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | — | Filter by status |
| `client_id` | uuid | — | Filter by client |
| `include_inactive` | boolean | `false` | Include soft-deleted assignments |

**Response `200`:**

```json
{
  "assignments": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "client_name": "Lorah",
      "assignment_type": "Essay",
      "course": "Nursing 4400",
      "word_count": 1200,
      "estimated_hours": 4.0,
      "deadline": "2026-07-01T23:59:00+03:00",
      "status": "In progress",
      "payment_kes": 500.00,
      "notes": null,
      "time_remaining_seconds": 5580,
      "urgency": "orange"
    }
  ]
}
```

Sorted by `deadline` ascending, then client `priority` descending.

---

### `GET /api/v1/assignments/today`

Today view — assignments due within the current work day (08:00 → 07:59 next day), excluding `Submitted` and `Cancelled`.

**Request body:** none

**Response `200`:**

```json
{
  "day_start": "2026-07-01T08:00:00+03:00",
  "day_end": "2026-07-02T07:59:59+03:00",
  "count": 4,
  "assignments": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "client_name": "Lorah",
      "assignment_type": "Essay",
      "course": "Nursing 4400",
      "word_count": 1200,
      "estimated_hours": 4.0,
      "deadline": "2026-07-01T23:59:00+03:00",
      "status": "In progress",
      "payment_kes": 500.00,
      "notes": null,
      "time_remaining_seconds": 5580,
      "urgency": "red"
    }
  ]
}
```

Sorted by urgency (most urgent first).

---

### `POST /api/v1/assignments`

Create a new assignment. `estimated_hours` is auto-calculated from `word_count` unless explicitly provided.

**Request body:**

```json
{
  "client_id": "uuid",
  "assignment_type": "Essay",
  "course": "Nursing 4400",
  "word_count": 1200,
  "deadline": "2026-07-01T23:59:00+03:00",
  "payment_kes": 500,
  "notes": "Focus on patient safety"
}
```

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `client_id` | yes | uuid | Must reference an active client |
| `assignment_type` | yes | enum | See assignment type enum |
| `course` | no | string (max 150) | Subject or class name |
| `word_count` | no | integer (> 0) | Used to calculate `estimated_hours` |
| `estimated_hours` | no | number (> 0) | Override auto-calculation |
| `deadline` | yes | datetime | Full timestamp with timezone |
| `payment_kes` | no | number (≥ 0) | Optional payment amount |
| `notes` | no | string | Free text |

**Response `201`:** Assignment object (full record)

Side effect: inserts first row into `assignment_status_log` with `new_status: "Not started"`.

---

### `GET /api/v1/assignments/{id}`

Get a single assignment by ID.

**Request body:** none

**Path parameters:**

| Param | Type |
|-------|------|
| `id` | uuid |

**Response `200`:** Assignment object (full record)

**Response `404`:** Assignment not found

---

### `PATCH /api/v1/assignments/{id}`

Update an assignment. Used for status changes from the Today view dropdown and for editing fields.

**Request body:**

```json
{
  "status": "In progress",
  "course": "NUR 4400",
  "word_count": 1500,
  "deadline": "2026-07-02T23:59:00+03:00",
  "notes": "Client extended deadline"
}
```

All fields optional. Same types as create, plus:

| Field | Type | Notes |
|-------|------|-------|
| `status` | enum | See status enum |

**Response `200`:** Assignment object (full record)

Side effects:
- Status change inserts a row into `assignment_status_log`
- Setting status to `"Submitted"` sets `submitted_at` to current timestamp

**Response `404`:** Assignment not found

---

### `DELETE /api/v1/assignments/{id}`

Archive an assignment (soft delete).

**Request body:** none

**Response `204`:** No content

**Response `404`:** Assignment not found

---

### `GET /api/v1/assignments/week` *(Phase 2)*

Weekly view — assignment counts and overload flags per day.

**Request body:** none

**Query parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `week_start` | date | current week | ISO date for the Monday of the target week |

**Response `200`:**

```json
{
  "week_start": "2026-06-30",
  "week_end": "2026-07-06",
  "days": [
    {
      "date": "2026-06-30",
      "assignment_count": 2,
      "total_hours": 5.5,
      "is_overloaded": false,
      "assignments": []
    },
    {
      "date": "2026-07-01",
      "assignment_count": 4,
      "total_hours": 11.0,
      "is_overloaded": true,
      "assignments": []
    }
  ],
  "summary": {
    "total_assignments": 15,
    "submitted": 2,
    "pending": 11,
    "overdue": 2,
    "total_estimated_hours": 38.5,
    "earnings_kes": 3200.00
  }
}
```

Overload rule: `assignment_count > 3` OR `total_hours > 9`.

---

## 5. Schedule

Prefix: `/api/v1/schedule`

The user's fixed daily routine. Blocks are time-only (no date) and applied to the current work day on render.

### Shared types

**Block type enum:**

`"Personal"` \| `"Family"` \| `"Work"` \| `"Break"` \| `"PROTECTED"`

**Schedule block:**

```json
{
  "id": "uuid",
  "start_time": "09:30",
  "label": "READING BLOCK",
  "block_type": "PROTECTED",
  "is_protected": true,
  "sort_order": 4,
  "notes": "Your mental reset. 60 minutes minimum.",
  "is_active": true
}
```

| Field | Type | Notes |
|-------|------|-------|
| `start_time` | string | `HH:MM` (24-hour) |
| `label` | string (max 150) | Display name |
| `block_type` | enum | See block type enum |
| `is_protected` | boolean | Protected blocks cannot be removed |
| `sort_order` | integer | Display order when blocks share a start time |
| `notes` | string \| null | Optional guidance text |

---

### `GET /api/v1/schedule`

List all active schedule blocks for the daily schedule panel.

**Request body:** none

**Response `200`:**

```json
{
  "blocks": [
    {
      "id": "uuid",
      "start_time": "07:30",
      "label": "Wake up — check WhatsApp for updates",
      "block_type": "Personal",
      "is_protected": false,
      "sort_order": 1,
      "notes": "Check for new assignments only — do not start working yet",
      "is_active": true
    },
    {
      "id": "uuid",
      "start_time": "09:30",
      "label": "READING BLOCK",
      "block_type": "PROTECTED",
      "is_protected": true,
      "sort_order": 4,
      "notes": "Your mental reset. 60 minutes minimum.",
      "is_active": true
    }
  ],
  "active_block_id": "uuid"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `active_block_id` | uuid \| null | The block currently in progress based on local time; `null` if between blocks |

Sorted by `start_time`, then `sort_order`.

---

### `PATCH /api/v1/schedule/{id}` *(Phase 2)*

Update a non-protected schedule block (e.g. adjust start time or notes). Protected blocks (`is_protected: true`) cannot be modified.

**Request body:**

```json
{
  "start_time": "11:15",
  "notes": "Updated note"
}
```

**Response `200`:** Schedule block object

**Response `400`:** Block is protected and cannot be modified

**Response `404`:** Block not found

---

## 6. Implementation status

| Endpoint | Status |
|----------|--------|
| `GET /health` | Implemented (stub response) |
| `GET /api/v1/clients` | Stub — returns placeholder message |
| `GET /api/v1/assignments` | Stub |
| `GET /api/v1/assignments/today` | Stub |
| `GET /api/v1/schedule` | Stub |
| All other endpoints | Planned for M1 / Phase 2 |

---

*API reference version 1.0 — updates committed with message: `docs: update API reference vX.X`*
