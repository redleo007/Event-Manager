import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Events } from './pages/Events';
import { EventsHistory } from './pages/EventsHistory';
import { ImportAttendance } from './pages/ImportAttendance';
import { NoShows } from './pages/NoShows';
import { Blocklist } from './pages/Blocklist';
import { Settings } from './pages/Settings';
import { useAuth } from './context/AuthContext';


function App() {
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    document.title = 'Eventz - Event & Attendance Management';
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #050811 0%, #0f0f1e 100%)',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(0, 217, 255, 0.2)',
          borderTop: '3px solid #00d9ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (user.status !== 'approved') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #050811 0%, #0f0f1e 100%)',
        color: '#fff',
        padding: '24px',
      }}>
        <div style={{
          maxWidth: 520,
          width: '100%',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          padding: '24px 28px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
        }}>
          <h1 style={{ margin: 0, marginBottom: 10 }}>Pending Approval</h1>
          <p style={{ margin: 0, marginBottom: 14, color: 'rgba(255,255,255,0.75)' }}>
            Hi {user.name}, your account is awaiting admin approval. You will be notified once it is approved.
          </p>
          <button
            onClick={logout}
            style={{
              marginTop: 12,
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Layout onLogout={logout}>
        <Routes>
          <Route path="/" element={
            <ErrorBoundary>
              <Dashboard />
            </ErrorBoundary>
          } />
          <Route path="/events" element={
            <ErrorBoundary>
              <Events />
            </ErrorBoundary>
          } />
          <Route path="/events-history" element={
            <ErrorBoundary>
              <EventsHistory />
            </ErrorBoundary>
          } />
          <Route path="/import-attendance" element={
            <ErrorBoundary>
              <ImportAttendance />
            </ErrorBoundary>
          } />
          <Route path="/no-shows" element={
            <ErrorBoundary>
              <NoShows />
            </ErrorBoundary>
          } />
          <Route path="/blocklist" element={
            <ErrorBoundary>
              <Blocklist />
            </ErrorBoundary>
          } />
          <Route path="/settings" element={
            <ErrorBoundary>
              <Settings />
            </ErrorBoundary>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </Router>
  );
}

function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
    </div>
  );
}

export default App;
