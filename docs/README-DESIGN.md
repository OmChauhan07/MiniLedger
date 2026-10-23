# MiniLedger — Extended Design Documentation

This pack documents MiniLedger's current visual direction and the expanded requirement to track both money lent and money borrowed.

## Files
- `Design.md`: UI system and screen behavior for both loan directions.
- `DESIGN-REFERENCES.md`: mapping of the supplied screenshots and design notes for borrowed-loan states.
- `IMPLEMENTATION-GUIDE.md`: staged implementation, run commands, migration cautions, and QA.
- `STITCH-PROMPT.md`: prompt for generating/refining the expanded UI.
- `FEATURE-LOAN-DIRECTIONS.md`: feature rules and acceptance criteria for Lent/Borrowed.
- `design/references/`: the supplied screenshots.

## Integration instructions
1. Extract this archive.
2. Merge the included files into the existing repository's `docs/` directory. Do not delete or replace existing `SPEC.md`, `SCHEMA.md`, `API.md`, `TASKS.md`, `PROGRESS.md`, `AGENTS.md`, or phase docs.
3. If those existing documents are present, update them to reflect the feature using `FEATURE-LOAN-DIRECTIONS.md` as the requirements source. Do not overwrite existing technical details blindly.
4. Ask the coding agent to inspect the actual repository, Prisma schema, migrations, API routes, and app navigation before implementing.
5. Implement and test incrementally. Existing screenshots represent the Lent flow; borrowed-loan screens should reuse the same visual system.

## Scope boundary
MiniLedger remains a personal ledger for a signed-in user's records. A loan's direction describes the relationship between the user and the named person; it does not create an account for the other person or require them to use MiniLedger.
