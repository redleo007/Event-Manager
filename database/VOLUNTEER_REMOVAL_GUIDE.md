# Database Migration: Remove Volunteer Features

## Overview
This migration safely removes all volunteer-related database tables and structures from the application while preserving all participant, event, and attendance data.

## Changes Made

### 1. New Migration File
- **File**: `database/DROP_VOLUNTEER_TABLES.sql`
- **Purpose**: Safely drops all volunteer-related tables and constraints
- **What it removes**:
  - `volunteer_work` table (and its indexes)
  - `volunteer_attendance` table (and its indexes)
  - `volunteers` table (and its indexes)
  - RLS policies on volunteer tables
  - All foreign key constraints to these tables

### 2. Updated Setup File
- **File**: `database/SUPABASE_SETUP.sql`
- **Changes**:
  - Removed `volunteers` table definition
  - Removed volunteer indexes
  - Removed volunteers from RLS `ALTER TABLE` statements
  - Removed volunteers from RLS `CREATE POLICY` statements
  - Preserved all participant, event, attendance, blocklist, settings, and activity_logs tables

## How to Apply These Changes

### For Existing Databases

If you already have a Supabase database with volunteer tables:

1. **Connect to your Supabase database** (via SQL Editor)

2. **Run the migration**:
   ```bash
   # Copy the contents of database/DROP_VOLUNTEER_TABLES.sql
   # Paste into Supabase SQL Editor and execute
   ```

3. **Verify cleanup**:
   ```sql
   -- These tables should no longer exist
   SELECT * FROM information_schema.tables 
   WHERE table_name IN ('volunteers', 'volunteer_attendance', 'volunteer_work');
   ```

### For New Databases

If setting up a fresh database:

1. **Use the updated** `SUPABASE_SETUP.sql` file directly
2. **No volunteer tables will be created**
3. **Skip the DROP migration** - it's only for existing databases

## Important Notes

✅ **Safe to Apply**: Uses `DROP TABLE IF EXISTS` - won't error if tables don't exist
✅ **Preserves Core Data**: Participant, event, and attendance tables remain untouched
✅ **Cleanup Verified**: All related indexes and policies are removed
✅ **Build Status**: Frontend and backend both compile without errors

## Related Code Changes

The following files were already cleaned up in previous commits:
- ❌ Removed: `backend/src/routes/volunteers.ts`
- ❌ Removed: `backend/src/routes/volunteerAttendance.ts`
- ❌ Removed: `backend/src/services/volunteerService.ts`
- ❌ Removed: `backend/src/services/volunteerAttendanceService.ts`
- ❌ Removed: `frontend/src/pages/Volunteers.tsx`
- ❌ Removed: `frontend/src/pages/AssignWork.tsx`
- ❌ Updated: `frontend/src/api/client.ts` (removed volunteersAPI)

## Rollback (if needed)

To restore volunteer functionality:
1. Restore the previous database backup
2. Or re-run `database/SUPABASE_SETUP.sql` with volunteers table definitions

## Testing

Run the full build to verify:
```bash
cd backend && npm run build
cd ../frontend && npm run build
```

Both should complete without errors.
