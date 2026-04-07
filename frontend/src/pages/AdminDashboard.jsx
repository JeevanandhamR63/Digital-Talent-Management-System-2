import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [tasks, setTasks]           = useState([]);
  const [users, setUsers]           = useState([]);
  const [isEditing, setIsEditing]   = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [activeNav, setActiveNav]   = useState('tasks');

  const [formData, setFormData] = useState({
    title: '', description: '', technicalRequirements: '',
    priority: 'Medium', dueDate: '', assignedTo: '', email: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') { navigate('/login'); return; }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const token  = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [tasksRes, usersRes] = await Promise.all([
        axios.get('/api/tasks', config),
        axios.get('/api/auth/users', config)
      ]);
      setTasks(tasksRes.data);
      setUsers(usersRes.data.filter(u => u.email !== 'jeevanandhamj68@gmail.com' && u.role !== 'admin'));
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) navigate('/login');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'assignedTo') {
      const user = users.find(u => u._id === value);
      setFormData({ ...formData, [name]: value, email: user ? user.email : '' });
    } else if (name === 'email') {
      const user = users.find(u => u.email.toLowerCase() === value.toLowerCase());
      setFormData({ ...formData, [name]: value, assignedTo: user ? user._id : '' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token  = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (isEditing) {
        await axios.put(`/api/tasks/${currentTaskId}`, formData, config);
        alert('Task updated successfully');
      } else {
        await axios.post('/api/tasks', formData, config);
        alert('Task created successfully');
      }
      setFormData({ title: '', description: '', technicalRequirements: '', priority: 'Medium', dueDate: '', assignedTo: '', email: '' });
      setIsEditing(false);
      setCurrentTaskId(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving task');
    }
  };

  const handleEdit = (task) => {
    setIsEditing(true);
    setCurrentTaskId(task._id);
    setFormData({
      title: task.title, description: task.description,
      technicalRequirements: task.technicalRequirements || '',
      priority: task.priority,
      dueDate: new Date(task.dueDate).toISOString().split('T')[0],
      assignedTo: task.assignedTo?._id || '',
      email: task.assignedTo?.email || ''
    });
    setActiveNav('tasks');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/tasks/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) { alert('Error deleting task'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getUserAnalytics = (userId) => {
    const ut = tasks.filter(t => t.assignedTo?._id === userId);
    const done = ut.filter(t => t.status === 'Completed');
    return {
      totalTasks: ut.length,
      completedTasks: done.length,
      completionRate: ut.length > 0 ? ((done.length / ut.length) * 100).toFixed(0) : 0
    };
  };

  const user              = JSON.parse(localStorage.getItem('user'));
  const unassignedTasks   = tasks.filter(t => !t.assignedTo || !users.find(u => u._id === t.assignedTo?._id));
  const completedCount    = tasks.filter(t => t.status === 'Completed').length;
  const inProgressCount   = tasks.filter(t => t.status === 'In Progress').length;
  const selectedUser      = users.find(u => u._id === formData.assignedTo);
  const selectedAnalytics = formData.assignedTo ? getUserAnalytics(formData.assignedTo) : null;
  const todayStr          = new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

  const initials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'A';

  return (
    <div className="ad-shell">
      {/* ── Sidebar ── */}
      <aside className="ad-sidebar">

        <nav className="ad-nav">
          <span className="ad-nav-label">Workspace</span>
          <div className={`ad-nav-item ${activeNav === 'tasks' ? 'active' : ''}`} onClick={() => setActiveNav('tasks')}>
            <span className="ad-nav-icon">📋</span> Task Manager
          </div>
          <div className={`ad-nav-item ${activeNav === 'analytics' ? 'active' : ''}`} onClick={() => setActiveNav('analytics')}>
            <span className="ad-nav-icon">📊</span> User Analytics
          </div>
          {unassignedTasks.length > 0 && (
            <div className={`ad-nav-item ${activeNav === 'unassigned' ? 'active' : ''}`} onClick={() => setActiveNav('unassigned')}>
              <span className="ad-nav-icon">⚠️</span> Unassigned ({unassignedTasks.length})
            </div>
          )}
        </nav>

        <div className="ad-sidebar-footer">
          <div className="ad-user-pill">
            <div className="ad-avatar">{initials(user?.name)}</div>
            <div className="ad-user-info">
              <strong>{user?.name}</strong>
              <span>Administrator</span>
            </div>
          </div>
          <button className="ad-logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="ad-main">
        {/* Top Bar */}
        <div className="ad-topbar">
          <h1>
            {activeNav === 'tasks'      && '⚡ Task Manager'}
            {activeNav === 'analytics' && '📊 User Analytics'}
            {activeNav === 'unassigned' && '⚠️ Unassigned Tasks'}
          </h1>
          <div className="ad-topbar-meta">
            <span className="ad-date-chip">📅 {todayStr}</span>
          </div>
        </div>

        <div className="ad-content">
          {/* Stats Row (always visible) */}
          <div className="ad-stats-row">
            <div className="ad-stat-card">
              <div className="ad-stat-icon icon-gold">📋</div>
              <div className="ad-stat-info">
                <strong>{tasks.length}</strong>
                <span>Total Tasks</span>
              </div>
            </div>
            <div className="ad-stat-card">
              <div className="ad-stat-icon icon-green">✅</div>
              <div className="ad-stat-info">
                <strong>{completedCount}</strong>
                <span>Completed</span>
              </div>
            </div>
            <div className="ad-stat-card">
              <div className="ad-stat-icon icon-blue">🔄</div>
              <div className="ad-stat-info">
                <strong>{inProgressCount}</strong>
                <span>In Progress</span>
              </div>
            </div>
            <div className="ad-stat-card">
              <div className="ad-stat-icon icon-red">👥</div>
              <div className="ad-stat-info">
                <strong>{users.length}</strong>
                <span>Team Members</span>
              </div>
            </div>
          </div>

          {/* ── Task Manager View ── */}
          {activeNav === 'tasks' && (
            <div className="ad-work-area">
              {/* Form Column */}
              <div className="ad-form-column">
                <div className="ad-card">
                  <div className="ad-card-header">
                    <h2><span className="card-icon">{isEditing ? '✏️' : '➕'}</span> {isEditing ? 'Edit Task' : 'Create New Task'}</h2>
                  </div>
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <div className="ad-form-scroll">
                      <div className="ad-field">
                        <label className="ad-label">Task Title</label>
                        <input name="title" value={formData.title} onChange={handleInputChange}
                          placeholder="e.g. Design homepage mockup" required className="ad-input" />
                      </div>

                      <div className="ad-field-row">
                        <div className="ad-field">
                          <label className="ad-label">Priority</label>
                          <select name="priority" value={formData.priority} onChange={handleInputChange} className="ad-input">
                            <option value="Low">🟢 Low</option>
                            <option value="Medium">🟡 Medium</option>
                            <option value="High">🔴 High</option>
                          </select>
                        </div>
                        <div className="ad-field">
                          <label className="ad-label">Due Date</label>
                          <input type="date" name="dueDate" value={formData.dueDate} onChange={handleInputChange} required className="ad-input" />
                        </div>
                      </div>

                      <div className="ad-field">
                        <label className="ad-label">Description</label>
                        <textarea name="description" value={formData.description} onChange={handleInputChange}
                          placeholder="Describe the task..." required className="ad-input" rows="3" />
                      </div>

                      <div className="ad-field">
                        <label className="ad-label">Technical Requirements</label>
                        <textarea name="technicalRequirements" value={formData.technicalRequirements}
                          onChange={handleInputChange} placeholder="e.g. React, Figma, REST API..."
                          className="ad-input" rows="2" />
                      </div>

                      <div className="ad-field">
                        <label className="ad-label">Assign To</label>
                        <select name="assignedTo" value={formData.assignedTo} onChange={handleInputChange} required className="ad-input">
                          <option value="" disabled>Select team member</option>
                          {users.map(u => (
                            <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                          ))}
                        </select>
                      </div>

                      <div className="ad-field">
                        <label className="ad-label">Type Email (to find user)</label>
                        <input name="email" value={formData.email} onChange={handleInputChange}
                          placeholder="Type email to auto-select user..." className="ad-input" />
                      </div>

                      {selectedUser && selectedAnalytics && (
                        <div className="ad-inline-analytics">
                          <p>👤 {selectedUser.name}'s Current Performance</p>
                          <div className="ad-inline-stats">
                            <div><small>Tasks</small><strong>{selectedAnalytics.totalTasks}</strong></div>
                            <div><small>Done</small><strong>{selectedAnalytics.completedTasks}</strong></div>
                            <div className="hl"><small>Rate</small><strong>{selectedAnalytics.completionRate}%</strong></div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="ad-btn-row">
                      <button type="submit" className="ad-btn-primary">
                        {isEditing ? '💾 Update Task' : '✨ Create Task'}
                      </button>
                      {isEditing && (
                        <button type="button" className="ad-btn-secondary" onClick={() => {
                          setIsEditing(false); setCurrentTaskId(null);
                          setFormData({ title: '', description: '', technicalRequirements: '', priority: 'Medium', dueDate: '', assignedTo: '', email: '' });
                        }}>Cancel</button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              {/* Task List Column */}
              <div className="ad-list-column">
                <div className="ad-card">
                  <div className="ad-card-header">
                    <h2><span className="card-icon">📋</span> All Tasks</h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--gold-dim)', padding: '0.2rem 0.6rem', borderRadius: '99px', fontWeight: 600 }}>{tasks.length} total</span>
                  </div>
                  <div className="ad-task-scroll">
                    {tasks.length === 0 ? <p className="no-data">No tasks yet.</p> : tasks.map(task => (
                      <div key={task._id} className="ad-task-item">
                        <div className="ad-t-header">
                          <h5 title={task.title}>{task.title}</h5>
                          <div className="ad-badges">
                            <span className={`ad-badge b-${task.priority.toLowerCase()}`}>{task.priority}</span>
                            <span className={`ad-badge s-${(task.status || 'pending').toLowerCase().replace(' ', '-')}`}>{task.status}</span>
                          </div>
                        </div>

                        <div className="ad-t-meta">
                          <span>👤 {task.assignedTo ? task.assignedTo.name : 'Unassigned'}</span>
                          <span>📅 {new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>

                        <div className="ad-t-updates">
                          <h6>Updates Log</h6>
                          {task.updates && task.updates.length > 0 ? (
                            <ul>
                              {task.updates.map((u, i) => (
                                <li key={i}><span>{new Date(u.date).toLocaleDateString()}:</span> {u.stageCompleted}</li>
                              ))}
                            </ul>
                          ) : <span className="no-updates-msg">No updates logged.</span>}
                        </div>

                        <div className="ad-t-actions">
                          <button className="btn-edit" onClick={() => handleEdit(task)}>✏️ Edit</button>
                          <button className="btn-delete" onClick={() => handleDelete(task._id)}>🗑️ Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Analytics View ── */}
          {activeNav === 'analytics' && (
            <div>
              {users.length === 0 ? <p className="no-data">No team members found.</p> : (
                <div className="ad-analytics-grid">
                  {users.map(u => {
                    const a = getUserAnalytics(u._id);
                    return (
                      <div key={u._id} className="ad-user-card">
                        <div className="ad-user-card-header">
                          <div className="ad-u-avatar">{initials(u.name)}</div>
                          <div>
                            <div className="ad-u-name">{u.name}</div>
                            <div className="ad-u-email">{u.email}</div>
                          </div>
                        </div>
                        <div className="ad-u-stats">
                          <div className="ad-u-stat"><strong>{a.totalTasks}</strong><small>Tasks</small></div>
                          <div className="ad-u-stat"><strong>{a.completedTasks}</strong><small>Done</small></div>
                          <div className="ad-u-stat hl"><strong>{a.completionRate}%</strong><small>Rate</small></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Unassigned View ── */}
          {activeNav === 'unassigned' && (
            <div className="ad-card">
              <div className="ad-card-header">
                <h2><span className="card-icon">⚠️</span> Unassigned / Orphaned Tasks</h2>
              </div>
              <div className="ad-unassigned">
                {unassignedTasks.length === 0 ? <p className="no-data">All tasks are assigned.</p> : unassignedTasks.map(task => (
                  <div key={task._id} className="unassigned-item">
                    <h5>{task.title}</h5>
                    <div className="ad-badges">
                      <span className={`ad-badge b-${task.priority.toLowerCase()}`}>{task.priority}</span>
                    </div>
                    <div className="ad-t-actions" style={{ width: 'auto', flexShrink: 0 }}>
                      <button className="btn-edit" onClick={() => { handleEdit(task); setActiveNav('tasks'); }}>✏️ Edit</button>
                      <button className="btn-delete" onClick={() => handleDelete(task._id)}>🗑️ Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
