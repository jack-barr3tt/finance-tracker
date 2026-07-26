# Finance Tracker

A self-hosted personal finance tracker. This functions as an upgrade from a spreadsheet, but simpler than fancy apps like [Emma](https://emma-app.com). You would likely want this solution because you have multiple bank accounts and/or diverse investments, and can't (or don't want to) use the Open Banking service.

Sensitive fields (transaction descriptions, category names, rules, etc.) are encrypted client-side before they reach the server.

## Features

- **Accounts** - multiple bank and investment accounts
- **Categories & rules** - spending categories, per-account regex rules, bulk re-categorisation
- **Transactions** - manual entry, search, filters, and infinite scroll
- **CSV import** - Monzo, Nationwide, Barclaycard, and Trading212. You can help by adding support for your banks/platforms
- **Charts** - balance over time, spending by category, budget breakdown
- **Budget planner** - recurring income/outgoings and per-category budgets
- **Budget actuals** - planned vs actual spending with variance per line and category
- **End-to-end encryption** - AES-GCM in the browser; the server stores ciphertext only
- **Keyboard shortcuts** - transaction search, new row, submit, and a shortcuts modal (`⌘/`)
- **Self-hosting** - [Docker Compose deployment](SELF_HOSTING.md)

## Planned features

- Passkey / WebAuthn login
- Live market data for stocks, crypto, etc.
- Open Banking integration
- Budget overspend alerts (notifications when you cross a threshold mid-month)

## Self-hosting

See [SELF_HOSTING.md](SELF_HOSTING.md) for a copy-paste Docker Compose setup.

## Stack

| Layer    | Tech                                              |
| -------- | ------------------------------------------------- |
| Frontend | React, Vite, TypeScript, Flowbite, TanStack Query |
| Backend  | Go, Fiber, OpenAPI-generated handlers             |
| Database | PostgreSQL                                        |

## Local development

### Prerequisites

- Node.js 22+ and [yarn](https://yarnpkg.com/)
- Go 1.23+
- PostgreSQL

### Database

Apply the schema and seed data to a local Postgres database:

```bash
psql -d your_database -f database/schema.sql
psql -d your_database -f database/seed.sql
```

### Backend

```bash
cp backend/.env.template backend/.env
# Edit backend/.env with your DB credentials and a JWT secret

cd backend
go run .
```

The API listens on `http://localhost:8080` by default.

### Frontend

```bash
cp frontend/.env.template frontend/.env

cd frontend
yarn install
yarn dev
```

The app runs at `http://localhost:5173`. Set `VITE_ENABLE_SIGNUP=true` in `frontend/.env` (and `ENABLE_SIGNUP=true` in `backend/.env`) to allow new user registration during development.

### API codegen

After changing [`backend/schema/openapi.yaml`](backend/schema/openapi.yaml), regenerate both sides:

```bash
# Backend
cd backend/tools && go generate

# Frontend
cd frontend && yarn codegen
```
