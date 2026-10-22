# MiniLedger Database Schema

Purpose: Defines the intended data model and constraints before Prisma implementation. Keep this synchronized with `backend/prisma/schema.prisma` and migrations.

## User
- `id`: UUID or CUID primary key.
- `phone`: normalized phone number, unique and indexed.
- `createdAt`: timestamp, default now.
- Relation: one user has many loans.

## Loan
- `id`: UUID or CUID primary key.
- `userId`: foreign key to User; indexed.
- `friendName`: required bounded string.
- `amount`: PostgreSQL `Decimal`/`NUMERIC`, scale 2; must be positive.
- `dueDate`: date-only value or a consistently normalized timestamp. Prefer PostgreSQL `DATE` for due-date semantics.
- `isRepaid`: boolean, default false.
- `repaidAt`: nullable timestamp.
- `createdAt`: timestamp, default now.
- Relation: each loan belongs to exactly one user.

## Suggested Prisma model shape
The exact native type syntax must be checked against the installed Prisma version:
```prisma
model User {
  id        String   @id @default(cuid())
  phone     String   @unique
  createdAt DateTime @default(now())
  loans     Loan[]
}

model Loan {
  id         String   @id @default(cuid())
  userId     String
  friendName String
  amount     Decimal  @db.Decimal(12, 2)
  dueDate    DateTime @db.Date
  isRepaid   Boolean  @default(false)
  repaidAt   DateTime?
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, dueDate])
  @@index([userId, isRepaid])
}
```
Do not copy blindly if the selected Prisma major version requires different configuration. Verify with `prisma validate` and generated migrations.

## OTP storage
OTP is short-lived authentication state. Use a small dedicated OTP challenge model/table or a well-defined in-memory store for local demo. If using in-memory storage, document that pending OTPs are lost on server restart and that it is single-process development behavior. Do not store plaintext OTPs in the database. Prefer a hashed OTP challenge if practical.

Suggested fields if persisted:
- `id`, normalized `phone`, `codeHash`, `expiresAt`, `attemptCount`, `createdAt`, `consumedAt`.
- Add an index on phone and expiry.
- Expire/delete old challenges.
- Never return OTP values from API responses.

## Data integrity
- Foreign keys enforce ownership relationships.
- Unique phone prevents duplicate accounts.
- Index loans by user and relevant filter fields.
- Repayment update should atomically set `isRepaid=true` and `repaidAt`.
- Keep all schema changes in migrations.
