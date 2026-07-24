import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import PasswordField from '../components/PasswordField';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [deletingUserId, setDeletingUserId] = useState(null);

  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [createUserError, setCreateUserError] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    apiClient
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        setEmail(res.data.user.email);
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, [navigate]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    setUsersLoading(true);
    apiClient
      .get('/admin/users')
      .then((res) => setUsers(res.data.users))
      .catch(() => setUsersError('Could not load users'))
      .finally(() => setUsersLoading(false));
  }, [user]);

  const handleLogout = async () => {
    await apiClient.post('/auth/logout');
    navigate('/login');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setSavingProfile(true);
    try {
      const res = await apiClient.patch('/auth/me', {
        email,
        currentPassword,
        newPassword: newPassword || undefined,
      });
      setUser(res.data.user);
      setEmail(res.data.user.email);
      setCurrentPassword('');
      setNewPassword('');
      setProfileSuccess('Profile updated.');
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Could not update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setDeleteError('');
    setDeleting(true);
    try {
      await apiClient.delete('/auth/me', { data: { currentPassword: deletePassword } });
      navigate('/login');
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Could not delete account');
      setDeleting(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateUserError('');
    setCreatingUser(true);
    try {
      const res = await apiClient.post('/admin/users', { email: newUserEmail, password: newUserPassword });
      setUsers((prev) => [{ ...res.data.user, createdAt: new Date().toISOString() }, ...prev]);
      setNewUserEmail('');
      setNewUserPassword('');
    } catch (err) {
      setCreateUserError(err.response?.data?.message || 'Could not create user');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (target) => {
    if (!window.confirm(`Delete account "${target.email}"? This cannot be undone.`)) return;
    setDeletingUserId(target.id);
    setUsersError('');
    try {
      await apiClient.delete(`/admin/users/${target.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== target.id));
    } catch (err) {
      setUsersError(err.response?.data?.message || 'Could not delete user');
    } finally {
      setDeletingUserId(null);
    }
  };

  if (loading) return <p className="page">Loading...</p>;

  return (
    <div className="page">
      <div className="auth-page">
        <div className="card auth-card">
          <h1>Account</h1>
          {user && (
            <p>
              Logged in as {user.email} ({user.role})
            </p>
          )}

          <form onSubmit={handleProfileSubmit}>
            <div>
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <PasswordField
              id="newPassword"
              label="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Leave blank to keep your current password"
              autoComplete="new-password"
            />
            <PasswordField
              id="currentPassword"
              label="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            {profileError && <p role="alert">{profileError}</p>}
            {profileSuccess && <p className="form-success">{profileSuccess}</p>}
            <button type="submit" className="btn btn-primary" disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save changes'}
            </button>
          </form>

          <button className="dashboard-logout-btn" onClick={handleLogout}>
            Log Out
          </button>

          <div className="danger-zone">
            <h2>Delete account</h2>
            <p className="danger-zone__copy">This permanently deletes your account. This cannot be undone.</p>

            {!confirmingDelete ? (
              <button className="btn btn-danger" onClick={() => setConfirmingDelete(true)}>
                Delete my account
              </button>
            ) : (
              <form onSubmit={handleDelete}>
                <PasswordField
                  id="deletePassword"
                  label="Confirm your password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                {deleteError && <p role="alert">{deleteError}</p>}
                <div className="danger-zone__actions">
                  <button type="submit" className="btn btn-danger" disabled={deleting}>
                    {deleting ? 'Deleting...' : 'Permanently delete my account'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmingDelete(false);
                      setDeletePassword('');
                      setDeleteError('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {user?.role === 'admin' && (
        <section className="admin-users-section">
          <h2>Manage users</h2>

          <form className="card admin-form" onSubmit={handleCreateUser}>
            <h3>Create User</h3>
            <div>
              <label htmlFor="newUserEmail">Email</label>
              <input
                id="newUserEmail"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                required
              />
            </div>
            <PasswordField
              id="newUserPassword"
              label="Password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            {createUserError && <p role="alert">{createUserError}</p>}
            <button type="submit" className="btn btn-primary" disabled={creatingUser}>
              {creatingUser ? 'Creating...' : 'Create user'}
            </button>
          </form>

          {usersError && <p role="alert">{usersError}</p>}

          {usersLoading ? (
            <p>Loading users...</p>
          ) : (
            <div className="admin-list">
              {users.map((u) => {
                const isSelf = u.id === user.id;
                const isAdmin = u.role === 'admin';
                const blockedReason = isSelf
                  ? 'Use the form above to manage your own account'
                  : isAdmin
                    ? 'Admin accounts cannot be deleted here'
                    : undefined;
                return (
                  <div className="admin-row card" key={u.id}>
                    <div className="admin-row__info">
                      <span className="admin-row__name">{u.email}</span>
                      <span className="badge badge-neutral">{u.role}</span>
                    </div>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteUser(u)}
                      disabled={isSelf || isAdmin || deletingUserId === u.id}
                      title={blockedReason}
                    >
                      {deletingUserId === u.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
