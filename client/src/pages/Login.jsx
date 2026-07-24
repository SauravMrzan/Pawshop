import { useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import apiClient from '../api/client';
import PasswordField from '../components/PasswordField';
import GoogleSignInButton from '../components/GoogleSignInButton';

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const recaptchaRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await apiClient.post('/auth/login', { email, password, recaptchaToken });
      navigate(redirect || '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1>Log In</h1>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <PasswordField
            id="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          {RECAPTCHA_SITE_KEY && (
            <div>
              <ReCAPTCHA ref={recaptchaRef} sitekey={RECAPTCHA_SITE_KEY} onChange={setRecaptchaToken} />
            </div>
          )}
          {error && <p role="alert">{error}</p>}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={Boolean(RECAPTCHA_SITE_KEY) && !recaptchaToken}
          >
            Log In
          </button>
        </form>
        <div className="auth-card__oauth">
          <GoogleSignInButton redirectTo={redirect || '/'} onError={setError} />
        </div>
        <p className="auth-card__footer-link">
          Need an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
