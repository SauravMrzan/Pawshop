PawShop

A secure pet-supplies e-commerce web application. Monorepo with a React (Vite) SPA in /client and a Node/Express API in /server, backed by MongoDB (Mongoose).

The project was built security-first: the Express API is the single trust boundary, and every authorization, pricing, and validation decision is made server-side rather than trusted from the client.

Features

Storefront

Product browsing and product detail pages
Checkout with server-computed totals and atomic stock handling
Order history scoped to the signed-in user

Admin

Product management (create / update / delete)
Order management (view all orders, update status)
User management (list / create / delete non-admin users)
Audit log viewer

Security

Passwords hashed with argon2id (memory-hard)
Sessions issued as a JWT in an httpOnly, SameSite=Strict cookie, never stored in localStorage or returned in JSON
Token-version revocation — logout and password change invalidate every outstanding session, not just the current cookie
Role-based access control enforced server-side; admin middleware re-reads the current role from the database on every request
Multi-factor authentication (TOTP, RFC 6238) with QR-code enrolment
Google OAuth sign-in with server-side ID-token verification
reCAPTCHA and per-IP rate limiting on authentication endpoints
Account lockout after repeated failed logins
User-enumeration resistance on registration (uniform response and timing)
IDOR protection on orders (ownership enforced in the query)
Mass-assignment / privilege-escalation protection (field whitelisting, strict schemas, role never accepted from the client)
Server-side price integrity at checkout (client-sent prices are ignored)
Input validation and NoSQL-injection resistance (operator-shaped input is rejected before reaching queries)
Security headers via helmet (clickjacking protection, baseline CSP)
Double-submit CSRF tokens and trusted-origin validation on every state-changing request
Structured audit logging of authentication and admin-sensitive events
Prerequisites
Node.js 20+
A running MongoDB instance (local or Atlas)
Project structure
client/   React + Vite SPA
server/   Express API (routes, controllers, models, middleware, config, utils)
Setup
1. Server
cd server
cp .env.example .env   # fill in MONGO_URI and a real JWT_SECRET (and optional reCAPTCHA/Google keys)
npm install
npm run dev

The API runs on http://localhost:4000 by default. Health check: GET http://localhost:4000/health.

Seed sample products (optional):

npm run seed

The admin account is created once, out of band, via mongosh — there is no self-service way to register as an admin.

2. Client
cd client
cp .env.example .env   # defaults to http://localhost:4000/api
npm install
npm run dev

The client runs on http://localhost:5173 by default (Vite's dev server).

Auth notes
Passwords are hashed with argon2id.
Sessions are JWTs set as an httpOnly, SameSite=Strict cookie — never stored in localStorage or returned in JSON.
The Secure cookie flag is enabled automatically when NODE_ENV=production. In local dev over plain HTTP, browsers won't set a Secure cookie at all, so it's left off in development; set NODE_ENV=production (and serve over HTTPS) to test the real cookie behaviour.
reCAPTCHA and Google OAuth are optional in development: if their keys are not set, the server skips verification with a warning and the Google button does not render. Set the keys to enforce them.
Environment variables

See server/.env.example and client/.env.example for the full list. Never commit .env files — only the .env.example templates are tracked.

Known limitations / future work
Payment is not processed live — checkout creates a pending order with a Stripe integration point marked as TODO.
No containerisation (Docker) or CI/CD pipeline yet.
Password policy enforces length and complexity but not reuse prevention or expiry.
