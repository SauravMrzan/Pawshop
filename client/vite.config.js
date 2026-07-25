import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The API's helmet() headers only cover JSON responses from the Express
  // server — they never touch the actual HTML page, since that's served
  // entirely by this separate Vite process. Clickjacking protection has to
  // be set here too, or the page itself stays framable regardless of what
  // the API sends.
  server: {
    // TEMPORARILY DISABLED for clickjacking PoC recording — restore before committing.
    // headers: {
    //   'X-Frame-Options': 'SAMEORIGIN',
    //   'Content-Security-Policy': "frame-ancestors 'self'",
    // },
  },
  preview: {
    headers: {
      'X-Frame-Options': 'SAMEORIGIN',
      'Content-Security-Policy': "frame-ancestors 'self'",
    },
  },
})
