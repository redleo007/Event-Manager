# Visual Guide - CSS & UI Changes

## 🎨 Dark Theme Integration

### Color Palette Used

```
Primary Colors:
├── Background: #050811 - #0f0f1e (dark navy)
├── Text Primary: #e0e0e0 (light gray)
├── Text Secondary: #a0a0a0 (medium gray)
├── Border: #333333 (dark gray)
└── Card Background: rgba(20, 20, 40, 0.8)

Accent Colors:
├── Cyan (Primary Accent): #00D9FF
├── Lime (Success): #00FF41
├── Purple (Info): #9966FF
├── Yellow (Warning): #FFc629
└── Red (Danger): #dc3545
```

### CSS Variables Integrated

```css
var(--neon-cyan)        /* Cyan accent */
var(--neon-lime)        /* Green success */
var(--text-primary)     /* Main text */
var(--text-secondary)   /* Muted text */
var(--border-color)     /* Table borders */
var(--input-bg)         /* Dropdown background */
var(--card-bg)          /* Card backgrounds */
```

---

## 📱 UI Components

### 1. Event Selector

#### Code
```tsx
<div className="event-selector">
  <label>Select Event:</label>
  <select value={selectedHistoryEvent} onChange={...}>
    <option value="">-- Choose an event --</option>
    {events?.map(event => <option>{event.name}</option>)}
  </select>
</div>
```

#### CSS
```css
.event-selector {
  display: flex;
  gap: 12px;
  align-items: center;
}

.event-selector select {
  background: var(--input-bg);           /* Dark background */
  border: 1px solid var(--border-color);
  color: var(--text-primary);            /* Light text */
  padding: 10px 12px;
  transition: 0.3s ease;
}

.event-selector select:focus {
  border-color: var(--neon-cyan);        /* Cyan on focus */
  box-shadow: 0 0 15px rgba(0, 217, 255, 0.2);
}
```

#### Visual Result
```
┌─────────────────────────────────┐
│ Select Event: [Dropdown      ▼] │  ← Dark background, cyan border on focus
└─────────────────────────────────┘
```

---

### 2. History Table

