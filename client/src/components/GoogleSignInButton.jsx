import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Renders nothing if VITE_GOOGLE_CLIENT_ID isn't set yet — mirrors the
// backend's graceful-skip behavior while OAuth setup is in progress.
export default function GoogleSignInButton({ redirectTo = '/', onError }) {
  const navigate = useNavigate();
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;

    function init() {
      if (cancelled) return;
      // The GSI script tag is async/defer, so window.google may not exist
      // yet on first render — poll briefly rather than assume it's ready.
      if (!window.google?.accounts?.id) {
        setTimeout(init, 100);
        return;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            await apiClient.post('/auth/google', { credential: response.credential });
            navigate(redirectTo);
          } catch (err) {
            onError?.(err.response?.data?.message || 'Google sign-in failed');
          }
        },
      });

      if (buttonRef.current) {
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          width: 300,
        });
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [navigate, redirectTo, onError]);

  if (!GOOGLE_CLIENT_ID) return null;

  return <div ref={buttonRef} />;
}
