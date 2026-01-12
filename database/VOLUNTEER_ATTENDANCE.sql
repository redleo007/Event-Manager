-- Volunteer Event Attendance Tracking Table
CREATE TABLE IF NOT EXISTS volunteer_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id UUID NOT NULL REFERENCES volunteers(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  attendance_status TEXT NOT NULL CHECK (attendance_status IN ('attended', 'not_attended', 'no_show')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add unique constraint to prevent duplicate entries per volunteer per event
CREATE UNIQUE INDEX idx_volunteer_attendance_unique ON volunteer_attendance(volunteer_id, event_id);

-- Indexes for fast lookups
CREATE INDEX idx_volunteer_attendance_volunteer ON volunteer_attendance(volunteer_id);
CREATE INDEX idx_volunteer_attendance_event ON volunteer_attendance(event_id);
CREATE INDEX idx_volunteer_attendance_status ON volunteer_attendance(attendance_status);
CREATE INDEX idx_volunteer_attendance_created ON volunteer_attendance(created_at DESC);
