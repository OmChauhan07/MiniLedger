# MiniLedger UI and Backend — Implementation Guide

## Read first
Inspect the actual repository and existing `docs/SPEC.md`, `docs/SCHEMA.md`, `docs/API.md`, task/phase docs, Prisma schema, migrations, API routes, and mobile navigation. This guide is not permission to overwrite existing architecture.

## Recommended implementation order

### Phase 1 — Inspect and plan
- Identify app/backend directories and existing scripts.
- Trace create/list/detail/repayment/summary endpoints.
- Confirm current Loan fields and migration history.
- Report planned file changes before editing if the project agent workflow requires approval.

### Phase 2 — Database and API
1. Add `LoanType` enum with `LENT` and `BORROWED` to the existing schema.
2. Add `type` to the existing Loan model with a safe default of `LENT` for existing records.
3. Create and review a migration against the intended development database.
4. Update create/list/detail/repayment/summary services and validators.
5. Ensure every query is scoped to the authenticated user's ID.
6. Add tests for both types, overdue calculations, filtering, migration defaults, and ownership.

Illustrative schema fragment only; adapt to the real schema:
```prisma
enum LoanType {
  LENT
  BORROWED
}

// Add to the existing model rather than replacing it:
// type LoanType @default(LENT)
```

### Phase 3 — Mobile shared UI
- Match the supplied reference screenshots for card styling, typography, status colors, and bottom navigation.
- Build/reuse shared SummaryCard, LoanCard, StatusBadge, FilterChip, and loading/empty/error components.
- Add direction labels that remain clear without color.

### Phase 4 — Screens
1. Dashboard with separate lent/borrowed totals and overdue amounts.
2. Add Loan with “I've Lent” / “I've Borrowed” selector.
3. All Loans with type and status filters.
4. Loan Details with direction-aware wording and repayment action.
5. Account stats labelled by direction.
6. Authentication and existing flows must remain working.

### Phase 5 — Verification
- Test Lent creation and repayment.
- Test Borrowed creation and repayment.
- Verify old records are interpreted as Lent.
- Verify summary calculations and overdue boundaries.
- Verify filters and search.
- Verify user ownership on every read/write route.
- Run actual project tests, lint/typecheck/build scripts found in package.json.
- Compare mobile screens with `docs/design/references/`.

## Run the app (typical commands; check package.json)

Mobile/Expo directory:
```bash
npm install
npx expo start
```
Press `a` for a configured Android emulator, or use Expo Go if compatible with the project's SDK/native dependencies.

Backend directory:
```bash
npm install
npm run dev
```
Use the actual development script defined by the repository.

Prisma (only after verifying DATABASE_URL and existing migrations):
```bash
npx prisma generate
npx prisma migrate dev
```
Do not use `migrate dev` against production. Do not reset/drop the database to add this feature. Use the repository's deployment migration process for deployed environments.

## Android API connection
- On a physical phone, `localhost` is the phone, not your PC. Use the PC's LAN IP with both devices on the same network.
- Android emulator access to a host-machine service is commonly `10.0.2.2`.
- Deployed testing should use the backend's HTTPS URL.
- Never commit `.env` or secrets.

## Definition of done
- Existing Lent workflow still works.
- Borrowed workflow works end-to-end.
- Existing data remains Lent.
- API totals, list filters, and detail labels are direction-aware.
- No hardcoded screenshot data in production paths.
- Unsupported settings are omitted or clearly nonfunctional.
- Tests and build checks pass; remaining issues are documented.
