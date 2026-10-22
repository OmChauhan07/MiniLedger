# MiniLedger Architecture Decision Log

Purpose: Records important decisions and rationale so later agent sessions do not undo them without evidence.

## D-001 — Single repository
**Decision:** Keep backend and mobile in one repository.
**Reason:** Simple for a short internship assignment and easy for reviewers to clone.
**Status:** Accepted.

## D-002 — Expo for React Native
**Decision:** Use Expo and Expo Go for initial Android testing.
**Reason:** Fast setup and rapid iteration within the 24-hour deadline; Android Studio remains optional if using a physical device.
**Status:** Accepted.

## D-003 — Express + TypeScript
**Decision:** Use Express with TypeScript for the REST API.
**Reason:** Directly matches the assignment and showcases Node.js backend fundamentals.
**Status:** Accepted.

## D-004 — PostgreSQL + Prisma
**Decision:** Use PostgreSQL with Prisma migrations and generated client.
**Reason:** Reliable relational storage and a clear schema/migration workflow. The candidate has prior PostgreSQL/Prisma experience.
**Status:** Accepted.

## D-005 — Development-only mock OTP
**Decision:** Print OTP in backend terminal, never return it from API.
**Reason:** Explicit assignment requirement while keeping delivery and testing simple.
**Trade-off:** This is not real phone verification and must be labelled as a mock.
**Status:** Accepted.

## D-006 — JWT-protected user-scoped data
**Decision:** Use JWT middleware and derive the owner ID from the verified token.
**Reason:** Prevents clients from accessing another user's ledger by changing request data.
**Status:** Accepted.

## D-007 — Decimal-safe amounts
**Decision:** Use PostgreSQL NUMERIC/Prisma Decimal and return amount strings in API responses.
**Reason:** Floating-point arithmetic is inappropriate as the source of truth for money.
**Status:** Accepted.

## D-008 — Full repayment only
**Decision:** A loan is either unpaid or fully repaid.
**Reason:** Keeps the required assignment scope small and unambiguous.
**Status:** Accepted.

## D-009 — No extra infrastructure before core completion
**Decision:** Do not add Redis, payment gateways, cloud storage or real SMS unless core requirements are finished and there is a clear reason.
**Reason:** Deadline is within 24 hours; unrelated complexity increases failure risk.
**Status:** Accepted.

## D-010 — Comments and file headers
**Decision:** Every source file has a purpose/importer header, and each function/major section has a concise explanatory single-line comment.
**Reason:** Supports traceability and helps the candidate explain the implementation in interview.
**Status:** Accepted.

## Change protocol
If a decision must change, add a dated entry with old decision, new decision, rationale, trade-offs and affected documents. Update dependent docs in the same logical change.
