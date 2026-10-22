# Phase 0 — Foundation and Local Development

Purpose: Establish a reproducible repository and prove the API and Expo app can run before business logic is added.

## Read first
`AGENTS.md`, `SPEC.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`, `SECURITY.md`.

## Tasks
- [ ] Confirm Node.js/npm/Git versions.
- [ ] Create root repository and `.gitignore`.
- [ ] Initialize `backend/` with Express + TypeScript.
- [ ] Configure scripts for dev, build and test.
- [ ] Add `GET /api/health`.
- [ ] Add safe `backend/.env.example`.
- [ ] Initialize `mobile/` using a compatible Expo React Native TypeScript template.
- [ ] Launch Expo Go on Android.
- [ ] Add initial README instructions.

## Verification
- [ ] Backend starts without errors.
- [ ] `GET /api/health` returns the documented JSON.
- [ ] Backend production TypeScript build passes.
- [ ] Expo development server starts and app opens on Android.
- [ ] `.env` and build outputs are ignored by Git.

## End-of-phase loop
Code → test → fix until checks pass → review diff/security/comments → improve and repeat if needed → update `PROGRESS.md` → make small focused commits → push only if remote/branch are configured and approved. Never force-push.
