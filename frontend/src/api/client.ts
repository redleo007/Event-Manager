import axios from 'axios';

// Build a normalized API base URL with a single /api and no TLS surprises in dev
const buildBaseUrl = () => {
  const raw = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

  // If not provided, rely on dev proxy (/api)
  if (!raw) return '/api';

  // Drop trailing slashes
  let base = raw.replace(/\/+$/, '');

  // Avoid duplicate /api (env should NOT include it)
  if (base.toLowerCase().endsWith('/api')) {
    base = base.slice(0, -4);
  }

  // Local dev safety: if someone sets https://localhost without TLS, downgrade to http
  if (base.startsWith('https://localhost')) {
    base = base.replace('https://', 'http://');
  }

  return `${base}/api`;
};

const API_BASE_URL = buildBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Events API
export const eventsAPI = {
  create: (data: any) => api.post('/events', data),
  getAll: () => api.get('/events'),
  getById: (id: string) => api.get(`/events/${id}`),
  update: (id: string, data: any) => api.put(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
  // Event-scoped participant and attendance management
  getParticipants: (eventId: string) => api.get(`/events/${eventId}/participants`),
  getAttendance: (eventId: string) => api.get(`/events/${eventId}/participants/attendance`),
  deleteAllParticipants: (eventId: string) => api.delete(`/events/${eventId}/participants`),
  deleteSelectedParticipants: (eventId: string, participantIds: string[]) => 
    api.post(`/events/${eventId}/participants/bulk-delete`, { participant_ids: participantIds }),
  deleteAllAttendance: (eventId: string) => api.delete(`/events/${eventId}/participants/attendance`),
  deleteSelectedAttendance: (eventId: string, attendanceIds: string[]) =>
    api.post(`/events/${eventId}/participants/attendance/bulk-delete`, { attendance_ids: attendanceIds }),
  undoDelete: (eventId: string, type: 'participant' | 'attendance', undoToken: string) =>
    api.post(`/events/${eventId}/participants/undo-delete`, { type, undo_token: undoToken }),
};

// Participants API
export const participantsAPI = {
  create: (data: any) => api.post('/participants', data),
  createWithEvent: (data: any) => api.post('/participants/with-event', data),
  bulkCreateWithEvent: (data: any) => api.post('/participants/bulk-import', data),
  bulkCreateWithEventBatch: (data: any) => api.post('/participants/bulk-import-batch', data),
  getAll: (includeBlocklisted: boolean = false) =>
    api.get('/participants', { params: { includeBlocklisted } }),
  getById: (id: string) => api.get(`/participants/${id}`),
  update: (id: string, data: any) => api.put(`/participants/${id}`, data),
  getActiveCount: () => api.get('/participants/stats/active'),
  getBlocklistedCount: () => api.get('/participants/stats/blocklisted'),
};

// Attendance API
export const attendanceAPI = {
  mark: (data: any) => api.post('/attendance', data),
  bulkImport: (data: any) => api.post('/attendance/bulk-import', data),
  bulkImportBatch: (data: any) => api.post('/attendance/bulk-import-batch', data),
  getByEvent: (eventId: string) => api.get(`/attendance/event/${eventId}`),
  getByParticipant: (participantId: string) => api.get(`/attendance/participant/${participantId}`),
  update: (id: string, status: string) => api.put(`/attendance/${id}`, { status }),
  delete: (id: string) => api.delete(`/attendance/${id}`),
  getStats: () => api.get('/attendance/stats/overview'),
  // unwrap payload so callers receive the JSON body directly
  getNoShows: () => api.get('/no-shows').then(r => r.data),
  getNoShowsByParticipant: () => api.get('/no-shows/by-participant'),
};

// Blocklist API
export const blocklistAPI = {
  add: (data: any) => api.post('/blocklist', data),
  getAll: () => api.get('/blocklist'),
  remove: (participantId: string) => api.delete(`/blocklist/${participantId}`),
};

// Imports API
export const importsAPI = {
  getByEvent: (eventId: string, days: number = 30) => api.get('/imports', { params: { event_id: eventId, days } }),
  getHistoryLast30Days: (eventId: string) => api.get('/imports', { params: { event_id: eventId, days: 30 } }),
  getSession: (sessionId: string) => api.get(`/imports/${sessionId}`),
  delete: (sessionId: string) => api.delete(`/imports/${sessionId}`),
};

// Settings API
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data: any) => api.put('/settings', data),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getSummary: () => api.get('/dashboard/summary'),
  getOverview: () => api.get('/dashboard/overview'),
};

// Error handler
api.interceptors.response.use(
  (response) => {
    // response.data contains the ApiResponse { success, data, timestamp }
    // Return the data field for easier access in components
    const responseData = response.data;
    return {
      ...response,
      data: responseData && responseData.data !== undefined ? responseData.data : responseData,
    };
  },
  (error) => {
    const message = error.response?.data?.error || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);
