# Course Portal

A paid course portal. Monorepo with a React (Vite) SPA in `/client` and a Node/Express API in `/server`, backed by MongoDB (Mongoose).

This is an early scaffold: registration, login, logout, `/me`, and a health check only. No course content, payments, rate limiting, MFA, or RBAC enforcement yet — those come later.

## Prerequisites

- Node.js 20+
- A running MongoDB instance (local or Atlas)

## Project structure

```
client/   React + Vite SPA
server/   Express API (routes, controllers, models, middleware, config)
```

## Setup

### 1. Server

```
cd server
cp .env.example .env   # fill in MONGO_URI and a real JWT_SECRET
npm install
npm run dev
```

The API runs on `http://localhost:4000` by default. Health check: `GET http://localhost:4000/health`.

### 2. Client

```
cd client
cp .env.example .env   # defaults to http://localhost:4000/api
npm install
npm run dev
```

The client runs on `http://localhost:5173` by default (Vite's dev server).

## Auth notes

- Passwords are hashed with argon2id.
- Sessions are JWTs set as an `httpOnly`, `SameSite=Strict` cookie — never stored in localStorage or returned in JSON.
- The `Secure` cookie flag is enabled automatically when `NODE_ENV=production`. In local dev over plain HTTP, browsers won't set a `Secure` cookie at all, so it's left off in development; set `NODE_ENV=production` (and serve over HTTPS) to test the real cookie behavior.

## Environment variables

See `server/.env.example` and `client/.env.example` for the full list. Never commit `.env` files — only the `.env.example` templates are tracked.
