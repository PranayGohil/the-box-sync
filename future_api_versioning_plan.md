# Implementation Plan: API Versioning (/api/v1/)

## Goal Description
Add `/api/v1/` versioning to all backend routes to future-proof the SaaS API and allow for non-breaking version upgrades.

## Key Insight: Zero-Code-Change Migration

Since all 5 frontends point to an `REACT_APP_API` environment variable that contains `/api`, the cleanest and safest approach is:

1. **Server**: Create a grouped `v1` router and mount all 34 routers under `/api/v1/`.
2. **Server**: Keep the existing `/api/` routes **in parallel** for backward compatibility during transition.
3. **Frontends**: Update only the `.env` files to point to `/api/v1`. Zero frontend source code changes needed.

This gives us a live `/api/v1/` instantly while ensuring nothing breaks.

## Component Changes

### Server

#### [NEW] [v1Router.js](file:///e:/Pranay/TheBoxSync/server/router/v1Router.js)
A single aggregated router that imports all 34 existing routers and mounts them exactly as they are now. This file becomes the single source of truth for what's in v1.

#### [MODIFY] [index.js](file:///e:/Pranay/TheBoxSync/server/index.js)
- Import and mount `v1Router` at `/api/v1`.
- Keep all existing `/api/` mounts in place (backward compat).

### Frontends (`.env` files only — no source code changes)

| Frontend | File | Change |
|---|---|---|
| admin | `admin/.env` | `REACT_APP_API` → `http://localhost:5001/api/v1` |
| manager | `manager/.env` | `REACT_APP_API` → `http://localhost:5001/api/v1` |
| qsr | `qsr/.env` | `REACT_APP_API` → `http://localhost:5001/api/v1` |
| captain | `captain/.env` | `REACT_APP_API` → `http://localhost:5001/api/v1` |
| super-admin | `super-admin/.env` | Leave as-is for now (needs separate code audit) |

> [!NOTE]
> The `super-admin` uses `VITE_APP_API_URL = http://localhost:5001` without the `/api` suffix, which means it is manually constructing URLs in its source code. Changing it blindly could break its API calls. I will leave it on the old path for now until we can audit it separately.

## User Review Required

> [!WARNING]
> **Frontend Restart Required**: After updating the `.env` files, each React frontend (`admin`, `manager`, `qsr`, `captain`) will need to be restarted (`npm start`) for the new environment variables to take effect.

> [!IMPORTANT]
> **Are you ready to proceed?** This will add a fully functional `/api/v1/` to your server and update 4 frontend `.env` files.
