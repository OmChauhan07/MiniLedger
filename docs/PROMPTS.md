# MiniLedger Reusable Agent Prompts

Purpose: These prompts keep implementation focused when using a coding agent or delegating separate tasks. Run one prompt at a time and ask the agent to inspect repository state first.

## General session prompt
Read `AGENTS.md`, `SPEC.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`, `SECURITY.md`, `TASKS.md`, `PROGRESS.md`, and the active phase file before changing code. Inspect the current git status and existing files. Implement only the next unchecked task. Follow all source-file header/comment rules. Run relevant tests and build/type checks, review the diff, update docs and progress, then make a focused commit only if checks pass. Do not push unless the remote and target branch are explicitly configured/approved. Report exact commands and results; never invent success.

## Backend implementation prompt
Implement the next backend task from the active phase. Keep routes thin, validate inputs with Zod, use typed services and Prisma, enforce JWT authentication and user ownership, preserve decimal-safe money handling, and add tests for happy paths and failures. Follow `API.md`, `SCHEMA.md`, and `SECURITY.md`. Do not add unrelated dependencies.

## Mobile implementation prompt
Implement the next mobile task from the active phase using Expo React Native TypeScript. Use the shared API contract, central API client, clear loading/empty/error states and accessible controls. Use secure token storage appropriate to Expo. Keep business rules server-authoritative and ensure physical Android devices use a reachable LAN API URL rather than localhost. Test on Android where possible.

## Code review prompt
Review the current diff as a careful senior engineer. Look for functional bugs, authorization/ownership flaws, date/time mistakes, money precision issues, input-validation gaps, secret leaks, missing tests, incorrect comments/file headers, unnecessary complexity and scope creep. Do not edit first: list findings with severity and file/line references. Then fix confirmed issues, run the relevant test suite/build, and report any remaining risks.

## Test-writing prompt
Read `TESTING.md` and inspect existing test conventions. Add tests for the specified behavior and edge cases without weakening assertions to make code pass. Use isolated test data and a safe test database. Never point tests at production data. Run tests and report the actual output.

## Documentation/README prompt
Compare docs against actual code, scripts, environment variables and endpoints. Correct stale instructions. Ensure clean-clone setup is reproducible and `.env.example` contains no secrets. Do not claim unsupported features exist.

## Final submission prompt
Verify every `SPEC.md` acceptance criterion against the running app and test evidence. Run tests, type checks and production build. Inspect `git status`, staged diff and recent commits. Confirm remote URL and target branch before pushing. Never force-push. Prepare a concise final report with repository URL, test results, known limitations and the verified recording link (if one exists).
