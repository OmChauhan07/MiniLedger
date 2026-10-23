// Purpose: Integration tests verifying cross-account visibility, participant-aware perspective inversion, bilateral netting, and access isolation.
// Imported by: vitest test runner

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { hashPassword } from '../src/lib/password.js';

describe('Registered-User Cross-Account Visibility & Mutual Relationships', () => {
  const alicePhone = '+919911122233';
  const bobPhone = '+919944455566';
  const charliePhone = '+919977788899';

  let aliceToken: string;
  let aliceId: string;
  let bobToken: string;
  let bobId: string;
  let charlieToken: string;
  let charlieId: string;

  beforeEach(async () => {
    const phones = [alicePhone, bobPhone, charliePhone];
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
        passwordHash: aliceHash,
        phoneVerifiedAt: new Date(),
      },
    });
    aliceId = alice.id;

    // Seed Bob
    const bobHash = await hashPassword('BobMarley123');
    const bob = await prisma.user.create({
      data: {
        phone: bobPhone,
        name: 'Bob Marley',
        passwordHash: bobHash,
        phoneVerifiedAt: new Date(),
      },
    });
    bobId = bob.id;

    // Seed Charlie (third-party unauthorized observer)
    const charlieHash = await hashPassword('CharlieChaplin123');
    const charlie = await prisma.user.create({
      data: {
        phone: charliePhone,
        name: 'Charlie Chaplin',
        passwordHash: charlieHash,
        phoneVerifiedAt: new Date(),
      },
    });
    charlieId = charlie.id;

    // Login Alice
    const aRes = await request(app).post('/api/auth/login').send({
      phone: alicePhone,
      password: 'AliceSecret123',
    });
    aliceToken = aRes.body.token;

    // Login Bob
    const bRes = await request(app).post('/api/auth/login').send({
      phone: bobPhone,
      password: 'BobMarley123',
    });
    bobToken = bRes.body.token;

    // Login Charlie
    const cRes = await request(app).post('/api/auth/login').send({
      phone: charliePhone,
      password: 'CharlieChaplin123',
    });
    charlieToken = cRes.body.token;
  });

  afterAll(async () => {
    const phones = [alicePhone, bobPhone, charliePhone];
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

  describe('Participant-Aware Perspective Inversion', () => {
    it('User A creates a Lent loan to User B: Alice sees Lent, Bob sees Borrowed from Alice', async () => {
      // 1. Alice creates LENT loan of ₹5,000 to Bob
      const createRes = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          friendName: 'Bob Marley',
          amount: '5000.00',
          dueDate: '2026-11-20',
          type: 'LENT',
          counterpartyUserId: bobId,
        });

      expect(createRes.status).toBe(201);
      const loanId = createRes.body.id;
      expect(createRes.body.type).toBe('LENT');
      expect(createRes.body.isCreator).toBe(true);
      expect(createRes.body.recordedByName).toBe('You');
      expect(createRes.body.counterpartyUser.id).toBe(bobId);

      // 2. Alice views the loan by ID
      const aliceView = await request(app)
        .get(`/api/loans/${loanId}`)
        .set('Authorization', `Bearer ${aliceToken}`);
      expect(aliceView.status).toBe(200);
      expect(aliceView.body.type).toBe('LENT');
      expect(aliceView.body.friendName).toBe('Bob Marley');
      expect(aliceView.body.isCreator).toBe(true);

      // 3. Bob views the exact same loan by ID
      const bobView = await request(app)
        .get(`/api/loans/${loanId}`)
        .set('Authorization', `Bearer ${bobToken}`);
      expect(bobView.status).toBe(200);
      expect(bobView.body.id).toBe(loanId);
      // Bob must see it as BORROWED
      expect(bobView.body.type).toBe('BORROWED');
      // Bob sees counterparty is Alice
      expect(bobView.body.friendName).toBe('Alice Cooper');
      expect(bobView.body.counterpartyUser.id).toBe(aliceId);
      expect(bobView.body.isCreator).toBe(false);
      expect(bobView.body.recordedByName).toBe('Alice Cooper');

      // 4. Bob lists his loans with type=BORROWED
      const bobList = await request(app)
        .get('/api/loans?type=BORROWED')
        .set('Authorization', `Bearer ${bobToken}`);
      expect(bobList.status).toBe(200);
      const found = bobList.body.data.find((l: any) => l.id === loanId);
      expect(found).toBeDefined();
      expect(found.type).toBe('BORROWED');
      expect(found.friendName).toBe('Alice Cooper');

      // 5. Bob summary includes the ₹5,000 in Borrowed totals
      const bobSummary = await request(app)
        .get('/api/summary')
        .set('Authorization', `Bearer ${bobToken}`);
      expect(bobSummary.status).toBe(200);
      expect(bobSummary.body.outstandingBorrowed).toBe('5000.00');
      expect(bobSummary.body.totalBorrowed).toBe('5000.00');
      expect(bobSummary.body.netStatus).toBe('PAYABLE');
      expect(bobSummary.body.netPayable).toBe('5000.00');
    });

    it('User A creates a Borrowed loan from User B: Alice sees Borrowed, Bob sees Lent', async () => {
      // Alice records that she borrowed ₹3,000 from Bob
      const createRes = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          friendName: 'Bob Marley',
          amount: '3000.00',
          dueDate: '2026-11-25',
          type: 'BORROWED',
          counterpartyUserId: bobId,
        });

      expect(createRes.status).toBe(201);
      const loanId = createRes.body.id;

      // Alice sees Borrowed
      const aliceView = await request(app)
        .get(`/api/loans/${loanId}`)
        .set('Authorization', `Bearer ${aliceToken}`);
      expect(aliceView.body.type).toBe('BORROWED');
      expect(aliceView.body.isCreator).toBe(true);

      // Bob sees Lent (Alice owes Bob ₹3,000)
      const bobView = await request(app)
        .get(`/api/loans/${loanId}`)
        .set('Authorization', `Bearer ${bobToken}`);
      expect(bobView.body.type).toBe('LENT');
      expect(bobView.body.friendName).toBe('Alice Cooper');
      expect(bobView.body.isCreator).toBe(false);

      // Bob summary reflects Lent receivable
      const bobSummary = await request(app)
        .get('/api/summary')
        .set('Authorization', `Bearer ${bobToken}`);
      expect(bobSummary.body.outstandingLent).toBe('3000.00');
      expect(bobSummary.body.netStatus).toBe('RECEIVABLE');
      expect(bobSummary.body.netReceivable).toBe('3000.00');
    });
  });

  describe('Access Isolation & Unauthorized Protection', () => {
    it('User C cannot view or list loans involving only Alice and Bob', async () => {
      // Alice creates loan with Bob
      const loan = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          friendName: 'Bob Marley',
          amount: '2500.00',
          dueDate: '2026-12-01',
          type: 'LENT',
          counterpartyUserId: bobId,
        });

      // Charlie tries to fetch it by ID -> 404 Not Found
      const charlieView = await request(app)
        .get(`/api/loans/${loan.body.id}`)
        .set('Authorization', `Bearer ${charlieToken}`);
      expect(charlieView.status).toBe(404);

      // Charlie lists loans -> empty list
      const charlieList = await request(app)
        .get('/api/loans')
        .set('Authorization', `Bearer ${charlieToken}`);
      expect(charlieList.body.data).toHaveLength(0);

      // Charlie tries to repay it -> 404 Not Found
      const charlieRepay = await request(app)
        .patch(`/api/loans/${loan.body.id}/repay`)
        .set('Authorization', `Bearer ${charlieToken}`);
      expect(charlieRepay.status).toBe(404);
    });

    it('external-counterparty records never appear in another registered account', async () => {
      // Alice creates external loan with friendName "Bob Marley" without counterpartyUserId
      const extLoan = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          friendName: 'Bob Marley',
          amount: '4000.00',
          dueDate: '2026-12-10',
          type: 'LENT',
          counterpartyPhone: '+919988776655',
        });

      // Bob checks his loans -> extLoan is not in Bob's ledger
      const bobList = await request(app)
        .get('/api/loans')
        .set('Authorization', `Bearer ${bobToken}`);
      const found = bobList.body.data.find((l: any) => l.id === extLoan.body.id);
      expect(found).toBeUndefined();

      // Bob tries to access extLoan by ID -> 404
      const bobView = await request(app)
        .get(`/api/loans/${extLoan.body.id}`)
        .set('Authorization', `Bearer ${bobToken}`);
      expect(bobView.status).toBe(404);
    });
  });

  describe('Shared Repayment & Status Synchronization', () => {
    it('repayment by counterparty updates the authoritative loan for both participants', async () => {
      // Alice lends ₹1,500 to Bob
      const loan = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          friendName: 'Bob Marley',
          amount: '1500.00',
          dueDate: '2026-11-10',
          type: 'LENT',
          counterpartyUserId: bobId,
        });

      // Bob confirms payment and marks loan repaid
      const repayRes = await request(app)
        .patch(`/api/loans/${loan.body.id}/repay`)
        .set('Authorization', `Bearer ${bobToken}`);
      expect(repayRes.status).toBe(200);
      expect(repayRes.body.isRepaid).toBe(true);

      // Alice immediately sees the loan as repaid
      const aliceView = await request(app)
        .get(`/api/loans/${loan.body.id}`)
        .set('Authorization', `Bearer ${aliceToken}`);
      expect(aliceView.body.isRepaid).toBe(true);
      expect(aliceView.body.repaidAt).not.toBeNull();

      // Alice's summary no longer counts it as outstanding
      const aliceSummary = await request(app)
        .get('/api/summary')
        .set('Authorization', `Bearer ${aliceToken}`);
      expect(aliceSummary.body.outstandingLent).toBe('0.00');
      expect(aliceSummary.body.totalRepaidLent).toBe('1500.00');
    });
  });

  describe('Bilateral Pairwise Netting Across Independent Creators', () => {
    it('correctly nets loans when Alice lent to Bob AND Bob lent to Alice', async () => {
      // 1. Alice creates LENT ₹5,000 to Bob (Bob owes Alice ₹5,000)
      await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          friendName: 'Bob Marley',
          amount: '5000.00',
          dueDate: '2026-11-15',
          type: 'LENT',
          counterpartyUserId: bobId,
        });

      // 2. Bob separately creates LENT ₹2,000 to Alice (Alice owes Bob ₹2,000)
      await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({
          friendName: 'Alice Cooper',
          amount: '2000.00',
          dueDate: '2026-11-20',
          type: 'LENT',
          counterpartyUserId: aliceId,
        });

      // 3. Check Alice's relationship view with Bob:
      // Alice lent ₹5,000, borrowed ₹2,000 -> Net Receivable ₹3,000
      const aRel = await request(app)
        .get(`/api/users/${bobId}/relationship`)
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(aRel.status).toBe(200);
      expect(aRel.body.counterparty.id).toBe(bobId);
      expect(aRel.body.netting.lentPrincipal).toBe('5000.00');
      expect(aRel.body.netting.borrowedPrincipal).toBe('2000.00');
      expect(aRel.body.netting.netStatus).toBe('RECEIVABLE');
      expect(aRel.body.netting.netAmount).toBe('3000.00');
      expect(aRel.body.loans).toHaveLength(2);

      // 4. Check Bob's relationship view with Alice:
      // Bob lent ₹2,000, borrowed ₹5,000 -> Net Payable ₹3,000
      const bRel = await request(app)
        .get(`/api/users/${aliceId}/relationship`)
        .set('Authorization', `Bearer ${bobToken}`);

      expect(bRel.status).toBe(200);
      expect(bRel.body.counterparty.id).toBe(aliceId);
      expect(bRel.body.netting.lentPrincipal).toBe('2000.00');
      expect(bRel.body.netting.borrowedPrincipal).toBe('5000.00');
      expect(bRel.body.netting.netStatus).toBe('PAYABLE');
      expect(bRel.body.netting.netAmount).toBe('3000.00');
      expect(bRel.body.loans).toHaveLength(2);
    });

    it('rejects relationship query with own user account', async () => {
      const res = await request(app)
        .get(`/api/users/${aliceId}/relationship`)
        .set('Authorization', `Bearer ${aliceToken}`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_COUNTERPARTY');
    });

    it('returns 404 for non-existent counterparty ID', async () => {
      const res = await request(app)
        .get('/api/users/non-existent-user-id/relationship')
        .set('Authorization', `Bearer ${aliceToken}`);
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('COUNTERPARTY_NOT_FOUND');
    });
  });
});
