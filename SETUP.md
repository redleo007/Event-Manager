# Quick Setup Guide for TechNexus

## Step 1: Supabase Configuration

1. Go to https://supabase.com and create a free account
2. Create a new project
3. Go to SQL Editor and run the script in `SUPABASE_SETUP.sql`
4. Go to Project Settings → API and copy:
   - Project URL
   - Anon (public) Key

## Step 2: Backend Setup

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env

# 3. Edit .env with your Supabase credentials
# SUPABASE_URL=your_project_url
# SUPABASE_KEY=your_anon_key
# PORT=5000

# 4. Start development server
npm run dev
```

Server will be available at: `http://localhost:5000`

## Step 3: Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
```

App will be available at: `http://localhost:3000`

## Step 4: Test the System

### 1. Create an Event
- Navigate to http://localhost:3000
- Click "Events" in navigation
- Click "New Event"
- Fill in event details and save

### 2. Import Participants
- Create a CSV file (example_participants.csv):
  ```
  name,email,phone
  Alice Johnson,alice@example.com,1234567890
  Bob Smith,bob@example.com,0987654321
  Carol White,carol@example.com,5555555555
  David Brown,david@example.com,6666666666
  ```
- Go to "Import & Attendance"
- Click "Import Participants" tab
- Upload the CSV file
- Review preview and click "Import Participants"

### 3. Mark Attendance
- Create an attendance CSV (example_attendance.csv):
  ```
  email,status
  alice@example.com,attended
  bob@example.com,attended
  carol@example.com,no_show
  david@example.com,no_show
  ```
- Go to "Import & Attendance"
- Click "Import Attendance" tab
- Select the event you created
- Upload the CSV file
- Review preview and click "Import Attendance"

### 4. Test Auto-Blocking
- Go back to "Import & Attendance" → "Import Attendance"
- Create another attendance CSV with the same participants:
  ```
  email,status
  carol@example.com,no_show
  david@example.com,no_show
  ```
- Mark attendance for the same event (or create a new event first)
- This will trigger auto-blocking for carol@example.com and david@example.com (2 no-shows total)
- Go to "Blocklist" to see them listed

### 5. Check Dashboard
- Click "Dashboard"
- See real-time stats:
  - Total Events
  - Active Participants
  - Total No-Shows
  - Blocklisted count
- See recent activity feed

### 6. Manage Volunteers
- Go to "Volunteers"
- Click "Add Volunteer"
- Fill in volunteer details
- Sort by Newest/Oldest
- Edit or remove volunteers

### 7. Configure Settings
- Go to "Settings"
- Adjust the no-show limit (default: 2)
- Toggle auto-blocking on/off
- Save settings

## API Testing

You can also test the APIs directly:

```bash
# Create an event
curl -X POST http://localhost:5000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Conference",
    "date": "2025-02-15",
    "location": "Convention Center",
    "description": "Annual tech conference"
  }'

# Get all events
curl http://localhost:5000/api/events

# Get dashboard stats
curl http://localhost:5000/api/dashboard/stats

# Get settings
curl http://localhost:5000/api/settings
```

## Troubleshooting

### Backend won't start
- Check `.env` file has correct Supabase URL and key
- Make sure port 5000 is not in use
- Check Node.js version (need 18+)
- Run: `npm install` to ensure dependencies are installed

### Frontend won't connect to backend
- Make sure backend is running on http://localhost:5000
- Check Vite config has correct proxy settings
- Clear browser cache and reload

### CSV import not working
- Ensure CSV has correct column headers: `name`, `email`, `phone` (optional) for participants
- For attendance, use: `email`, `status` (attended or no_show)
- Make sure emails match existing participants

### Auto-blocking not triggering
- Check "Settings" page to ensure auto-blocking is enabled
- Verify participant has exactly 2 (or configured limit) no-shows globally
- Check "No-Shows" page for no-show history

## Production Deployment

### Build Frontend
```bash
cd frontend
npm run build
# Output in frontend/dist/
```

### Build Backend
```bash
cd backend
npm run build
# Output in backend/dist/
```

### Deploy to Cloud
Options:
- **Frontend**: Vercel, Netlify, AWS S3 + CloudFront
- **Backend**: Railway, Render, Heroku, AWS Lambda
- **Database**: Already on Supabase (no deployment needed)

## Performance Tips

1. Set up database indexes (included in SQL script)
2. Implement pagination for large datasets
3. Use activity log retention policy
4. Monitor Supabase query performance
5. Cache dashboard stats with shorter refresh interval

## Security Notes

⚠️ Current setup uses basic auth for development.

For production, add:
1. JWT authentication
2. RLS (Row Level Security) policies
3. Rate limiting
4. HTTPS/SSL
5. CORS configuration
6. Input sanitization
7. SQL injection prevention (already using parameterized queries)

---

**All set! Your Event Management System is ready to use.** 🚀
