// Purpose: Integration tests for signup, password login, legacy upgrades, user search, counterparty linking, and pairwise netting.
// Imported by: vitest test runner

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { hashOtp } from '../src/lib/crypto.js';
import { hashPassword } from '../src/lib/password.js';

describe('Accounts, Counterparties & Netting Integration Tests', () => {
  const alicePhone = '+919811122233';
  const bobPhone = '+919844455566';
  const charliePhone = '+919877788899';
  const legacyPhone = '+919800011122';

  let aliceToken: string;
  let aliceId: string;
  let bobToken: string;
  let bobId: string;

  beforeEach(async () => {
    // Clean up test users and challenges
    const phones = [alicePhone, bobPhone, charliePhone, legacyPhone];
    await prisma.loan.deleteMany({
      where: {
        OR: [
          { user: { phone: { in: phones } } },
          { counterpartyUser: { phone: { in: phones } } },
        ],
      },
    });
    await prisma.otpChallenge.deleteMany({ where: { phone: { in: phones } } });
    await prisma.user.deleteMany({ where: { phone: { in: phones } } });

    // Seed Alice
    const aliceHash = await hashPassword('AliceSecret123');
    const alice = await prisma.user.create({
      data: {
        phone: alicePhone,
        name: 'Alice Cooper',
        email: 'alice@example.com',
        passwordHash: aliceHash,
        phoneVerifiedAt: new Date(),
      },
    });
    aliceId = alice.id;

    // Seed Bob
    const bobHash = await hashPassword('BobSecret123');
    const bob = await prisma.user.create({
      data: {
        phone: bobPhone,
        name: 'Bob Marley',
        email: 'bob@example.com',
        passwordHash: bobHash,
        phoneVerifiedAt: new Date(),
      },
    });
    bobId = bob.id;

    // Seed Legacy User without password
    await prisma.user.create({
      data: {
        phone: legacyPhone,
        name: 'Legacy User',
        passwordHash: null,
      },
    });

    // Obtain tokens via password login
    const aliceLogin = await request(app)
      .post('/api/auth/login')
      .send({ phone: alicePhone, password: 'AliceSecret123' });
    aliceToken = aliceLogin.body.token;

    const bobLogin = await request(app)
      .post('/api/auth/login')
      .send({ phone: bobPhone, password: 'BobSecret123' });
    bobToken = bobLogin.body.token;
  });

  afterAll(async () => {
    const phones = [alicePhone, bobPhone, charliePhone, legacyPhone];
    await prisma.loan.deleteMany({
      where: {
        OR: [
          { user: { phone: { in: phones } } },
          { counterpartyUser: { phone: { in: phones } } },
        ],
      },
    });
    await prisma.otpChallenge.deleteMany({ where: { phone: { in: phones } } });
    await prisma.user.deleteMany({ where: { phone: { in: phones } } });
    await prisma.$disconnect();
  });

  describe('Authentication: Signup & Login Flows', () => {
    it('requires successful OTP verification before completing signup', async () => {
      // 1. Send OTP
      const sendRes = await request(app)
        .post('/api/auth/register/send-otp')
        .send({ phone: charliePhone });
      expect(sendRes.status).toBe(200);

      // Create known OTP challenge in DB
      const testOtp = '654321';
      await prisma.otpChallenge.create({
        data: {
          phone: charliePhone,
          codeHash: hashOtp(charliePhone, testOtp),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });

      // 2. Verify OTP
      const verifyRes = await request(app)
        .post('/api/auth/register/verify-otp')
        .send({ phone: charliePhone, otp: testOtp });
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.signupToken).toBeDefined();

      // 3. Complete Registration
      const completeRes = await request(app)
        .post('/api/auth/register/complete')
        .send({
          signupToken: verifyRes.body.signupToken,
          name: 'Charlie Chaplin',
          email: 'charlie@example.com',
          password: 'CharliePassword123!',
        });

      expect(completeRes.status).toBe(201);
      expect(completeRes.body.token).toBeDefined();
      expect(completeRes.body.user.name).toBe('Charlie Chaplin');
      expect(completeRes.body.user.email).toBe('charlie@example.com');
      expect(completeRes.body.user.phoneVerifiedAt).toBeDefined();
    });

    it('prevents duplicate account creation for already verified phone', async () => {
      // Create known OTP challenge for Alice's already registered phone
      const testOtp = '112233';
      await prisma.otpChallenge.create({
        data: {
          phone: alicePhone,
          codeHash: hashOtp(alicePhone, testOtp),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });

      const verifyRes = await request(app)
        .post('/api/auth/register/verify-otp')
        .send({ phone: alicePhone, otp: testOtp });

      const completeRes = await request(app)
        .post('/api/auth/register/complete')
        .send({
          signupToken: verifyRes.body.signupToken,
          name: 'Alice Imposter',
          password: 'AnotherPassword123',
        });

      expect(completeRes.status).toBe(409);
      expect(completeRes.body.error.code).toBe('ACCOUNT_ALREADY_EXISTS');
    });

    it('authenticates existing user via phone and password without requiring OTP', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ phone: alicePhone, password: 'AliceSecret123' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.phone).toBe(alicePhone);
      expect(res.body.user.name).toBe('Alice Cooper');
    });

    it('rejects incorrect password with generic error message', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ phone: alicePhone, password: 'WrongPassword' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('prompts legacy users without password to set up a password via OTP', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ phone: legacyPhone, password: 'AnyPassword' });

      expect(loginRes.status).toBe(403);
      expect(loginRes.body.error.code).toBe('PASSWORD_NOT_SET');

      // Legacy user can upgrade via legacy setup flow
      const testOtp = '889900';
      await prisma.otpChallenge.create({
        data: {
          phone: legacyPhone,
          codeHash: hashOtp(legacyPhone, testOtp),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });

      const upgradeRes = await request(app)
        .post('/api/auth/legacy-setup/verify-and-set-password')
        .send({
          phone: legacyPhone,
          otp: testOtp,
          password: 'NewLegacyPassword123',
          name: 'Upgraded Legacy User',
        });

      expect(upgradeRes.status).toBe(200);
      expect(upgradeRes.body.token).toBeDefined();
      expect(upgradeRes.body.user.name).toBe('Upgraded Legacy User');

      // Now regular login works
      const postUpgradeLogin = await request(app)
        .post('/api/auth/login')
        .send({ phone: legacyPhone, password: 'NewLegacyPassword123' });
      expect(postUpgradeLogin.status).toBe(200);
    });
  });

  describe('User Discovery: Search API', () => {
    it('requires authentication to search users', async () => {
      const res = await request(app).get('/api/users/search?q=Bob');
      expect(res.status).toBe(401);
    });

    it('returns registered users matching name and masks their phone number', async () => {
      const res = await request(app)
        .get('/api/users/search?q=Bob')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);

      const found = res.body.data.find((u: any) => u.id === bobId);
      expect(found).toBeDefined();
      expect(found.name).toBe('Bob Marley');
      expect(found.maskedPhone).toContain('•••');
      // Must not leak private data
      expect(found.email).toBeUndefined();
      expect(found.passwordHash).toBeUndefined();
      expect(found.phone).toBeUndefined();
    });

    it('excludes the requesting user from their own search results', async () => {
      const res = await request(app)
        .get('/api/users/search?q=Alice')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      const foundSelf = res.body.data.find((u: any) => u.id === aliceId);
      expect(foundSelf).toBeUndefined();
    });
  });

  describe('Loans & Pairwise Netting', () => {
    it('creates a loan linking a registered counterparty', async () => {
      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          friendName: 'Bob Marley',
          amount: '5000.00',
          dueDate: '2026-11-15',
          type: 'LENT',
          counterpartyUserId: bobId,
        });

      expect(res.status).toBe(201);
      expect(res.body.counterpartyUserId).toBe(bobId);
      expect(res.body.counterpartyUser).toBeDefined();
      expect(res.body.counterpartyUser.name).toBe('Bob Marley');
      expect(res.body.counterpartyUser.maskedPhone).toBeDefined();
    });

    it('rejects self-counterparty loan creation', async () => {
      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          friendName: 'Myself',
          amount: '1000.00',
          dueDate: '2026-11-15',
          type: 'LENT',
          counterpartyUserId: aliceId,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_COUNTERPARTY');
    });

    it('calculates pairwise net receivable when Lent > Borrowed between Alice and Bob', async () => {
      // Alice lent Bob 5000
      const loan1 = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          friendName: 'Bob Marley',
          amount: '5000.00',
          dueDate: '2026-11-15',
          type: 'LENT',
          counterpartyUserId: bobId,
        });

      // Alice borrowed 2000 from Bob
      await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          friendName: 'Bob Marley',
          amount: '2000.00',
          dueDate: '2026-11-20',
          type: 'BORROWED',
          counterpartyUserId: bobId,
        });

      // Inspect loan details
      const detailsRes = await request(app)
        .get(`/api/loans/${loan1.body.id}`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(detailsRes.status).toBe(200);
      expect(detailsRes.body.netting).toBeDefined();
      expect(detailsRes.body.netting.hasCounterparty).toBe(true);
      expect(detailsRes.body.netting.lentPrincipal).toBe('5000.00');
      expect(detailsRes.body.netting.borrowedPrincipal).toBe('2000.00');
      expect(detailsRes.body.netting.netStatus).toBe('RECEIVABLE');
      expect(detailsRes.body.netting.netAmount).toBe('3000.00');
      expect(detailsRes.body.netting.explanation).toContain('3000.00');

      // Original transactions remain untouched!
      expect(detailsRes.body.amount).toBe('5000.00');
      expect(detailsRes.body.isRepaid).toBe(false);
    });

    it('calculates pairwise net payable when Borrowed > Lent between Alice and Bob', async () => {
      // Alice lent Bob 1500
      const loan1 = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          friendName: 'Bob Marley',
          amount: '1500.00',
          dueDate: '2026-11-15',
          type: 'LENT',
          counterpartyUserId: bobId,
        });

      // Alice borrowed 4000 from Bob
      await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          friendName: 'Bob Marley',
          amount: '4000.00',
          dueDate: '2026-11-20',
          type: 'BORROWED',
          counterpartyUserId: bobId,
        });

      const detailsRes = await request(app)
        .get(`/api/loans/${loan1.body.id}`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(detailsRes.status).toBe(200);
      expect(detailsRes.body.netting.netStatus).toBe('PAYABLE');
      expect(detailsRes.body.netting.netAmount).toBe('2500.00');
      expect(detailsRes.body.netting.explanation).toContain('You owe');
    });

    it('reports Settled when Lent and Borrowed balances offset exactly', async () => {
      // Alice lent Bob 3000
      const loan1 = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          friendName: 'Bob Marley',
          amount: '3000.00',
          dueDate: '2026-11-15',
          type: 'LENT',
          counterpartyUserId: bobId,
        });

      // Alice borrowed 3000 from Bob
      await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          friendName: 'Bob Marley',
          amount: '3000.00',
          dueDate: '2026-11-20',
          type: 'BORROWED',
          counterpartyUserId: bobId,
        });

      const detailsRes = await request(app)
        .get(`/api/loans/${loan1.body.id}`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(detailsRes.status).toBe(200);
      expect(detailsRes.body.netting.netStatus).toBe('SETTLED');
      expect(detailsRes.body.netting.netAmount).toBe('0.00');
    });

    it('excludes repaid loans from pairwise netting calculations', async () => {
      // Alice lent Bob 5000
      const loan1 = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          friendName: 'Bob Marley',
          amount: '5000.00',
          dueDate: '2026-11-15',
          type: 'LENT',
          counterpartyUserId: bobId,
        });

      // Alice borrowed 2000 from Bob
      const loan2 = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          friendName: 'Bob Marley',
          amount: '2000.00',
          dueDate: '2026-11-20',
          type: 'BORROWED',
          counterpartyUserId: bobId,
        });

      // Mark the 2000 borrowed loan as repaid
      await request(app)
        .patch(`/api/loans/${loan2.body.id}/repay`)
        .set('Authorization', `Bearer ${aliceToken}`);

      // Now netting should reflect only the outstanding 5000 lent loan
      const detailsRes = await request(app)
        .get(`/api/loans/${loan1.body.id}`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(detailsRes.body.netting.lentPrincipal).toBe('5000.00');
      expect(detailsRes.body.netting.borrowedPrincipal).toBe('0.00');
      expect(detailsRes.body.netting.netStatus).toBe('RECEIVABLE');
      expect(detailsRes.body.netting.netAmount).toBe('5000.00');
    });

    it('does not calculate pairwise netting for external / unregistered counterparties', async () => {
      const loan = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          friendName: 'External Friend',
          amount: '1200.00',
          dueDate: '2026-11-15',
          type: 'LENT',
          counterpartyPhone: '+919988776655',
        });

      const detailsRes = await request(app)
        .get(`/api/loans/${loan.body.id}`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(detailsRes.status).toBe(200);
      expect(detailsRes.body.counterpartyUserId).toBeNull();
      expect(detailsRes.body.netting).toBeUndefined();
    });
  });
});
