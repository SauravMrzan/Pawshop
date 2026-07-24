import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

// Redirects away non-admins; real enforcement is server-side, this is
// just so the admin UI doesn't render for people who can't use it anyway.
export function useRequireAdmin() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    apiClient
      .get('/auth/me')
      .then((res) => {
        if (res.data.user.role !== 'admin') {
          navigate('/');
        } else {
          setReady(true);
        }
      })
      .catch(() => navigate('/login'));
  }, [navigate]);

  return ready;
}
