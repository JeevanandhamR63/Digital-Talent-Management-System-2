import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './UserDashboard.css';

/* ── Task Card Component ── */
const TaskItem = ({ task, onTaskUpdated }) => {
  const [status,        setStatus]        = useState(task.status || 'Pending');
  const [completedDate, setCompletedDate] = useState(
    task.completedDate
      ? new Date(task.completedDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [isUpdating,    setIsUpdating]    = useState(false);
  const [updateDate,    setUpdateDate]    = useState(new Date().toISOString().split('T')[0]);
  const [stageCompleted, setStageCompleted] = useState('');
  const [isAddingUpdate, setIsAddingUpdate] = useState(false);

  const handleAddUpdate = async () => {
    if (!stageCompleted.trim()) return;
    setIsAddingUpdate(true);
    try {
      const token  = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`/api/tasks/${task._id}/updates`, { date: updateDate, stageCompleted }, config);
      setStageCompleted('');
      setUpdateDate(new Date().toISOString().split('T')[0]);
      onTaskUpdated();
    } catch (err) {
      console.error(err);
      alert('Failed to add update.');
    } finally { setIsAddingUpdate(false); }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const token   = localStorage.getItem('token');
      const config  = { headers: { Authorization: `Bearer ${token}` } };
      const payload = { status };
      if (status === 'Completed') payload.completedDate = completedDate;
      await axios.patch(`/api/tasks/${task._id}/status`, payload, config);
      onTaskUpdated();
    } catch (err) {
      console.error(err);
      alert('Failed to update task.');
    } finally { setIsUpdating(false); }
  };

  const hasChanges = status !== (task.status || 'Pending') ||
    (status === 'Completed' && completedDate !== (task.completedDate
      ? new Date(task.completedDate).toISOString().split('T')[0] : ''));

  const prioClass   = `prio-${task.priority.toLowerCase()}`;
  const statusClass = `st-${(task.status || 'pending').toLowerCase().replace(' ', '-')}`;
  const statusDot   = { 'Pending': '⏳', 'In Progress': '🔄', 'Completed': '✅' }[task.status] || '⏳';

  return (
    <div className="ud-task-card">
      {/* Header */}
      <div className="ud-tc-header">
        <h3>{task.title}</h3>
        <span className={`ud-prio-badge ${prioClass}`}>{task.priority}</span>
      </div>

      {/* Meta info grid */}
      <div className="ud-tc-meta">
        <div className="ud-tc-meta-row">
          <span className="ud-meta-label">Status</span>
          <span className={`ud-status-badge ${statusClass}`}>{statusDot} {task.status || 'Pending'}</span>
        </div>
        <div className="ud-tc-meta-row">
          <span className="ud-meta-label">Due Date</span>
          <span className="ud-meta-value">📅 {new Date(task.dueDate).toLocaleDateString()}</span>
        </div>
        <div className="ud-tc-meta-row ud-meta-full">
          <span className="ud-meta-label">Description</span>
          <span className="ud-meta-value">{task.description}</span>
        </div>
        {task.technicalRequirements && (
          <div className="ud-tc-meta-row ud-meta-full">
            <span className="ud-meta-label">Requirements</span>
            <span className="ud-meta-value">{task.technicalRequirements}</span>
          </div>
        )}
        <div className="ud-tc-meta-row">
          <span className="ud-meta-label">Assigned By</span>
          <span className="ud-meta-value">{task.createdBy?.name || 'Admin'}</span>
        </div>
        {task.status === 'Completed' && task.completedDate && (
          <div className="ud-tc-meta-row">
            <span className="ud-meta-label">Completed On</span>
            <span className="ud-meta-value">✅ {new Date(task.completedDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <div className="ud-divider" />

      {/* Updates log */}
      <div className="ud-updates-block">
        <span className="ud-updates-title">📝 Progress Log</span>
        {task.updates && task.updates.length > 0 ? (
          <ul className="ud-updates-list">
            {task.updates.map((u, i) => (
              <li key={i} className="ud-update-item">
                <span className="ud-upd-date">{new Date(u.date).toLocaleDateString()}</span>
                <span>{u.stageCompleted}</span>
              </li>
            ))}
          </ul>
        ) : <span className="ud-no-updates">No progress logged yet.</span>}

        {/* Add update form */}
        <div className="ud-add-update">
          <input type="date" value={updateDate} onChange={e => setUpdateDate(e.target.value)} />
          <input
            type="text"
            placeholder="What did you complete?"
            value={stageCompleted}
            onChange={e => setStageCompleted(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddUpdate()}
          />
          <button
            className="ud-upd-btn"
            onClick={handleAddUpdate}
            disabled={isAddingUpdate || !stageCompleted.trim()}
          >
            {isAddingUpdate ? 'Adding…' : '+ Log'}
          </button>
        </div>
      </div>

      <div className="ud-divider" />

      {/* Status update */}
      <div className="ud-status-ctrl">
        <label>Update Task Status</label>
        <div className="ud-status-row">
          <select className="ud-status-select" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="Pending">⏳ Pending</option>
            <option value="In Progress">🔄 In Progress</option>
            <option value="Completed">✅ Completed</option>
          </select>
          {status === 'Completed' && (
            <input
              type="date"
              className="ud-date-input"
              value={completedDate}
              onChange={e => setCompletedDate(e.target.value)}
            />
          )}
          <button className="ud-save-btn" onClick={handleUpdate} disabled={isUpdating || !hasChanges}>
            {isUpdating ? 'Saving…' : '💾 Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main UserDashboard ── */
const UserDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const navigate          = useNavigate();
  const user              = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchTasks();
  }, [navigate]);

  const fetchTasks = async () => {
    try {
      const token  = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res    = await axios.get('/api/tasks', config);
      setTasks(res.data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) navigate('/login');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const initials     = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
  const completed    = tasks.filter(t => t.status === 'Completed').length;
  const inProgress   = tasks.filter(t => t.status === 'In Progress').length;
  const todayStr     = new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="ud-shell">
      {/* ── Sidebar ── */}
      <aside className="ud-sidebar">

        <nav className="ud-nav">
          <span className="ud-nav-label">Navigation</span>
          <div className="ud-nav-item active">
            <span>📋</span> My Tasks
            {tasks.length > 0 && <span className="ud-nav-badge">{tasks.length}</span>}
          </div>
          <div className="ud-nav-item">
            <span>✅</span> Completed
            {completed > 0 && <span className="ud-nav-badge">{completed}</span>}
          </div>
          <div className="ud-nav-item">
            <span>🔄</span> In Progress
            {inProgress > 0 && <span className="ud-nav-badge">{inProgress}</span>}
          </div>
        </nav>

        <div className="ud-sidebar-footer">
          <div className="ud-user-pill">
            <div className="ud-avatar">{initials(user?.name)}</div>
            <div className="ud-user-info">
              <strong>{user?.name}</strong>
              <span>Team Member</span>
            </div>
          </div>
          <button className="ud-logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="ud-main">
        {/* Top Bar */}
        <div className="ud-topbar">
          <h1>📋 My Assigned Tasks</h1>
          <span className="ud-date-chip">📅 {todayStr}</span>
        </div>

        <div className="ud-content">
          {/* Summary strip */}
          <div className="ud-summary-strip">
            <div className="ud-sum-card">
              <div className="ud-sum-icon si-gold">📋</div>
              <div className="ud-sum-info">
                <strong>{tasks.length}</strong>
                <span>Total Tasks</span>
              </div>
            </div>
            <div className="ud-sum-card">
              <div className="ud-sum-icon si-green">✅</div>
              <div className="ud-sum-info">
                <strong>{completed}</strong>
                <span>Completed</span>
              </div>
            </div>
            <div className="ud-sum-card">
              <div className="ud-sum-icon si-blue">🔄</div>
              <div className="ud-sum-info">
                <strong>{inProgress}</strong>
                <span>In Progress</span>
              </div>
            </div>
          </div>

          {/* Section heading */}
          <div className="ud-section-title">All Tasks</div>

          {/* Task list */}
          {tasks.length === 0 ? (
            <div className="ud-no-tasks">
              <div className="ud-nt-icon">🌿</div>
              <p>You have no assigned tasks. Enjoy your day!</p>
            </div>
          ) : (
            <div className="ud-task-grid">
              {tasks.map(task => (
                <TaskItem key={task._id} task={task} onTaskUpdated={fetchTasks} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
