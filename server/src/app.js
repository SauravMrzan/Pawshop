import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { env } from './config/env.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import mfaRoutes from './routes/mfaRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import checkoutRoutes from './routes/checkoutRoutes.js';
import adminProductRoutes from './routes/adminProductRoutes.js';
import adminOrderRoutes from './routes/adminOrderRoutes.js';
import adminUserRoutes from './routes/adminUserRoutes.js';
import adminAuditRoutes from './routes/adminAuditRoutes.js';
import { csrfProtection } from './middleware/csrfProtection.js';

const app = express();

// Sets X-Frame-Options: SAMEORIGIN (clickjacking) and a baseline
// Content-Security-Policy among other headers. Must run before routes.
app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.clientOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(csrfProtection);

app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth/mfa', mfaRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/audit-logs', adminAuditRoutes);

// Catches any unhandled error from a route (including thrown TypeErrors from
// malformed input) and returns a generic message — never the stack trace or
// error internals, regardless of NODE_ENV. The real error still goes to the
// server log for debugging.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Something went wrong' });
});

export default app;
