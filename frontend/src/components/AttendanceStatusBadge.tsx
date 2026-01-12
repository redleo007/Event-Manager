import { CheckCircle, AlertCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

export interface AttendanceStatusProps {
  status: 'attended' | 'no_show' | 'not_attended' | 'pending' | 'not_recorded';
  size?: 'sm' | 'md' | 'lg';
}

export function AttendanceStatusBadge({ status, size = 'md' }: AttendanceStatusProps) {
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
  
  switch (status) {
    case 'attended':
      return (
        <span className="badge badge-success">
          <CheckCircle size={iconSize} />
          Attended
        </span>
      );
    case 'no_show':
      return (
        <span className="badge badge-danger">
          <XCircle size={iconSize} />
          No Show
        </span>
      );
    case 'not_attended':
      return (
        <span className="badge badge-warning">
          <AlertTriangle size={iconSize} />
          Not Attended
        </span>
      );
    case 'not_recorded':
      return (
        <span className="badge badge-secondary">
          <Clock size={iconSize} />
          Not Recorded
        </span>
      );
    case 'pending':
      return (
        <span className="badge badge-info">
          <AlertCircle size={iconSize} />
          Pending
        </span>
      );
    default:
      return (
        <span className="badge">
          <AlertCircle size={iconSize} />
          Unknown
        </span>
      );
  }
}
