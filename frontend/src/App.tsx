import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Events } from './pages/Events';
import { ImportAttendance } from './pages/ImportAttendance';
import { NoShows } from './pages/NoShows';
import { Blocklist } from './pages/Blocklist';
import { Volunteers } from './pages/Volunteers';
import { Settings } from './pages/Settings';
import './styles/index.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/events" element={<Events />} />
          <Route path="/import" element={<ImportAttendance />} />
          <Route path="/no-shows" element={<NoShows />} />
          <Route path="/blocklist" element={<Blocklist />} />
          <Route path="/volunteers" element={<Volunteers />} />
          <Route path="/settings" element={<Settings />} />
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
