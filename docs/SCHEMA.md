# MiniLedger Database Schema

Purpose: Defines the intended data model and constraints before Prisma implementation. Keep this synchronized with `backend/prisma/schema.prisma` and migrations.

## User
- `id`: CUID primary key.
- `phone`: normalized E.164 phone number, unique and indexed.
- `name`: user display name (required on signup, nullable for legacy).
- `email`: optional email address.
- `passwordHash`: salted password hash generated via scrypt (nullable for legacy).
- `phoneVerifiedAt`: timestamp when phone was verified via OTP.
- `createdAt`: timestamp, default now.
- `updatedAt`: timestamp, updated automatically.
- Relations: user owns loans (`loans`), and may be referenced as counterparty (`counterpartyLoans`).

## Loan
- `id`: CUID primary key.
- `userId`: foreign key to User (owner); indexed.
- `counterpartyUserId`: optional foreign key to registered User; indexed.
- `friendName`: required bounded string (display name of counterparty).
- `counterpartyPhone`: optional phone number for external contacts.
- `amount`: PostgreSQL `Decimal(12, 2)`; positive monetary value.
- `dueDate`: PostgreSQL `DATE` representing date-only due date.
- `type`: `LoanType` enum (`LENT` or `BORROWED`, default `LENT`).
- `isRepaid`: boolean, default false.
- `repaidAt`: nullable timestamp.
- `createdAt`: timestamp, default now.
- `updatedAt`: timestamp, updated automatically.

## Suggested Prisma model shape
```prisma
enum LoanType {
  LENT
  BORROWED
}

model User {
  id                String    @id @default(cuid())
  phone             String    @unique
  name              String?
  email             String?
  passwordHash      String?
  phoneVerifiedAt   DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt @default(now())
  loans             Loan[]    @relation("UserLoans")
  counterpartyLoans Loan[]    @relation("CounterpartyLoans")

  @@index([phone])
}

model Loan {
  id                 String    @id @default(cuid())
  userId             String
  counterpartyUserId String?
  friendName         String
  counterpartyPhone  String?
  amount             Decimal   @db.Decimal(12, 2)
  dueDate            DateTime  @db.Date
  type               LoanType  @default(LENT)
  isRepaid           Boolean   @default(false)
  repaidAt           DateTime?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt @default(now())
  user               User      @relation("UserLoans", fields: [userId], references: [id], onDelete: Cascade)
  counterpartyUser   User?     @relation("CounterpartyLoans", fields: [counterpartyUserId], references: [id], onDelete: SetNull)

  @@index([userId, dueDate])
  @@index([userId, isRepaid])
  @@index([userId, type, isRepaid])
  @@index([userId, counterpartyUserId])
  @@index([counterpartyUserId])
}
```

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
