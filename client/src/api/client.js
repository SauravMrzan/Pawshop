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

export default apiClient;
