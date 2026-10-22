# MiniLedger Security Rules

Purpose: Define security boundaries for authentication, personal ledger data and environment configuration.

## Secrets
- Never commit `.env`, API tokens, JWT secrets, database credentials, private keys or real user data.
- Maintain `.env.example` with placeholders only.
- Use a strong random `JWT_SECRET` locally and in deployment.
- Do not print authorization headers, JWTs, database URLs or OTPs for unrelated users.
- Do not include secrets in screenshots or screen recordings.

## Mock OTP
- This is a development mock, not real SMS verification.
- Print OTP only in backend development logs as required.
- Never return OTP in the HTTP response or embed a fixed OTP in client code.
- OTP must expire quickly, have bounded verification attempts and be invalidated after success.
- Avoid logging phone numbers in full where not needed.
- Use rate limiting or a simple per-phone cooldown if time allows.
- Make the mock behavior explicit in README and demo.

## Authentication and authorization
- Verify JWT signature and expiry on every protected route.
- Derive user identity from verified JWT claims, not request body/query parameters.
- Every loan read, create, update and summary query must be scoped to authenticated user.
- Return a generic not-found response when an ID is not owned by the user.
- Never expose OTP challenge state, password/token secrets or stack traces.

## Data validation
- Validate phone, OTP, friend name, amount, due date and loan ID at the API boundary.
- Reject negative, zero, malformed or excessive-precision amounts.
- Use Prisma/parameterized queries; never build SQL by concatenating user input.
- Restrict CORS to appropriate origins when deployment needs it; permissive local development CORS must not be treated as production policy.

## Mobile storage and network
- Do not put secrets in the mobile bundle.
- Use secure token storage appropriate to Expo (for example, Expo SecureStore if compatible with the selected Expo SDK).
- Never use `localhost` from a physical phone to access the development computer.
- Use HTTPS for deployed API traffic.
- Do not log the JWT or full sensitive response payloads.

## Git and agent safety
- Inspect staged changes before every commit.
- Do not delete or overwrite existing work without understanding it.
- Never force-push.
- Resolve merge conflicts deliberately and rerun tests.
- Do not run destructive database commands against a production database.
- Do not claim deployment, tests, commits or pushes succeeded unless verified.
