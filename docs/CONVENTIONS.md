# MiniLedger Coding Conventions

Purpose: Keep naming, validation, errors and implementation patterns consistent across human and agent-written code.

## Naming
- TypeScript variables and functions: `camelCase`.
- Types/interfaces/classes: `PascalCase`.
- React components: `PascalCase.tsx`.
- Files: follow the surrounding module convention; prefer descriptive names.
- Constants: `UPPER_SNAKE_CASE` only for true constants.
- Database models: singular `PascalCase`; fields use `camelCase`.
- API routes use lowercase plural nouns, e.g. `/api/loans`.

## Required source-file header
At the top of every source-code file, include a short comment describing:
1. What capability/advantage the file adds.
2. Which files/modules import it.
3. For an entry point with no importers, explicitly state that it is an entry point.

Example:
```ts
// Purpose: validates loan inputs so invalid money/date values never reach business logic.
// Imported by: src/modules/loans/loan.routes.ts and src/modules/loans/loan.service.ts.
```
Keep the import list current. For dynamically loaded modules, mention the loader if relevant.

## Comments
- Add a single-line explanatory comment above each function and each major logical section.
- Explain intent, constraints or a non-obvious decision; do not narrate trivial syntax.
- Comments must match actual behavior and be updated with code changes.
- Do not add comments that claim a feature is secure or complete unless tests/evidence support it.

## TypeScript
- Keep strict mode enabled.
- Avoid `any`; use typed request/response objects and `unknown` for untrusted values where appropriate.
- Keep API contracts and client types aligned.
- Do not use non-null assertions to silence errors without a documented reason.
- Avoid large route handlers; separate validation and business logic.

## API and validation
- Validate every external request body and path parameter.
- Return a consistent error shape; never return stack traces in production.
- Use correct HTTP status codes.
- Never trust a `userId` provided by the client for ownership.
- Do not leak whether another user's loan ID exists.

## Database
- Use Prisma migrations for schema changes.
- Never edit production database state manually as a substitute for a migration.
- Use transactions when multiple related writes must succeed together.
- Use decimal-safe values for money.
- Avoid N+1 queries and unnecessary repeated aggregate queries.

## React Native
- Keep API calls out of presentational components where practical.
- Use reusable summary and loan-card components only when they reduce duplication.
- Provide loading, empty, error and success states.
- Use accessible labels and readable contrast.
- Do not store long-lived credentials in plain AsyncStorage; use secure storage appropriate to Expo.
- Never use `localhost` as the API host from a physical phone.

## Avoid
- Hardcoded secrets or API URLs scattered through components.
- Unvalidated user input.
- Duplicate business rules in UI and backend.
- Unnecessary abstractions, dependencies, animations or unrelated features.
- Silent catch blocks and swallowed errors.
- Large commits combining unrelated work.