#### Code
```tsx
<div className="history-table-wrapper">
  <table className="history-table">
    <thead>
      <tr>
        <th>Type</th>
        <th>Date & Time</th>
        <th>Records</th>
        <th>Status</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody>
      {importSessions.map(session => (
        <tr className={session.status === 'reverted' ? 'reverted' : ''}>
          <td><span className="history-type-badge history-type-participants">Participants</span></td>
          <td>{formatDate(session.uploaded_at)}</td>
          <td>{session.record_count} records</td>
          <td><span className="history-status-badge history-status-active">Active</span></td>
          <td><button className="history-delete-btn">Delete</button></td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

#### CSS
```css
.history-table-wrapper {
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.history-table thead {
  background: rgba(0, 217, 255, 0.1);   /* Cyan tinted header */
  border-bottom: 2px solid var(--neon-cyan);
}

.history-table th {
  color: var(--neon-cyan);              /* Cyan text */
  padding: 14px 16px;
  font-weight: 700;
}

.history-table tbody tr:hover {
  background: rgba(0, 217, 255, 0.05);  /* Subtle hover effect */
}

.history-table tbody tr.reverted {
  background: rgba(255, 193, 7, 0.08);  /* Yellow tint for reverted */
}

.history-type-badge {
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 700;
}

.history-type-participants {
  background: rgba(0, 150, 255, 0.25);
  color: #0096ff;
  border: 1px solid rgba(0, 150, 255, 0.5);
}

.history-type-attendance {
  background: rgba(153, 102, 255, 0.25);
  color: #9966ff;
  border: 1px solid rgba(153, 102, 255, 0.5);
}

.history-status-badge {
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 700;
}

.history-status-active {
  background: rgba(0, 255, 65, 0.25);   /* Green tint */
  color: var(--neon-lime);
  border: 1px solid var(--neon-lime);
}

.history-status-reverted {
  background: rgba(255, 85, 85, 0.25);  /* Red tint */
  color: #ff5555;
  border: 1px solid #ff5555;
}

.history-delete-btn {
  padding: 8px 14px;
  background: #dc3545;                  /* Red for danger */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: 0.3s ease;
}

.history-delete-btn:hover:not(:disabled) {
  background: #c82333;                  /* Darker red on hover */
  box-shadow: 0 0 15px rgba(220, 53, 69, 0.3);
}

.history-delete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

#### Visual Result
```
┌────────────┬──────────────┬─────────┬────────┬────────┐
│ Type       │ Date & Time  │ Records │ Status │ Action │
├────────────┼──────────────┼─────────┼────────┼────────┤
│ [Attend]   │ Jan 6, 10:30 │ 45      │ [Act]  │[Delete]│  ← Blue type, green status
│ [Partic]   │ Jan 5, 3:15  │ 12      │ [Act]  │[Delete]│
│ [Attend]   │ Jan 3, 9:00  │ 38      │ [Rev]  │Reverted│  ← Purple type, red status
└────────────┴──────────────┴─────────┴────────┴────────┘
```

---

### 3. Confirmation Modal

#### Code
```tsx
{deleteConfirmation.isOpen && (
  <div className="modal-overlay">
    <div className="modal-content">
      <div className="modal-header">
        <h3>Delete Import?</h3>
      </div>
      
      <div className="modal-warning">
        <strong>⚠️ Warning:</strong>
        This will permanently undo the selected import...
      </div>

      <div className="modal-details">
        <p><strong>Type:</strong> {deleteConfirmation.importType}</p>
        <p><strong>Records:</strong> {deleteConfirmation.recordCount}</p>
      </div>

      <div className="modal-actions">
        <button className="modal-btn modal-btn-cancel">Cancel</button>
        <button className="modal-btn modal-btn-delete">Delete Import</button>
      </div>
    </div>
  </div>
)}
```

#### CSS
```css
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.7);      /* Dark overlay */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--card-bg);           /* Dark card background */
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s ease;
}

.modal-header h3 {
  color: var(--text-primary);           /* Light text */
  margin: 0 0 15px 0;
}

.modal-warning {
  background: rgba(255, 193, 7, 0.15); /* Yellow warning */
  border: 1px solid rgba(255, 193, 7, 0.5);
  border-radius: 6px;
  padding: 12px 14px;
  margin-bottom: 20px;
  color: #ffc107;                       /* Yellow text */
  font-size: 0.9rem;
  line-height: 1.5;
}

.modal-warning strong {
  display: block;
  margin-bottom: 4px;
  font-weight: 700;
}

.modal-details {
  background: rgba(0, 217, 255, 0.08); /* Cyan tint */
  border: 1px solid var(--border-color);
  padding: 12px 14px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.modal-details p {
  margin: 6px 0;
  color: var(--text-primary);
}

.modal-details strong {
  color: var(--neon-cyan);
  font-weight: 700;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-btn {
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: 0.3s ease;
}

.modal-btn-cancel {
  background: var(--input-bg);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.modal-btn-cancel:hover:not(:disabled) {
  background: rgba(0, 217, 255, 0.1);
  border-color: var(--neon-cyan);
  color: var(--neon-cyan);
}

.modal-btn-delete {
  background: #dc3545;
  color: white;
  border: 1px solid #dc3545;
}

.modal-btn-delete:hover:not(:disabled) {
  background: #c82333;
  border-color: #c82333;
  box-shadow: 0 0 15px rgba(220, 53, 69, 0.3);
}

.modal-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### Visual Result
```
╔═══════════════════════════════════════════╗
║                                           ║  ← Dark background overlay
║  ┌──────────────────────────────────────┐ ║
║  │ Delete Import?                       │ ║
║  ├──────────────────────────────────────┤ ║
║  │ ⚠️ WARNING:                          │ ║  ← Yellow warning box
║  │ This will permanently undo the       │ ║
║  │ selected import...                   │ ║
║  ├──────────────────────────────────────┤ ║
║  │ Type: Attendance                     │ ║  ← Cyan tinted details
║  │ Records: 45                          │ ║
║  ├──────────────────────────────────────┤ ║
║  │         [Cancel]    [Delete Import]  │ ║  ← Gray and red buttons
║  └──────────────────────────────────────┘ ║
║                                           ║
╚═══════════════════════════════════════════╝
```

---

## 🎬 Animations

### Modal Appearance
```css
.modal-overlay {
  animation: fadeIn 0.2s ease;  /* Fade background */
}

.modal-content {
  animation: slideUp 0.3s ease; /* Slide up dialog */
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Hover Effects
```css
.event-selector select:focus {
  transition: all 0.3s ease;
  border-color: var(--neon-cyan);
  box-shadow: 0 0 15px rgba(0, 217, 255, 0.2);
}

.history-delete-btn:hover {
  transition: all 0.3s ease;
  background: #c82333;
  box-shadow: 0 0 15px rgba(220, 53, 69, 0.3);
}

.history-table tbody tr:hover {
  background: rgba(0, 217, 255, 0.05);
}
```

---

## 🌐 Responsive Design

### Desktop (1200px+)
```
Full table with all columns visible
Buttons at normal size
Modal centered on screen
```

### Tablet (768px - 1200px)
```
Table with horizontal scroll if needed
Buttons slightly smaller
Modal 90% width
```

### Mobile (< 768px)
```
table-wrapper with overflow-x: auto
Buttons stack vertically
Modal full-width with padding
```

#### CSS Media Query
```css
@media (max-width: 768px) {
  .tabs {
    flex-wrap: wrap;
  }

  .tab-button {
    padding: 10px 12px;
    font-size: 0.875rem;
  }

  .history-table {
    font-size: 0.85rem;
  }

  .history-table-wrapper {
    margin-bottom: 20px;
  }

  .modal-content {
    width: 95%;
  }

  .modal-btn {
    padding: 8px 16px;
    font-size: 0.85rem;
  }
}
```

---

## 📊 Color Usage Summary

| Element | Color | Usage |
|---------|-------|-------|
| Header | Cyan (#00D9FF) | Section headers, table headers |
| Active Status | Lime (#00FF41) | "Active" import status badge |
| Reverted Status | Red (#ff5555) | "Reverted" import status badge |
| Participants Type | Blue (#0096ff) | Type badge for participant imports |
| Attendance Type | Purple (#9966ff) | Type badge for attendance imports |
| Warning | Yellow (#ffc107) | Confirmation modal warning box |
| Danger Button | Red (#dc3545) | Delete buttons |
| Hover Effects | Cyan Glow | All interactive elements |
| Borders | Dark Gray | Table borders, input borders |
| Background | Navy (#050811) | Main backgrounds |
| Text | Light Gray (#e0e0e0) | All text content |

---

## ✨ Visual Consistency

### All Elements Use Same Pattern
1. **Dark backgrounds** - Navy (#050811-#0f1f1e)
2. **Light text** - Gray (#e0e0e0)
3. **Cyan accents** - Primary interaction color (#00D9FF)
4. **Color badges** - Context-specific colors
5. **Smooth transitions** - 0.3s ease on all interactions
6. **Shadow effects** - Subtle glow on focus/hover

### Integration with Existing App
- Matches sidebar colors
- Consistent button styling
- Same typography scale
- Unified border colors
- Seamless theme application

---

## 🔍 Browser DevTools Inspection

To inspect the styles in your browser:

1. Press `F12` to open DevTools
2. Click Elements/Inspector tab
3. Click the selector icon (top-left)
4. Hover over any element
5. See all CSS classes applied
6. Check Styles panel for CSS properties
7. Verify colors match dark theme

Example:
```
<div className="modal-content">
  Computed Styles:
  - background-color: rgba(20, 20, 40, 0.8)
  - border: 1px solid #333333
  - border-radius: 8px
  - box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5)
```

---

**All visual updates complete and integrated!** ✨
