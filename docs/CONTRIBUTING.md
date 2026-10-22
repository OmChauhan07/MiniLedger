# Contributing to MiniLedger

Purpose: Defines the safe, repeatable workflow for contributors and coding agents.

## Workflow
1. Read `AGENTS.md` and the active phase file.
2. Check `git status` and inspect existing code before editing.
3. Pick one small task from `TASKS.md`.
4. Implement only that task and add/update tests.
5. Run relevant tests, type checks and build commands.
6. Review the diff for correctness, security, scope and comment requirements.
7. Update documentation and `PROGRESS.md`.
8. Commit a small logical change with a descriptive message.
9. Push only after tests and review pass and the remote/branch are approved.

## Commit examples
- `chore: initialize Expo mobile app`
- `feat(auth): add mock OTP verification`
- `feat(loans): create and list loan entries`
- `feat(summary): calculate overdue amount`
- `test(api): cover loan ownership rules`
- `docs: document Android setup`

## Pull/push and conflicts
- Fetch and inspect remote changes before integrating.
- Never force-push.
- Resolve conflicts by understanding both changes, not blindly choosing “ours” or “theirs”.
- Rerun relevant tests after conflict resolution.
- If remote details are unavailable, leave changes committed locally and report what the user must configure.

## Definition of done
A task is done only when implementation, tests, review and documentation are complete, and progress records the evidence. “Looks correct” is not a substitute for verification.
