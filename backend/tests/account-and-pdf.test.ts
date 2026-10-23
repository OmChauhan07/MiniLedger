// Purpose: Integration tests for Phase 7: Profile editing, OTP challenge verification, security binding, and PDF ledger export.
// Tested by: vitest

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { hashPassword } from '../src/lib/password.js';

describe('Account Profile Editing & PDF Ledger Export Integration Tests', () => {
  let userAToken: string;
  let userAId: string;
  const userAPhone = '+919777111222';

  let userBToken: string;
  let userBId: string;
  const userBPhone = '+919777333444';

  let userCToken: string;
  let userCId: string;
  const userCPhone = '+919777555666';

  beforeAll(async () => {
    const phones = [userAPhone, userBPhone, userCPhone];
    // Clean up existing test users if any
    await prisma.loan.deleteMany({
      where: {
        OR: [
          { user: { phone: { in: phones } } },
          { counterpartyUser: { phone: { in: phones } } },
        ],
      },
    });

    await prisma.otpChallenge.deleteMany({
      where: { phone: { in: phones } },
    });

    await prisma.user.deleteMany({
      where: { phone: { in: phones } },
    });

    const pwdHash = await hashPassword('SecretPass123!');

    // Create User A
    const userA = await prisma.user.create({
      data: {
        phone: userAPhone,
        name: 'Alice Cooper',
        email: 'alice@example.com',
        passwordHash: pwdHash,
        phoneVerifiedAt: new Date(),
      },
    });
    userAId = userA.id;

    // Create User B
    const userB = await prisma.user.create({
      data: {
        phone: userBPhone,
        name: 'Bob Martin',
        email: 'bob@example.com',
        passwordHash: pwdHash,
        phoneVerifiedAt: new Date(),
      },
    });
    userBId = userB.id;

    // Create User C (unauthorized outsider)
    const userC = await prisma.user.create({
      data: {
        phone: userCPhone,
        name: 'Charlie Davis',
        passwordHash: pwdHash,
        phoneVerifiedAt: new Date(),
      },
    });
    userCId = userC.id;

    // Login to obtain JWTs
    const resA = await request(app)
      .post('/api/auth/login')
      .send({ phone: userAPhone, password: 'SecretPass123!' });
    userAToken = resA.body.token;

    const resB = await request(app)
      .post('/api/auth/login')
      .send({ phone: userBPhone, password: 'SecretPass123!' });
    userBToken = resB.body.token;

    const resC = await request(app)
      .post('/api/auth/login')
      .send({ phone: userCPhone, password: 'SecretPass123!' });
    userCToken = resC.body.token;
  }, 60000);

  describe('1. Profile Retrieval & No-Op Detection', () => {
    it('GET /api/account requires authentication', async () => {
      const res = await request(app).get('/api/account');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('GET /api/account returns current profile for authenticated user', async () => {
      const res = await request(app)
        .get('/api/account')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.id).toBe(userAId);
      expect(res.body.user.name).toBe('Alice Cooper');
      expect(res.body.user.email).toBe('alice@example.com');
      expect(res.body.user.phone).toBe(userAPhone);
    });

    it('PATCH /api/account returns updated: false when submitting identical values (no OTP generated)', async () => {
      const challengeCountBefore = await prisma.otpChallenge.count({
        where: { phone: userAPhone },
      });

      const res = await request(app)
        .patch('/api/account')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          name: 'Alice Cooper',
          email: 'alice@example.com',
        });

      expect(res.status).toBe(200);
      expect(res.body.updated).toBe(false);
      expect(res.body.message).toContain('No profile changes detected');

      const challengeCountAfter = await prisma.otpChallenge.count({
        where: { phone: userAPhone },
      });
      expect(challengeCountAfter).toBe(challengeCountBefore);
    });
  });

  describe('2. OTP-Protected Profile Updates & Security Binding', () => {
    let updateToken: string;

    it('PATCH /api/account initiates an OTP challenge when valid changes are proposed', async () => {
      const res = await request(app)
        .patch('/api/account')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          name: 'Alice M. Cooper',
          email: 'alice.new@example.com',
        });

      expect(res.status).toBe(200);
      expect(res.body.requiresOtp).toBe(true);
      expect(res.body.updateToken).toBeDefined();
      expect(res.body.maskedPhone).toContain('•••');
      updateToken = res.body.updateToken;

      // Pending changes should NOT yet be applied in database
      const userA = await prisma.user.findUnique({ where: { id: userAId } });
      expect(userA?.name).toBe('Alice Cooper');
      expect(userA?.email).toBe('alice@example.com');
    });

    it('POST /api/account/verify-update rejects invalid OTP', async () => {
      const res = await request(app)
        .post('/api/account/verify-update')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          updateToken,
          otp: '000000',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_OTP');

      // Database remains unchanged
      const userA = await prisma.user.findUnique({ where: { id: userAId } });
      expect(userA?.name).toBe('Alice Cooper');
    });

    it('POST /api/account/verify-update rejects updateToken submitted by a different user', async () => {
      // User C tries to use User A's updateToken
      const res = await request(app)
        .post('/api/account/verify-update')
        .set('Authorization', `Bearer ${userCToken}`)
        .send({
          updateToken,
          otp: '123456',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('POST /api/account/verify-update applies changes when valid OTP is provided', async () => {
      // Fetch latest challenge from database to extract hash verification
      const challenge = await prisma.otpChallenge.findFirst({
        where: { phone: userAPhone, consumedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      expect(challenge).toBeDefined();

      // We can update the challenge codeHash to match a known test OTP "777888"
      const { hashOtp } = await import('../src/lib/crypto.js');
      const knownCode = '777888';
      await prisma.otpChallenge.update({
        where: { id: challenge!.id },
        data: { codeHash: hashOtp(userAPhone, knownCode) },
      });

      const res = await request(app)
        .post('/api/account/verify-update')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          updateToken,
          otp: knownCode,
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('Profile updated successfully');
      expect(res.body.user.name).toBe('Alice M. Cooper');
      expect(res.body.user.email).toBe('alice.new@example.com');

      // Verify persistence in DB
      const userA = await prisma.user.findUnique({ where: { id: userAId } });
      expect(userA?.name).toBe('Alice M. Cooper');
      expect(userA?.email).toBe('alice.new@example.com');

      // Verify challenge consumed
      const updatedChallenge = await prisma.otpChallenge.findUnique({ where: { id: challenge!.id } });
      expect(updatedChallenge?.consumedAt).not.toBeNull();
    });

    it('POST /api/account/verify-update prevents reuse of already consumed OTP challenge', async () => {
      const res = await request(app)
        .post('/api/account/verify-update')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          updateToken,
          otp: '777888',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('OTP_ALREADY_USED');
    });
  });

  describe('3. PDF Ledger Export', () => {
    beforeAll(async () => {
      // Seed loans between Alice and Bob
      // Alice lends ₹6,000 to Bob
      await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          friendName: 'Bob Martin',
          amount: '6000.00',
          dueDate: '2026-11-15',
          type: 'LENT',
          counterpartyUserId: userBId,
        });

      // Bob lends ₹2,500 to Alice
      await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          friendName: 'Alice M. Cooper',
          amount: '2500.00',
          dueDate: '2026-12-01',
          type: 'LENT',
          counterpartyUserId: userAId,
        });
    });

    it('POST /api/ledger/export/pdf requires authentication', async () => {
      const res = await request(app).post('/api/ledger/export/pdf');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('POST /api/ledger/export/pdf generates a valid PDF buffer (binary format)', async () => {
      const res = await request(app)
        .post('/api/ledger/export/pdf')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ format: 'binary' });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('attachment; filename="MiniLedger_Statement_');
      expect(Buffer.isBuffer(res.body)).toBe(true);
      // Valid PDF files start with %PDF-
      const pdfHeader = res.body.slice(0, 5).toString('ascii');
      expect(pdfHeader).toBe('%PDF-');
    });

    it('POST /api/ledger/export/pdf returns structured JSON with base64 payload when format=base64', async () => {
      const res = await request(app)
        .post('/api/ledger/export/pdf')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ format: 'base64', direction: 'ALL' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.filename).toBeDefined();
      expect(typeof res.body.base64).toBe('string');
      expect(res.body.recordCount).toBe(2);

      // Verify reconciliation figures
      // Alice lent ₹6,000 and borrowed ₹2,500
      expect(res.body.summary.totalLent).toBe('6000.00');
      expect(res.body.summary.totalBorrowed).toBe('2500.00');
      expect(res.body.summary.outstandingLent).toBe('6000.00');
      expect(res.body.summary.outstandingBorrowed).toBe('2500.00');
    });

    it('POST /api/ledger/export/pdf filters by direction with caller perspective inversion', async () => {
      // Bob views the ledger filtering by LENT
      // Bob lent ₹2,500 to Alice. The ₹6,000 loan Alice made to Bob was LENT by Alice, which is BORROWED from Bob's perspective.
      const resBobLent = await request(app)
        .post('/api/ledger/export/pdf')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ format: 'base64', direction: 'LENT' });

      expect(resBobLent.status).toBe(200);
      expect(resBobLent.body.recordCount).toBe(1);
      expect(resBobLent.body.summary.totalLent).toBe('2500.00');
      expect(resBobLent.body.summary.totalBorrowed).toBe('0.00');

      // Bob views the ledger filtering by BORROWED
      const resBobBorrowed = await request(app)
        .post('/api/ledger/export/pdf')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ format: 'base64', direction: 'BORROWED' });

      expect(resBobBorrowed.status).toBe(200);
      expect(resBobBorrowed.body.recordCount).toBe(1);
      expect(resBobBorrowed.body.summary.totalLent).toBe('0.00');
      expect(resBobBorrowed.body.summary.totalBorrowed).toBe('6000.00');
    });

    it('POST /api/ledger/export/pdf isolates unrelated User C completely', async () => {
      const resC = await request(app)
        .post('/api/ledger/export/pdf')
        .set('Authorization', `Bearer ${userCToken}`)
        .send({ format: 'base64' });

      expect(resC.status).toBe(200);
      expect(resC.body.recordCount).toBe(0);
      expect(resC.body.summary.totalLent).toBe('0.00');
      expect(resC.body.summary.totalBorrowed).toBe('0.00');
    });
  });
});
