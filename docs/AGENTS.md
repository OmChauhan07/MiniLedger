# AGENTS.md — MiniLedger Agent Rulebook

## Mission
Build and submit MiniLedger, a small Android-friendly mobile app for tracking money lent to friends. The assignment requirements are the source of truth. Keep the implementation understandable enough for the candidate to explain in an interview.

## Source of truth and precedence
1. `SPEC.md` defines scope and acceptance criteria.
2. `ARCHITECTURE.md` defines structure and design boundaries.
3. `API.md` and `SCHEMA.md` define API and persistence contracts.
4. `SECURITY.md` defines non-negotiable security rules.
5. `CONVENTIONS.md` and `TESTING.md` define implementation and verification standards.
6. `TASKS.md`, `PROGRESS.md`, and the phase files track execution.
If documents conflict, do not silently guess: update the relevant decision/document and record the reason in `DECISIONS.md`.

## Required stack
- Mobile: React Native, Expo, TypeScript.
- API: Node.js, Express, TypeScript.
- Database: PostgreSQL with Prisma ORM.
- Validation: Zod.
- Authentication: mock phone OTP for development, JWT for protected API calls.
- Tests: Vitest or Jest, Supertest for API tests; use the chosen test runner consistently.
- Package manager: npm.
- Repository: one repository containing `backend/` and `mobile/`.

Do not add Redis, Docker, state-management libraries, UI frameworks, receipt storage, SMS vendors, or other infrastructure unless the core scope is complete and there is a documented reason. Prefer the simplest maintainable solution.

## Working commands
Run commands from the correct directory.

Backend (expected after setup):
- `cd backend`
- `npm install`
- `npm run dev`
- `npm run build`
- `npm test`
- `npx prisma generate`
- `npx prisma migrate dev`

Mobile (expected after setup):
- `cd mobile`
- `npm install`
- `npx expo start`
- `npx tsc --noEmit`
- `npm test` (if configured)

Do not claim a command passed unless it was actually run and its result inspected. If a script does not exist yet, implement/configure it or state that it is not available.

## Code comments and file headers — mandatory
- Every source-code file starts with a short comment describing the advantage/purpose this file adds to the project and the files/modules that import it. If no files import it directly (for example an entry point), say `Imported by: none (application entry point)` or equivalent.
- Add a single-line comment above each function and each major logical section explaining what it does and why it exists. Avoid comments that merely restate the next line.
- Keep comments accurate when moving or renaming files. Do not add noisy comments to every trivial statement.
- Markdown documentation files should begin with a brief purpose statement, but do not add source-code comment syntax to Markdown.

## Implementation rules
- Build in small, verifiable increments using `TASKS.md` and the active phase file.
- Read the relevant docs before coding. Do not invent API fields or database behavior.
- Keep HTTP handlers thin; put business rules in services where useful.
- Validate all external input at the API boundary.
- Keep user-owned data scoped by the authenticated user's ID on every read and write.
- Use decimal-safe PostgreSQL numeric values for money. Never use JavaScript floating-point arithmetic as the source of truth for monetary totals.
- Store timestamps in UTC; compare due dates consistently and document the date-only policy.
- Keep OTP mock-only. Never claim real SMS verification is implemented.
- Use `.env.example` placeholders only; never commit real credentials.
- Add/update tests for changed behavior.
- Do not introduce unrelated features or dependencies just to showcase skills.

## End-of-phase quality loop — mandatory
At the end of every phase, repeat this loop until the review finds no blocking or material correctness issues:
1. Code the smallest complete task.
2. Run the relevant tests, type checks, lint/build commands that exist.
3. Fix failures and rerun until all relevant checks pass.
4. Review the diff for correctness, security, maintainability, scope and comment/header requirements.
5. If any improvement materially improves accuracy or reliability, implement it and repeat from step 2.
6. Summarize what was verified and any known limitations in `PROGRESS.md`.
7. Commit the completed small logical changes using focused commit messages; do not put an entire phase into one giant commit.
8. Push the commits to the configured remote working branch/main branch only after tests and review pass.
9. If a merge conflict occurs, inspect both sides, preserve intended behavior, rerun relevant tests and review, then push.
Never use `git push --force` or discard another person's changes to resolve conflicts. Never push if tests are failing or the working tree contains unexplained changes. If remote access is unavailable, explain the exact manual next step rather than pretending the push succeeded.

## Git safety
- Check `git status` and `git diff` before commits.
- Use small commits, for example `feat(auth): add mock OTP verification`.
- Do not commit `.env`, tokens, private keys, OTP logs, build output, or personal data.
- Do not overwrite existing remote work. Fetch and inspect before integrating.
- Never force-push.
- Do not create/push to a remote unless the user has supplied or explicitly approved the repository URL and branch.
- “Push to main” means push to the configured repository's `main` branch after confirming the remote and branch. Do not assume a remote exists.

## Completion report
At the end of each phase, report: files changed, commands actually run, pass/fail results, commit hash if created, push status, known limitations, and next phase. Keep `TASKS.md` and `PROGRESS.md` current.
