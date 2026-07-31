import axios from 'axios';

// Derived from whatever host the page was actually loaded from, not a fixed
// value baked in at build time. The API always runs on the same machine as
// the client, just a different port — so this keeps client and API on the
// same "site" no matter which hostname/IP you access the app through
// (localhost, a VM's IP, etc). That match matters: a SameSite=Strict
// session cookie set from a mismatched cross-site pair silently never
// sticks, which looks exactly like "login succeeds but you're not logged in".
const API_PORT = 4001;

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || `http://${window.location.hostname}:${API_PORT}/api`,
  withCredentials: true,
});

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);
let csrfToken;
let csrfTokenRequest;

async function getCsrfToken() {
  if (csrfToken) return csrfToken;

  if (!csrfTokenRequest) {
    // Use the bare Axios function to avoid recursively invoking this
    // instance's request interceptor.
    csrfTokenRequest = axios
      .get(`${apiClient.defaults.baseURL}/auth/csrf-token`, { withCredentials: true })
      .then(({ data }) => {
        csrfToken = data.csrfToken;
        return csrfToken;
      })
      .finally(() => {
        csrfTokenRequest = undefined;
      });
  }

  return csrfTokenRequest;
}

apiClient.interceptors.request.use(async (config) => {
  if (MUTATING_METHODS.has(config.method?.toLowerCase())) {
    config.headers.set('X-CSRF-Token', await getCsrfToken());
  }
  return config;
});

export default apiClient;
