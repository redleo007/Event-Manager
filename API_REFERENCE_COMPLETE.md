# TechNexus API Reference

## Base URLs
- **Development**: `http://localhost:5000`
- **Production**: `https://technexus-backend.onrender.com`

## Response Format
All endpoints return responses in this format:
```json
{
  "success": true,
  "data": { /* endpoint-specific data */ },
  "timestamp": "2026-01-22T18:03:34.336Z"
}
```

## Endpoints

### Health Check
```
GET /health
Returns: { status: "ok", timestamp: "..." }
```

### Dashboard
```
GET /api/dashboard/stats
Returns: {
  success: true,
  data: {
    totalEvents: number,
    activeParticipants: number,
    blocklistedParticipants: number,
    noShows: number,
    recentActivities: []
  },
  timestamp: "..."
}
```

### Events
```
GET /api/events                          - Get all events
POST /api/events                         - Create event
GET /api/events/:id                      - Get event by ID
PUT /api/events/:id                      - Update event
DELETE /api/events/:id                   - Delete event
GET /api/events/:event_id/participants   - Get event participants
GET /api/events/:event_id/participants/attendance - Get attendance
```

### Participants
```
GET /api/participants                              - Get all participants
POST /api/participants                             - Create participant
GET /api/participants/:id                          - Get participant by ID
PUT /api/participants/:id                          - Update participant
POST /api/participants/with-event                  - Create with event
POST /api/participants/bulk-import                 - Bulk import
POST /api/participants/bulk-import-batch           - Bulk import (batched)
GET /api/participants/stats/active                 - Get active count
GET /api/participants/stats/blocklisted            - Get blocklisted count
```

### Attendance
```
POST /api/attendance                               - Mark attendance
GET /api/attendance/event/:event_id                - Get event attendance
GET /api/attendance/participant/:participant_id   - Get participant attendance
PUT /api/attendance/:id                            - Update attendance
DELETE /api/attendance/:id                         - Delete attendance
POST /api/attendance/bulk-import                   - Bulk import
POST /api/attendance/bulk-import-batch             - Bulk import (batched)
GET /api/attendance/stats/overview                 - Get overview stats
GET /api/no-shows                                  - Get no-shows list
GET /api/no-shows/by-participant                   - Get no-shows by participant
```

### Blocklist
```
GET /api/blocklist                     - Get all blocklisted participants
POST /api/blocklist                    - Add to blocklist
DELETE /api/blocklist/:participant_id  - Remove from blocklist
GET /api/blocklist/count               - Get blocklist count
GET /api/blocklist/stats               - Get blocklist stats
```

### No-Shows
```
GET /api/no-shows                  - Get all no-shows
POST /api/no-shows                 - Mark as no-show
DELETE /api/no-shows/:id           - Remove no-show record
GET /api/no-shows/count            - Get no-shows count
GET /api/no-shows/export/csv       - Export as CSV
GET /api/no-shows/participant/:id  - Get participant no-shows
```

### Settings
```
GET /api/settings                  - Get application settings
PUT /api/settings                  - Update settings
```

## Error Handling
All endpoints use proper HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Server Error

Error responses:
```json
{
  "error": "Description of what went wrong"
}
```

## Data Models

### Event
```typescript
{
  id: string;
  name: string;
  date: string;
  location?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}
```

### Participant
```typescript
{
  id: string;
  name: string;
  email: string;
  phone?: string;
  is_blocklisted: boolean;
  created_at: string;
}
```

### Attendance
```typescript
{
  id: string;
  event_id: string;
  participant_id: string;
  status: 'attended' | 'no_show' | 'not_attended';
  marked_at: string;
}
```

### Blocklist Entry
```typescript
{
  id: string;
  participant_id: string;
  reason: 'auto_no_show' | 'manual';
  created_at: string;
  participants?: {
    name: string;
    email: string;
  }
}
```

## Frontend API Client

Location: `frontend/src/api/client.ts`

### Usage
```typescript
import { eventsAPI, participantsAPI, attendanceAPI, blocklistAPI, dashboardAPI, settingsAPI } from '../api/client';

// Get events
const events = await eventsAPI.getAll();

// Create event
await eventsAPI.create({ name: 'Event', date: '2026-01-22' });

// Get dashboard stats
const stats = await dashboardAPI.getStats();
```

## Important Notes

1. **Axios Response Unwrapping**: The axios response interceptor automatically unwraps `{ success, data, timestamp }` to just return the `data` field for cleaner component code.

2. **Authentication**: Current implementation uses simple localStorage token. Customize in `frontend/src/App.tsx`.

3. **Supabase Integration**: All data is stored in Supabase PostgreSQL. Configure via environment variables.

4. **Deployment**: Both frontend and backend deploy to Render. Configure via `render.yaml`.

