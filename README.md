#Event & Attendance Management System

A production-ready, full-stack Event & Attendance Management System built with React, TypeScript, Express, and Supabase. Features real-time dashboards, CSV imports, auto-blocking logic, and a sleek neon Gen-Z UI.

## 🎯 Features

### Core Functionality
- **Events Management**: Create, update, and delete events with full history tracking
- **Participant Management**: Manage participants with bulk CSV imports
- **Attendance Tracking**: Mark attendance with automatic no-show detection
- **Auto-Blocking System**: Automatically blocklist participants after 2 no-shows
- **Blocklist Management**: Manually manage blocklisted participants
- **Volunteer System**: Track and manage volunteer information
- **Real-Time Dashboard**: Live stats and activity feeds
- **Settings**: Configure system-wide parameters

### Technical Features
- ✅ Production-ready code (no placeholders)
- ✅ Full TypeScript strict mode
- ✅ Comprehensive error handling
- ✅ Input validation everywhere
- ✅ Transaction safety for critical operations
- ✅ CSV/Excel file imports
- ✅ Dark Gen-Z neon UI (cyan, purple, magenta, lime)
- ✅ Fully responsive design
- ✅ Separated frontend and backend

## 🏗️ Project Structure

```
TechNexus/
├── backend/                 # Express + TypeScript server
│   ├── src/
│   │   ├── index.ts        # Main server file
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   └── utils/          # Helper functions
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
└── frontend/               # React + TypeScript app
    ├── src/
    │   ├── pages/          # Page components
    │   ├── components/     # Reusable components
    │   ├── api/            # API client
    │   ├── styles/         # Global styles
    │   ├── utils/          # Helper functions
    │   ├── App.tsx
    │   └── main.tsx
    ├── package.json
    ├── vite.config.ts
    └── index.html
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (free tier works great)

### Backend Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Supabase credentials:
   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_anon_key
   PORT=5000
   NODE_ENV=development
   ```

3. **Start the server**
   ```bash
   npm run dev
   ```
   
   Server will run on `http://localhost:5000`

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```
   
   App will run on `http://localhost:3000`

3. **Build for production**
   ```bash
   npm run build
   ```

### Supabase Setup

1. **Create a new Supabase project** at https://supabase.com

2. **Run the SQL schema**
   - Go to your Supabase dashboard
   - Open SQL Editor
   - Copy and paste the contents of `SUPABASE_SETUP.sql`
   - Execute the SQL

3. **Get your credentials**
   - Go to Project Settings → API
   - Copy your Project URL and anon key
   - Add to backend `.env` file

## 📡 API Endpoints

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create event
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Participants
- `GET /api/participants` - Get participants
- `POST /api/participants` - Create participant
- `GET /api/participants/:id` - Get participant
- `PUT /api/participants/:id` - Update participant
- `GET /api/participants/stats/active` - Count active
- `GET /api/participants/stats/blocklisted` - Count blocklisted

### Attendance
- `POST /api/attendance` - Mark attendance
- `GET /api/attendance/event/:eventId` - Get event attendance
- `GET /api/attendance/participant/:participantId` - Get participant attendance
- `PUT /api/attendance/:id` - Update attendance status
- `GET /api/attendance/stats/overview` - Get attendance stats

### Blocklist
- `GET /api/blocklist` - Get blocklist
- `POST /api/blocklist` - Add to blocklist
- `DELETE /api/blocklist/:participantId` - Remove from blocklist

### Volunteers
- `GET /api/volunteers` - Get volunteers
- `POST /api/volunteers` - Create volunteer
- `GET /api/volunteers/:id` - Get volunteer
- `PUT /api/volunteers/:id` - Update volunteer
- `DELETE /api/volunteers/:id` - Delete volunteer

### Settings
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard stats

## 🎨 UI Pages

1. **Dashboard** (`/`)
   - Real-time statistics
   - Recent activity feed
   - Quick overview

2. **Events** (`/events`)
   - Create/Edit/Delete events
   - Event history
   - Event details

3. **Import & Attendance** (`/import`)
   - Bulk import participants via CSV
   - Import attendance records
   - Live validation preview

4. **No-Shows** (`/no-shows`)
   - View no-show history per event
   - Track participant no-show counts
   - Critical participant alerts

5. **Blocklist** (`/blocklist`)
   - View blocklisted participants
   - Manually manage blocklist
   - View blocklist reasons

6. **Volunteers** (`/volunteers`)
   - Add/Edit/Delete volunteers
   - Sort by newest/oldest
   - Track volunteer information

7. **Settings** (`/settings`)
   - Configure no-show threshold
   - Enable/disable auto-blocking
   - View system information

## 🔒 Key Features

### Auto-Blocking Logic
The system automatically blocklists participants when they reach the configured no-show threshold (default: 2):

1. When attendance is marked as "no-show"
2. System counts total global no-shows for the participant
3. If count ≥ limit and auto-block enabled → blocklist participant
4. Activity is logged for audit trail

### CSV Import
Both participant and attendance imports support:
- Batch operations
- Real-time validation
- Error reporting
- Duplicate prevention

### Data Validation
- Email format validation
- Required field checking
- Duplicate detection
- Type safety with TypeScript

## 🎯 Business Rules

1. ✅ Participants with 2+ no-shows → Auto-blocklisted
2. ✅ Blocklisted → Cannot attend new events
3. ✅ Settings changes → Apply immediately
4. ✅ Activity logging → Audit trail maintained
5. ✅ Foreign keys → Data integrity

## 🎨 Design

- **Color Scheme**: Neon cyan, purple, magenta, lime on dark backgrounds
- **Theme**: Dark Gen-Z cyber aesthetic
- **Typography**: Clean, modern sans-serif
- **Responsive**: Mobile to desktop (320px+)
- **Animations**: Smooth transitions and fade-ins

## 🧪 Testing the System

### Create Test Data

1. **Create Events**
   - Go to Events page
   - Click "New Event"
   - Fill in event details

2. **Import Participants**
   - Create CSV file:
     ```
     name,email,phone
     John Doe,john@example.com,1234567890
     Jane Smith,jane@example.com,0987654321
     ```
   - Go to Import & Attendance
   - Upload and import

3. **Mark Attendance**
   - Upload attendance CSV:
     ```
     email,status
     john@example.com,attended
     jane@example.com,no_show
     ```
   - Select event and import

4. **View Dashboard**
   - See real-time stats
   - Check activity feed

5. **Test Auto-Block**
   - Mark same participant no-show 2x
   - Should auto-blocklist
   - Check Blocklist page

## 🚨 Production Checklist

- [ ] Set up Supabase RLS policies properly
- [ ] Add authentication system
- [ ] Set up SSL/HTTPS
- [ ] Configure CORS for production domain
- [ ] Add rate limiting
- [ ] Set up logging and monitoring
- [ ] Add backup strategy
- [ ] Performance optimization
- [ ] Security audit
- [ ] User documentation

## 📝 Environment Variables

### Backend (.env)
```
SUPABASE_URL=your_url
SUPABASE_KEY=your_key
PORT=5000
NODE_ENV=development
```

### Frontend
No env file needed (uses `/api` proxy)

## 🤝 Contributing

This is a production system. All contributions should:
- Follow TypeScript strict mode
- Include proper error handling
- Add input validation
- Include comments for complex logic
- Test thoroughly before submitting

## 📄 License

MIT

## 📞 Support

For issues or questions, please check the codebase documentation and inline comments.

---

**Built with ❤️ using React, TypeScript, Express, and Supabase**
