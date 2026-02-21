import React from 'react';
import './Icon.css';

// Inline SVG data URIs for consistent, lightweight icons
const ICONS: Record<string, string> = {
  dashboard:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%2300d9ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpath d="M3 13h8V3H3zM13 21h8V11h-8zM13 3v4h8V3zM3 21h8v-4H3z"/%3E%3C/svg%3E',
  events:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%2300d9ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Crect x="3" y="4" width="18" height="18" rx="2" ry="2"/%3E%3Cline x1="16" y1="2" x2="16" y2="6"/%3E%3Cline x1="8" y1="2" x2="8" y2="6"/%3E%3Cline x1="3" y1="10" x2="21" y2="10"/%3E%3C/svg%3E',
  participants:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%2300d9ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpath d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/%3E%3Ccircle cx="9" cy="7" r="4"/%3E%3Cpath d="M23 21v-2a4 4 0 0 0-3-3.87"/%3E%3Cpath d="M16 3.13a4 4 0 0 1 0 7.75"/%3E%3C/svg%3E',
  upload:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%2300d9ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpath d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/%3E%3Cpolyline points="17 8 12 3 7 8"/%3E%3Cline x1="12" y1="3" x2="12" y2="15"/%3E%3C/svg%3E',
  history:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%2300d9ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpolyline points="3 3 3 9 9 9"/%3E%3Cpath d="M3.51 15a9 9 0 1 0 .49-6H9"/%3E%3C/svg%3E',
  noShows:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%2300d9ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Ccircle cx="12" cy="12" r="10"/%3E%3Cline x1="12" y1="8" x2="12" y2="12"/%3E%3Cline x1="12" y1="16" x2="12.01" y2="16"/%3E%3C/svg%3E',
  blocklist:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%2300d9ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Ccircle cx="12" cy="12" r="10"/%3E%3Cline x1="4.93" y1="4.93" x2="19.07" y2="19.07"/%3E%3C/svg%3E',
  settings:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%2300d9ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Ccircle cx="12" cy="12" r="3"/%3E%3Cpath d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/%3E%3C/svg%3E',
  menu:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%2300d9ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cline x1="3" y1="12" x2="21" y2="12"/%3E%3Cline x1="3" y1="6" x2="21" y2="6"/%3E%3Cline x1="3" y1="18" x2="21" y2="18"/%3E%3C/svg%3E',
  user:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%2300d9ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpath d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/%3E%3Ccircle cx="12" cy="7" r="4"/%3E%3C/svg%3E',
  logout:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%23ff006e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpath d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/%3E%3Cpolyline points="16 17 21 12 16 7"/%3E%3Cline x1="21" y1="12" x2="9" y2="12"/%3E%3C/svg%3E',
  refresh:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%2300d9ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpolyline points="23 4 23 10 17 10"/%3E%3Cpolyline points="1 20 1 14 7 14"/%3E%3Cpath d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/%3E%3Cpath d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/%3E%3C/svg%3E',
  clock:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%2300d9ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Ccircle cx="12" cy="12" r="10"/%3E%3Cpolyline points="12 6 12 12 16 14"/%3E%3C/svg%3E',
  add:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%2300d9ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cline x1="12" y1="5" x2="12" y2="19"/%3E%3Cline x1="5" y1="12" x2="19" y2="12"/%3E%3C/svg%3E',
  delete:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%23ff006e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpolyline points="3 6 5 6 21 6"/%3E%3Cpath d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/%3E%3Cpath d="M10 11v6"/%3E%3Cpath d="M14 11v6"/%3E%3Cpath d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/%3E%3C/svg%3E',
  lock:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%2300d9ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Crect x="4" y="11" width="16" height="10" rx="2" ry="2"/%3E%3Cpath d="M8 11V7a4 4 0 0 1 8 0v4"/%3E%3Cpath d="M12 15v2"/%3E%3C/svg%3E',
  success:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%2300d9ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Ccircle cx="12" cy="12" r="10"/%3E%3Cpath d="M8 12l3 3 5-5"/%3E%3C/svg%3E',
  error:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%23ff006e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Ccircle cx="12" cy="12" r="10"/%3E%3Cline x1="15" y1="9" x2="9" y2="15"/%3E%3Cline x1="9" y1="9" x2="15" y2="15"/%3E%3C/svg%3E',
  warning:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%23ff9f1c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpath d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/%3E%3Cline x1="12" y1="9" x2="12" y2="13"/%3E%3Cline x1="12" y1="17" x2="12.01" y2="17"/%3E%3C/svg%3E',
  info:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%2300d9ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Ccircle cx="12" cy="12" r="10"/%3E%3Cline x1="12" y1="16" x2="12" y2="12"/%3E%3Cline x1="12" y1="8" x2="12.01" y2="8"/%3E%3C/svg%3E',
  close:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%23ff006e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cline x1="18" y1="6" x2="6" y2="18"/%3E%3Cline x1="6" y1="6" x2="18" y2="18"/%3E%3C/svg%3E',
  save:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%2300d9ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpath d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/%3E%3Cpolyline points="17 21 17 13 7 13 7 21"/%3E%3Cpolyline points="7 3 7 8 15 8"/%3E%3C/svg%3E',
  edit:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%2300d9ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpath d="M12 20h9"/%3E%3Cpath d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/%3E%3C/svg%3E',
  download:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%2300d9ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpath d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/%3E%3Cpolyline points="7 10 12 15 17 10"/%3E%3Cline x1="12" y1="15" x2="12" y2="3"/%3E%3C/svg%3E',
  chart:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%2300d9ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cline x1="18" y1="20" x2="18" y2="10"/%3E%3Cline x1="12" y1="20" x2="12" y2="4"/%3E%3Cline x1="6" y1="20" x2="6" y2="14"/%3E%3C/svg%3E',
  calendar:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2300d9ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Crect x="3" y="4" width="18" height="18" rx="2" ry="2"/%3E%3Cline x1="16" y1="2" x2="16" y2="6"/%3E%3Cline x1="8" y1="2" x2="8" y2="6"/%3E%3Cline x1="3" y1="10" x2="21" y2="10"/%3E%3Crect x="7" y="14" width="4" height="4" rx="1"/%3E%3C/svg%3E',
  mapPin:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%2300d9ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpath d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 1 1 18 0z"/%3E%3Ccircle cx="12" cy="10" r="3"/%3E%3C/svg%3E',
  loader:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%2300d9ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpath d="M21 12a9 9 0 1 1-9-9"/%3E%3C/svg%3E',
  check:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%2300d9ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpolyline points="20 6 9 17 4 12"/%3E%3C/svg%3E',
  bell:
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%2300d9ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Cpath d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/%3E%3Cpath d="M13.73 21a2 2 0 0 1-3.46 0"/%3E%3C/svg%3E',
};

interface IconProps {
  name: keyof typeof ICONS;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  spin?: boolean;
  sizePx?: number;
}

export const Icon: React.FC<IconProps> = ({ name, alt, size = 'md', className, spin, sizePx }) => {
  const src = ICONS[name] || ICONS.dashboard;
  const sizeMap = { sm: 14, md: 20, lg: 28 } as const;
  const dimension = sizePx || sizeMap[size] || sizeMap.md;

  return (
    <img
      src={src}
      alt={alt}
      className={`favicon-icon ${spin ? 'spin' : ''} ${className || ''}`.trim()}
      style={{ width: dimension, height: dimension }}
      loading="lazy"
    />
  );
};

export default Icon;
