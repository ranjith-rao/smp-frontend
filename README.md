# SMP Frontend

React + Vite frontend for the SMP social platform.

## Features

- Email/password auth with verification and reset flow
- Home feed with post creation, reactions, comments, share, and reporting
- Page system (explore, follow/unfollow, owner management)
- Page posts in feed with dual identity display (`page via author`)
- Admin console (users, posts, pages, reports, content settings)
- Real-time presence and chat via Socket.IO

## Tech Stack

- React 19
- Vite
- React Router
- Socket.IO client

## Prerequisites

- Node.js 18+
- Running backend API (default: `http://localhost:5000`)

## Setup

1) Install dependencies

```bash
npm install
```

2) Configure environment (optional)

Create `.env` in this folder:

```env
VITE_API_URL=http://localhost:5000
```

If omitted, it defaults to `http://localhost:5000`.

3) Start dev server

```bash
npm run dev
```

App will run on `http://localhost:5173`.

## Scripts

- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run preview` - preview production build
- `npm run lint` - run ESLint

## API Configuration

Centralized in [src/config/api.js](src/config/api.js).

## Notes

- Auth token is stored in `localStorage` as `token`.
- Presence socket auto-disconnects on expired token and logs user out.
- Admin navigation includes reports management with post, comment, and page reports.
