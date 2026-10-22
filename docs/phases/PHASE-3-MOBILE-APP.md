# Phase 3 — Expo Mobile App and Integration

Purpose: Deliver the complete user-facing flow connected to the real backend.

## Tasks
- [ ] Set API base URL using Expo-compatible environment configuration.
- [ ] Add a typed central API client and normalized errors.
- [ ] Add phone input and OTP verification screens.
- [ ] Store JWT using secure mobile storage compatible with Expo.
- [ ] Add dashboard and summary cards.
- [ ] Add loan list with overdue/repaid status labels.
- [ ] Add loan form with friend name, amount and due date.
- [ ] Add mark-repaid interaction.
- [ ] Refresh summary/list after successful mutations.
- [ ] Implement loading, empty, validation, network and success states.
- [ ] Apply selected design from `Design.md` without adding scope.
- [ ] Test on a physical Android phone or emulator.

## Verification
- [ ] Login works end-to-end.
- [ ] New loan appears in the list and summary.
- [ ] Overdue loan is visually distinguishable.
- [ ] Mark-repaid updates status and totals.
- [ ] App handles API unavailable and invalid input gracefully.
- [ ] No API URL assumes localhost on a physical phone.
- [ ] Mobile TypeScript check passes.

## End-of-phase loop
Code → test → fix until checks pass → review UX, API handling, security and comments → improve and repeat if needed → update progress → focused commits → push only after verification and approved remote. Never force-push.
