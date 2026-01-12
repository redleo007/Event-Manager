import { ClipboardList, Loader, CheckCheck, Trash2 } from 'lucide-react';
import { formatDate } from '../utils/formatters';

export interface VolunteerWork {
  id: string;
  event_id: string;
  volunteer_id: string;
  task_name: string;
  task_status: 'assigned' | 'in_progress' | 'completed';
  assigned_at: string;
  event_name?: string;
}

export interface VolunteerWorkRowProps {
  work: VolunteerWork;
  onDelete?: (id: string) => void;
  showEventName?: boolean;
}

export function VolunteerWorkRow({ work, onDelete, showEventName = true }: VolunteerWorkRowProps) {
  const getStatusIcon = () => {
    switch (work.task_status) {
      case 'assigned':
        return <ClipboardList size={16} />;
      case 'in_progress':
        return <Loader size={16} className="animate-spin" />;
      case 'completed':
        return <CheckCheck size={16} />;
      default:
        return null;
    }
  };

  const getStatusBadgeClass = () => {
    switch (work.task_status) {
      case 'assigned':
        return 'badge-info';
      case 'in_progress':
        return 'badge-warning';
      case 'completed':
        return 'badge-success';
      default:
        return 'badge';
    }
  };

  return (
    <div className="work-row card" style={{ padding: '12px 16px', marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          {showEventName && (
            <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '4px' }}>
              📅 {work.event_name || 'Unknown Event'}
            </p>
          )}
          <h4 style={{ marginBottom: '4px', fontSize: '0.95rem' }}>
            {work.task_name}
          </h4>
          <p style={{ fontSize: '0.8rem', color: '#999' }}>
            Assigned: {formatDate(work.assigned_at)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className={`badge ${getStatusBadgeClass()}`} style={{ whiteSpace: 'nowrap' }}>
            {getStatusIcon()}
            {work.task_status === 'in_progress' ? 'In Progress' : work.task_status === 'assigned' ? 'Assigned' : 'Completed'}
          </span>
          {onDelete && (
            <button
              className="btn btn-sm btn-danger"
              onClick={() => onDelete(work.id)}
              title="Delete work assignment"
              style={{ padding: '4px 8px' }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
