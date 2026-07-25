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

  const [mfaSetupData, setMfaSetupData] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaPassword, setMfaPassword] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [mfaSuccess, setMfaSuccess] = useState('');
  const [startingMfaSetup, setStartingMfaSetup] = useState(false);
  const [enablingMfa, setEnablingMfa] = useState(false);

  const [confirmingDisableMfa, setConfirmingDisableMfa] = useState(false);
  const [disableMfaCode, setDisableMfaCode] = useState('');
  const [disableMfaPassword, setDisableMfaPassword] = useState('');
  const [disableMfaError, setDisableMfaError] = useState('');
  const [disablingMfa, setDisablingMfa] = useState(false);

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

  const handleStartMfaSetup = async () => {
    setMfaError('');
    setMfaSuccess('');
    setStartingMfaSetup(true);
    try {
      const res = await apiClient.post('/auth/mfa/setup');
      setMfaSetupData(res.data);
    } catch (err) {
      setMfaError(err.response?.data?.message || 'Could not start MFA setup');
    } finally {
      setStartingMfaSetup(false);
    }
  };

  const handleEnableMfa = async (e) => {
    e.preventDefault();
    setMfaError('');
    setEnablingMfa(true);
    try {
      const res = await apiClient.post('/auth/mfa/enable', { currentPassword: mfaPassword, code: mfaCode });
      setUser(res.data.user);
      setMfaSetupData(null);
      setMfaCode('');
      setMfaPassword('');
      setMfaSuccess('Two-factor authentication is now enabled.');
    } catch (err) {
      setMfaError(err.response?.data?.message || 'Could not enable MFA');
    } finally {
      setEnablingMfa(false);
    }
  };

  const handleDisableMfa = async (e) => {
    e.preventDefault();
    setDisableMfaError('');
    setDisablingMfa(true);
    try {
      const res = await apiClient.post('/auth/mfa/disable', {
        currentPassword: disableMfaPassword,
        code: disableMfaCode,
      });
      setUser(res.data.user);
      setConfirmingDisableMfa(false);
      setDisableMfaCode('');
      setDisableMfaPassword('');
    } catch (err) {
      setDisableMfaError(err.response?.data?.message || 'Could not disable MFA');
    } finally {
      setDisablingMfa(false);
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

          <div className="mfa-section">
            <h2>Two-factor authentication</h2>
            {user && (
              <p>
                Status:{' '}
                <span className={`badge ${user.mfaEnabled ? 'badge-ok' : 'badge-neutral'}`}>
                  {user.mfaEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </p>
            )}

            {!user?.mfaEnabled && !mfaSetupData && (
              <button className="btn btn-primary" onClick={handleStartMfaSetup} disabled={startingMfaSetup}>
                {startingMfaSetup ? 'Starting...' : 'Enable two-factor authentication'}
              </button>
            )}

            {mfaSetupData && (
              <form onSubmit={handleEnableMfa}>
                <p>Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.):</p>
                <img src={mfaSetupData.qrCodeDataUrl} alt="MFA QR code" width={200} height={200} />
                <p>
                  Or enter this code manually: <code>{mfaSetupData.secret}</code>
                </p>
                <div>
                  <label htmlFor="mfaCode">6-digit code from your app</label>
                  <input
                    id="mfaCode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="one-time-code"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
                <PasswordField
                  id="mfaPassword"
                  label="Current password"
                  value={mfaPassword}
                  onChange={(e) => setMfaPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                {mfaError && <p role="alert">{mfaError}</p>}
                <div className="danger-zone__actions">
                  <button type="submit" className="btn btn-primary" disabled={enablingMfa || mfaCode.length !== 6}>
                    {enablingMfa ? 'Confirming...' : 'Confirm and enable'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMfaSetupData(null);
                      setMfaCode('');
                      setMfaPassword('');
                      setMfaError('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {!mfaSetupData && mfaError && <p role="alert">{mfaError}</p>}
            {mfaSuccess && <p className="form-success">{mfaSuccess}</p>}

            {user?.mfaEnabled && (
              <>
                {!confirmingDisableMfa ? (
                  <button className="btn btn-danger" onClick={() => setConfirmingDisableMfa(true)}>
                    Disable two-factor authentication
                  </button>
                ) : (
                  <form onSubmit={handleDisableMfa}>
                    <div>
                      <label htmlFor="disableMfaCode">6-digit code from your app</label>
                      <input
                        id="disableMfaCode"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        autoComplete="one-time-code"
                        value={disableMfaCode}
                        onChange={(e) => setDisableMfaCode(e.target.value.replace(/\D/g, ''))}
                        required
                      />
                    </div>
                    <PasswordField
                      id="disableMfaPassword"
                      label="Current password"
                      value={disableMfaPassword}
                      onChange={(e) => setDisableMfaPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    {disableMfaError && <p role="alert">{disableMfaError}</p>}
                    <div className="danger-zone__actions">
                      <button
                        type="submit"
                        className="btn btn-danger"
                        disabled={disablingMfa || disableMfaCode.length !== 6}
                      >
                        {disablingMfa ? 'Disabling...' : 'Confirm disable'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmingDisableMfa(false);
                          setDisableMfaCode('');
                          setDisableMfaPassword('');
                          setDisableMfaError('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>

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
