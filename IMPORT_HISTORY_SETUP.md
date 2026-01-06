# Import History & Rollback Feature - Setup Guide

## Overview
This guide will help you set up the import session tracking and rollback feature in your TechNexus system. This feature allows you to view the history of all CSV imports and rollback (delete) any import to restore the previous state.

## Prerequisites
- Supabase account with access to your database
- Backend and frontend servers running
- Admin access to the Supabase SQL Editor

## Step 1: Apply Database Migration

### Option A: Using Supabase Web Dashboard

1. **Login to Supabase**: Open [supabase.com](https://supabase.com) and login to your project
2. **Navigate to SQL Editor**: Click "SQL Editor" in the left sidebar
3. **Create New Query**: Click "New Query" button
4. **Copy Migration Script**: 
   - Open the file: `IMPORT_SESSIONS_MIGRATION.sql` in your project root
   - Copy the entire content
5. **Paste & Execute**:
   - Paste the migration script into the Supabase SQL Editor
   - Click "Run" button (or Ctrl+Enter)
   - Wait for the script to complete successfully

### Option B: Using Supabase CLI (Advanced)

If you have Supabase CLI installed, you can run:

```bash
supabase db push --project-ref <your-project-ref>
```

## Step 2: Verify Tables Created

After running the migration, verify that all tables were created successfully:

1. **Go to Table Editor** in Supabase
2. **Check for these new tables**:
   - `import_sessions` - Tracks all import operations
   - `import_audit_logs` - Records all actions performed on imports
   - `attendance_snapshots` - Stores previous attendance data for rollback

3. **Verify Column Additions**:
   - `participants` table should have `import_session_id` column
   - `attendance` table should have `import_session_id` column

## Step 3: Restart Backend Server

The backend has been updated to support import tracking. Restart it:

```bash
# From the backend directory
npm run dev
```

The server should initialize and show:
```
✅ Supabase initialized successfully
🚀 Server running on http://localhost:5000
```

## Step 4: Refresh Frontend

Reload your browser with the frontend:
- The Import History tab should now be visible
- The feature is ready to use

## Using the Import History Feature

### View Import History

1. **Go to "Import Data" page** in your app
2. **Click the "Import History" tab**
3. **Select an event** from the dropdown
4. **View all imports** for that event with:
   - Import type (Participants or Attendance)
   - Date and time uploaded
   - Number of records imported
   - Current status (Active or Reverted)

### Delete/Rollback an Import

1. **In the Import History tab**, find the import you want to rollback
2. **Click the "Delete" button** in the Action column
3. **Review the confirmation modal**:
   - Shows import type and record count
   - Warns that action cannot be undone
4. **Click "Delete Import"** to confirm
5. **The system will**:
   - Restore all data to its previous state
   - Remove the imported records (for new imports)
   - Restore previous attendance status and blocklist flags
   - Mark the import as "Reverted"
   - Log the action for audit trail

## What Gets Rolled Back

### For Participant Imports
- **New participants** are deleted entirely
- **Audit log** is created recording the deletion

### For Attendance Imports
- **Attendance records** are removed
- **Blocklist flags** are restored to previous state (if auto-enabled)
- **Participant status** is restored
- **Snapshots** are used to ensure data consistency
- **Audit log** is created recording the revert

## Lifetime History

All imports are tracked permanently with:
- **Timestamp** of when import was uploaded
- **Type** of import (Participants or Attendance)
- **Record count** showing how many records were imported
- **Status** showing if import is Active or Reverted
- **Audit trail** showing all actions performed

## Troubleshooting

### "No import history for this event"
- Ensure the database migration was applied successfully
- Check that you've selected the correct event
- Import some data first to see it in history

### Delete button not working
- Ensure backend is running and connected to Supabase
- Check browser console for error messages
- Verify the import status is "Active" (not already reverted)

### Tables not appearing in Supabase
- Re-run the migration script from `IMPORT_SESSIONS_MIGRATION.sql`
- Check Supabase logs for any SQL errors
- Verify you have admin access to run DDL statements

## API Endpoints

The following new API endpoints are available:

```
GET  /api/imports?event_id=<event_id>  - Get all imports for an event
GET  /api/imports/:sessionId            - Get specific import session with audit logs
DELETE /api/imports/:sessionId           - Delete/rollback an import
```

## Database Schema Reference

### import_sessions Table
```sql
id              UUID PRIMARY KEY
event_id        UUID REFERENCES events
import_type     TEXT ('participants' or 'attendance')
status          TEXT ('active' or 'reverted')
record_count    INTEGER
uploaded_at     TIMESTAMP
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### import_audit_logs Table
```sql
id              UUID PRIMARY KEY
import_session_id UUID REFERENCES import_sessions
action          TEXT ('create', 'delete', 'rollback')
details         TEXT (JSON details of action)
created_at      TIMESTAMP
```

### attendance_snapshots Table
```sql
id              UUID PRIMARY KEY
import_session_id UUID REFERENCES import_sessions
attendance_id   UUID REFERENCES attendance
previous_status TEXT
previous_blocklist_status BOOLEAN
is_new_participant BOOLEAN
created_at      TIMESTAMP
```

## Support

If you encounter any issues:
1. Check the browser console (F12) for JavaScript errors
2. Check the backend terminal for server errors
3. Review the Supabase logs for database errors
4. Verify all files are properly imported in the code

---

**Feature Ready**: Once the database migration is applied, all import session tracking and rollback functionality is fully operational.
