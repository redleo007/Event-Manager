import Icon from './Icon';

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
          <Icon name="success" alt="Attended" sizePx={iconSize} />
          Attended
        </span>
      );
    case 'no_show':
      return (
        <span className="badge badge-danger">
          <Icon name="error" alt="No show" sizePx={iconSize} />
          No Show
        </span>
      );
    case 'not_attended':
      return (
        <span className="badge badge-warning">
          <Icon name="warning" alt="Not attended" sizePx={iconSize} />
          Not Attended
        </span>
      );
    case 'not_recorded':
      return (
        <span className="badge badge-secondary">
          <Icon name="clock" alt="Not recorded" sizePx={iconSize} />
          Not Recorded
        </span>
      );
    case 'pending':
      return (
        <span className="badge badge-info">
          <Icon name="info" alt="Pending" sizePx={iconSize} />
          Pending
        </span>
      );
    default:
      return (
        <span className="badge">
          <Icon name="info" alt="Unknown" sizePx={iconSize} />
          Unknown
        </span>
      );
  }
}
