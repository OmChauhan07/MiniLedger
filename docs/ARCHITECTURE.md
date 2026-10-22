# MiniLedger Architecture

Purpose: This document explains the system boundaries, directory structure and data flow so implementation agents do not invent a different architecture.

## 1. High-level design
- `mobile/`: Expo React Native TypeScript client.
- `backend/`: Express TypeScript REST API.
- PostgreSQL: persistent source of truth.
- Prisma: schema, migrations and database access.
- Zod: request validation.
- JWT: authentication between app and API.
- OTP: development-only, short-lived mock stored server-side.

The mobile client never connects directly to PostgreSQL. All data access goes through the API.

## 2. Planned folder structure
```text
MiniLedger/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── index.ts
│   │   ├── app.ts
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── loans/
│   │   │   └── summary/
│   │   ├── lib/
│   │   └── types/
│   ├── tests/
│   ├── .env.example
│   └── package.json
├── mobile/
│   ├── app/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── utils/
│   └── package.json
└── documentation files
```
Keep the actual structure simple. Do not create empty abstractions solely to match this diagram.

## 3. Backend responsibility boundaries
- Route/controller: HTTP status codes, parsing and response formatting.
- Validation schemas: validate external input with Zod.
- Service: business rules such as OTP verification, ownership-aware loan operations and summary definitions.
- Prisma/database layer: persistent reads/writes.
- Auth middleware: verify JWT and attach the authenticated user ID.
- Error middleware: return consistent safe error responses.

Avoid duplicating business logic between routes.

## 4. Mobile responsibility boundaries
- Screens: compose page layout and connect feature actions.
- Feature components: loan cards, summary cards and forms.
- API client: central base URL, JSON handling, Bearer token and normalized errors.
- Auth state: manage login/logout and authenticated state.
- Formatting utilities: currency, dates and overdue display logic.
- Do not embed database/business rules in visual components.

## 5. Data flow
1. User submits an action in the app.
2. Client validates basic form shape.
3. API client sends an HTTP request, including JWT for protected routes.
4. Express validates the request and authentication.
5. Service enforces business rules and user ownership.
6. Prisma executes database operations.
7. API returns a typed response.
8. App refreshes the affected list/summary and renders the result.

## 6. Data and money handling
- PostgreSQL is the source of truth.
- Store amount using `Decimal`/`NUMERIC`, with two decimal places for INR.
- Avoid JavaScript floating-point sums as authoritative totals.
- Convert decimal values to strings in API responses; format them for display in the app.
- Use a documented date-only policy for due dates to avoid timezone drift.
- Prefer a transaction for state changes that require multiple database writes.

## 7. API configuration
- Backend local port defaults to `4000`.
- Mobile emulator API URL may use `http://10.0.2.2:4000`.
- Physical Android phone must use the development computer's LAN IP, e.g. `http://192.168.x.x:4000`.
- Hosted deployment uses HTTPS and a configured public API URL.
- Never hardcode credentials or production secrets.

## 8. Deployment direction
Keep deployment simple: a hosted PostgreSQL instance and a Node-compatible API host are sufficient. The Expo app can be demonstrated through Expo Go. Do not spend the deadline building an app-store binary unless required.
