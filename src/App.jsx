
import { useCallback, useEffect, useState } from 'react';
import './App.css';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://smart-complaint-managment-system-backend.onrender.com')
  .replace(/\/+$/, '');
const API = `${API_BASE_URL}/api`;

async function request(url, options = {}) {
  const headers = new Headers(options.headers);
  const token = localStorage.getItem('scmsToken');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API}${url}`, {
    ...options,
    cache: 'no-store',
    headers
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Request failed.');
  }

  return data;
}

function StatCard({ icon, label, value, description, color }) {
  return (
    <article className={`stat-card ${color}`}>
      <div className="stat-top">
        <div className="stat-icon">{icon}</div>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-number">{value}</div>
      <p>{description}</p>
      <div className="stat-line" />
    </article>
  );
}

function ComplaintCards({
  complaints,
  admin = false,
  onChangeComplaint,
  onUpdateComplaint,
  loading
}) {
  return (
    <div className="complaint-list">
      {complaints.map(complaint => (
        <article className="complaint-card" key={complaint.id}>
          <div className="complaint-card-heading">
            <div>
              <span className="complaint-id">COMPLAINT #{complaint.id}</span>
              <h3>{complaint.title}</h3>
            </div>
            <span className={`status-badge ${(complaint.status || 'PENDING').toLowerCase()}`}>
              {(complaint.status || 'PENDING').replace('_', ' ')}
            </span>
          </div>

          <p>{complaint.description}</p>

          <div className="complaint-details">
            <span><strong>Category:</strong> {complaint.category}</span>
            {admin && <span><strong>User ID:</strong> {complaint.user_id}</span>}
          </div>

          {admin ? (
            <>
              <label>Status</label>
              <select
                value={complaint.status || 'PENDING'}
                onChange={e => onChangeComplaint(complaint.id, 'status', e.target.value)}
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>

              <label>Administrator Remark</label>
              <textarea
                rows="3"
                value={complaint.admin_remark || ''}
                onChange={e => onChangeComplaint(complaint.id, 'admin_remark', e.target.value)}
                placeholder="Write an update for the user..."
              />

              <button
                className="primary-button"
                onClick={() => onUpdateComplaint(complaint)}
                disabled={loading}
              >
                Save Changes
              </button>
            </>
          ) : (
            <div className="admin-remark">
              <strong>Administrator Remark</strong>
              <p>{complaint.admin_remark || 'No remarks yet.'}</p>
            </div>
          )}
        </article>
      ))}

      {complaints.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No complaints found</h3>
          <p>Try refreshing or changing your search.</p>
        </div>
      )}
    </div>
  );
}

function App() {
  const [page, setPage] = useState('home');
  const [loggedInUser, setLoggedInUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('loggedInUser') || 'null');
    } catch {
      return null;
    }
  });

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Water');
  const [complaints, setComplaints] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const isAdmin = String(loggedInUser?.role || '').toUpperCase() === 'ADMIN';

  const totalComplaints = complaints.length;
  const pendingComplaints = complaints.filter(c => c.status === 'PENDING').length;
  const inProgressComplaints = complaints.filter(c => c.status === 'IN_PROGRESS').length;
  const resolvedComplaints = complaints.filter(c => c.status === 'RESOLVED').length;

  const filteredComplaints = complaints.filter(c =>
    `${c.id} ${c.title} ${c.category} ${c.status} ${c.user_id}`
      .toLowerCase().includes(search.toLowerCase())
  );

  async function register() {
    setMessage('');

    try {
      setLoading(true);

      await request('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password
        })
      });

      setMessage('Registration successful! Please log in.');
      setPassword('');
      setPage('login');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function login() {
    setMessage('');

    try {
      setLoading(true);

      const data = await request('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const user = data.user || data;

      if (!data.token || !user.id || !user.role) {
        throw new Error('Login response is missing the authentication token or user details.');
      }

      localStorage.setItem('scmsToken', data.token);
      setLoggedInUser(user);
      localStorage.setItem('loggedInUser', JSON.stringify(user));
      setPassword('');

      if (String(user.role).toUpperCase() === 'ADMIN') {
        setPage('admin');
        await loadAdminComplaints(user.id);
      } else {
        setPage('dashboard');
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('scmsToken');
    localStorage.removeItem('loggedInUser');
    setLoggedInUser(null);
    setComplaints([]);
    setPage('home');
    setMessage('');
    setEmail('');
    setPassword('');
  }

  const userId = loggedInUser?.id;
  const loadUserComplaints = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setMessage('');

      const data = await request(`/complaints?userId=${encodeURIComponent(userId)}`);
      setComplaints(Array.isArray(data) ? data : data.complaints || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (page !== 'track' || !userId || isAdmin) return undefined;

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        loadUserComplaints();
      }
    };

    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => document.removeEventListener('visibilitychange', refreshWhenVisible);
  }, [isAdmin, loadUserComplaints, page, userId]);

  async function loadAdminComplaints(adminId = loggedInUser?.id) {
    if (!adminId) return;

    try {
      setLoading(true);
      setMessage('');

      const data = await request(`/admin/complaints?adminId=${adminId}`);
      setComplaints(Array.isArray(data) ? data : data.complaints || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitComplaint() {
    if (!loggedInUser) {
      setPage('login');
      setMessage('Please log in first.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      await request('/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: loggedInUser.id,
          title,
          description,
          category
        })
      });

      setTitle('');
      setDescription('');
      setCategory('Water');
      setMessage('Complaint submitted successfully!');

      if (isAdmin) {
        setPage('admin');
        await loadAdminComplaints();
      } else {
        setPage('track');
        await loadUserComplaints();
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateComplaint(complaint) {
    try {
      setLoading(true);
      setMessage('');

      await request(`/admin/complaints/${complaint.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: loggedInUser.id,
          status: complaint.status,
          admin_remark: complaint.admin_remark || ''
        })
      });

      setMessage('Complaint updated successfully!');
      await loadAdminComplaints();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function changeComplaint(id, field, value) {
    setComplaints(current =>
      current.map(c => c.id === id ? { ...c, [field]: value } : c)
    );
  }

  function navigate(destination) {
    setPage(destination);
    setMessage('');

    if (destination === 'admin' && isAdmin) {
      loadAdminComplaints();
    } else if (destination === 'track' && loggedInUser) {
      if (isAdmin) {
        loadAdminComplaints();
      } else {
        loadUserComplaints();
      }
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-shield">✓</div>
          <div>
            <h2>Smart Complaints</h2>
            <span>Management System</span>
          </div>
        </div>

        <div className="sidebar-section">
          <span className="sidebar-heading">MAIN MENU</span>

          <button className={`side-link ${['home', 'dashboard', 'admin'].includes(page) ? 'active' : ''}`}
            onClick={() => navigate(isAdmin ? 'admin' : loggedInUser ? 'dashboard' : 'home')}>
            <span>▦</span> Dashboard
          </button>

          <button className="side-link" onClick={() => navigate(loggedInUser ? 'submit' : 'login')}>
            <span>⊕</span> Submit Complaint
          </button>

          <button className="side-link" onClick={() => navigate(loggedInUser ? 'track' : 'login')}>
            <span>⌕</span> Track Complaints
          </button>

          <button className="side-link" onClick={() => navigate('about')}>
            <span>♙</span> About the System
          </button>
        </div>

        {isAdmin && (
          <div className="sidebar-section">
            <span className="sidebar-heading">ADMIN PANEL</span>
            <button className={`side-link ${page === 'admin' ? 'active' : ''}`} onClick={() => navigate('admin')}>
              <span>▤</span> All Complaints
            </button>
            <button className="side-link" onClick={() => navigate('admin')}>
              <span>▥</span> Statistics
            </button>
          </div>
        )}

        <div className="sidebar-help">
          <div className="help-icon">✦</div>
          <h3>Better Services<br />for a Better Tomorrow</h3>
          <p>Your feedback helps us improve our community.</p>
          <div className="help-line" />
        </div>

        <div className="sidebar-footer">
          <span className="online-dot" />
          {loggedInUser ? 'Account signed in' : 'Welcome, Guest'}
        </div>
      </aside>

      <div className="main-panel">
        <header className="topbar">
          <div className="topbar-title">
            <span className="topbar-mark">◆</span> Smart Complaint Portal
          </div>

          <div className="topbar-right">
            {loggedInUser ? (
              <>
                <div className="profile-avatar">
                  {(loggedInUser.full_name || loggedInUser.fullName || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="profile-text">
                  <strong>{loggedInUser.full_name || loggedInUser.fullName || 'User'}</strong>
                  <span>{isAdmin ? 'Administrator' : 'Registered User'}</span>
                </div>
                <button className="logout-button" onClick={logout}>Logout ↗</button>
              </>
            ) : (
              <>
                <button className="topbar-login" onClick={() => navigate('login')}>Login</button>
                <button className="primary-button" onClick={() => navigate('register')}>Get Started</button>
              </>
            )}
          </div>
        </header>

        <main className="workspace">
          {message && (
            <div className="message" role="status">
              <span>{message}</span>
              <button onClick={() => setMessage('')} aria-label="Close message">×</button>
            </div>
          )}

          {page === 'home' && (
            <>
              <section className="welcome-banner">
                <div>
                  <span className="banner-eyebrow">WELCOME TO YOUR COMPLAINT PORTAL</span>
                  <h1>Every concern matters.</h1>
                  <p>Raise concerns, track progress, and help us make our community better.</p>
                  <div className="banner-actions">
                    <button className="banner-button" onClick={() => navigate(loggedInUser ? 'submit' : 'login')}>+ Submit a Complaint</button>
                    <button className="banner-outline" onClick={() => navigate(loggedInUser ? 'track' : 'login')}>Track a Complaint →</button>
                  </div>
                </div>
                <div className="banner-art" aria-hidden="true">
                  <div className="art-circle"><div className="art-document">✓</div></div>
                  <div className="art-small-circle">✦</div>
                </div>
              </section>

              <section className="section-block">
                <div className="section-title">
                  <div>
                    <h2>How can we help you?</h2>
                    <p>Everything you need to report and manage a concern.</p>
                  </div>
                </div>

                <div className="feature-grid">
                  <article className="feature-card">
                    <div className="feature-icon">＋</div>
                    <h3>Submit a Complaint</h3>
                    <p>Report a problem with clear details so it can be reviewed.</p>
                    <button className="card-link" onClick={() => navigate(loggedInUser ? 'submit' : 'login')}>Submit now →</button>
                  </article>

                  <article className="feature-card">
                    <div className="feature-icon blue">⌕</div>
                    <h3>Track Progress</h3>
                    <p>Follow complaint status and read administrator updates.</p>
                    <button className="card-link" onClick={() => navigate(loggedInUser ? 'track' : 'login')}>Track now →</button>
                  </article>

                  <article className="feature-card">
                    <div className="feature-icon green">✓</div>
                    <h3>Clear Updates</h3>
                    <p>Stay informed as your complaint moves toward resolution.</p>
                    <button className="card-link" onClick={() => navigate('about')}>Learn more →</button>
                  </article>
                </div>
              </section>
            </>
          )}

          {page === 'login' && (
            <section className="form-card">
              <div className="form-symbol">↗</div>
              <h1>Welcome back</h1>
              <p>Log in to manage your complaints and view updates.</p>

              <form onSubmit={e => { e.preventDefault(); login(); }}>
                <label>Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />

                <label>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />

                <button className="primary-button full-button" type="submit" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login to your account →'}
                </button>
              </form>

              <p className="form-bottom">Don't have an account? <button type="button" className="text-button" onClick={() => navigate('register')}>Register</button></p>
            </section>
          )}

          {page === 'register' && (
            <section className="form-card">
              <div className="form-symbol">＋</div>
              <h1>Create your account</h1>
              <p>Register to submit complaints and track their progress.</p>

              <form onSubmit={e => { e.preventDefault(); register(); }}>
                <label>Full name</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter your full name" required />

                <label>Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />

                <label>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a password" required />

                <button className="primary-button full-button" type="submit" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account →'}
                </button>
              </form>

              <p className="form-bottom">Already registered? <button type="button" className="text-button" onClick={() => navigate('login')}>Login</button></p>
            </section>
          )}

          {page === 'dashboard' && loggedInUser && !isAdmin && (
            <>
              <section className="page-heading">
                <span className="banner-eyebrow">USER WORKSPACE</span>
                <h1>Welcome back, {loggedInUser.full_name || loggedInUser.fullName || 'User'}!</h1>
                <p>Submit a new concern or follow up on your existing complaints.</p>
              </section>

              <div className="feature-grid">
                <article className="feature-card">
                  <div className="feature-icon">＋</div>
                  <h3>Submit a Complaint</h3>
                  <p>Tell us about an issue that needs attention.</p>
                  <button className="primary-button" onClick={() => navigate('submit')}>Start a Complaint</button>
                </article>

                <article className="feature-card">
                  <div className="feature-icon blue">⌕</div>
                  <h3>Track Complaints</h3>
                  <p>Check current statuses and administrator remarks.</p>
                  <button className="primary-button" onClick={() => navigate('track')}>View My Complaints</button>
                </article>
              </div>
            </>
          )}

          {page === 'submit' && loggedInUser && (
            <section className="form-card wide-form">
              <span className="banner-eyebrow">COMPLAINT FORM</span>
              <h1>Submit a Complaint</h1>
              <p>Give us the details so the right team can review your concern.</p>

              <form onSubmit={e => { e.preventDefault(); submitComplaint(); }}>
                <label>Complaint title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Water leakage in hostel" required />

                <label>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="Water">Water</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Hostel">Hostel</option>
                  <option value="Cleanliness">Cleanliness</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Other">Other</option>
                </select>

                <label>Description</label>
                <textarea rows="5" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the problem and where it occurred..." required />

                <button className="primary-button full-button" type="submit" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Complaint →'}
                </button>
              </form>
            </section>
          )}

          {page === 'track' && loggedInUser && (
            <section className="section-block">
              <div className="section-title">
                <div>
                  <span className="banner-eyebrow">COMPLAINT TRACKING</span>
                  <h2>{isAdmin ? 'All Complaints' : 'My Complaints'}</h2>
                  <p>Review status and administrator remarks.</p>
                </div>
                <button className="secondary-button" onClick={isAdmin ? () => loadAdminComplaints() : loadUserComplaints} disabled={loading}>
                  ↻ {loading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              <div className="search-box">
                <span>⌕</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search complaints..." />
              </div>

              <ComplaintCards
                complaints={filteredComplaints}
                admin={isAdmin}
                onChangeComplaint={changeComplaint}
                onUpdateComplaint={updateComplaint}
                loading={loading}
              />
            </section>
          )}

          {page === 'admin' && isAdmin && (
            <>
              <section className="welcome-banner admin-banner">
                <div>
                  <span className="banner-eyebrow">ADMINISTRATION</span>
                  <h1>Administrator Dashboard</h1>
                  <p>Review concerns, monitor performance, and keep everyone informed.</p>
                </div>
                <div className="banner-art" aria-hidden="true">
                  <div className="art-circle"><div className="art-document">✓</div></div>
                </div>
              </section>

              <section className="section-block">
                <div className="section-title">
                  <div>
                    <h2>Overview</h2>
                    <p>Complaint status at a glance.</p>
                  </div>
                  <button className="secondary-button" onClick={() => loadAdminComplaints()} disabled={loading}>
                    ↻ {loading ? 'Refreshing...' : 'Refresh Data'}
                  </button>
                </div>

                <div className="stats-grid">
                  <StatCard icon="▤" label="Total Complaints" value={totalComplaints} description="All submitted complaints" color="stat-blue" />
                  <StatCard icon="◷" label="Pending" value={pendingComplaints} description="Waiting for action" color="stat-orange" />
                  <StatCard icon="⚒" label="In Progress" value={inProgressComplaints} description="Currently being handled" color="stat-cyan" />
                  <StatCard icon="✓" label="Resolved" value={resolvedComplaints} description="Successfully completed" color="stat-green" />
                </div>
              </section>

              <section className="section-block table-section">
                <div className="section-title">
                  <div>
                    <h2>All Complaints</h2>
                    <p>Manage submitted complaints and resolution updates.</p>
                  </div>
                </div>

                <div className="search-box">
                  <span>⌕</span>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, category, status, or ID..." />
                </div>

                <ComplaintCards
                  complaints={filteredComplaints}
                  admin
                  onChangeComplaint={changeComplaint}
                  onUpdateComplaint={updateComplaint}
                  loading={loading}
                />
              </section>
            </>
          )}

          {page === 'about' && (
            <section className="section-block about-panel">
              <span className="banner-eyebrow">ABOUT THE PLATFORM</span>
              <h1>Making complaint management simpler.</h1>
              <p>
                The Smart Complaint Management System helps users report problems
                and track their resolution. Administrators can review complaints,
                update statuses, and share progress through remarks.
              </p>

              <div className="feature-grid">
                <article className="feature-card">
                  <div className="feature-icon">＋</div>
                  <h3>Easy Reporting</h3>
                  <p>Report issues in a clear and structured way.</p>
                </article>
                <article className="feature-card">
                  <div className="feature-icon blue">⌕</div>
                  <h3>Transparent Tracking</h3>
                  <p>View progress and updates in one place.</p>
                </article>
                <article className="feature-card">
                  <div className="feature-icon green">✓</div>
                  <h3>Accountability</h3>
                  <p>Keep resolution progress visible to users.</p>
                </article>
              </div>
            </section>
          )}
        </main>

        <footer className="footer">
          <span>© 2026 Smart Complaint Management System</span>
          <span>Built for a better community</span>
        </footer>
      </div>
    </div>
  );
}

export default App;
