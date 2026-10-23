// Purpose: Integration test suite verifying loan CRUD operations, direction handling (LENT vs BORROWED), ownership access controls, decimal arithmetic, and summary totals.
// Imported by: none (test file executed by test runner)

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { config } from '../src/config/env.js';

describe('Loan and Summary API Integration Tests', () => {
  let userAToken: string;
  let userBToken: string;
  let userAId: string;
  let userBId: string;

  const phoneA = '+919111111111';
  const phoneB = '+919222222222';

  beforeEach(async () => {
    // Clean up test data for users A and B
    await prisma.loan.deleteMany({
      where: {
        user: { phone: { in: [phoneA, phoneB] } },
      },
    });
    await prisma.user.deleteMany({
      where: { phone: { in: [phoneA, phoneB] } },
    });

    // Create User A and User B
    const userA = await prisma.user.create({ data: { phone: phoneA } });
    const userB = await prisma.user.create({ data: { phone: phoneB } });

    userAId = userA.id;
    userBId = userB.id;

    // Issue valid JWT tokens for both users
    userAToken = jwt.sign({ userId: userA.id, phone: userA.phone }, config.JWT_SECRET);
    userBToken = jwt.sign({ userId: userB.id, phone: userB.phone }, config.JWT_SECRET);
  });

  // Test creating a valid loan with default direction
  it('POST /api/loans creates a new loan for authenticated user and defaults type to LENT', async () => {
    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        friendName: 'Aarav Sharma',
        amount: '1500.50',
        dueDate: '2026-12-31',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.friendName).toBe('Aarav Sharma');
    expect(res.body.amount).toBe('1500.50');
    expect(res.body.dueDate).toBe('2026-12-31');
    expect(res.body.type).toBe('LENT');
    expect(res.body.isRepaid).toBe(false);
    expect(res.body.repaidAt).toBeNull();

    // Verify loan is stored in database with correct ownership and type
    const dbLoan = await prisma.loan.findUnique({ where: { id: res.body.id } });
    expect(dbLoan?.userId).toBe(userAId);
    expect(dbLoan?.type).toBe('LENT');
  });

  // Test creating a BORROWED loan
  it('POST /api/loans creates a BORROWED loan when type is explicitly specified', async () => {
    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        friendName: 'Bank of Amit',
        amount: '5000.00',
        dueDate: '2026-11-20',
        type: 'BORROWED',
      });

    expect(res.status).toBe(201);
    expect(res.body.friendName).toBe('Bank of Amit');
    expect(res.body.amount).toBe('5000.00');
    expect(res.body.type).toBe('BORROWED');

    const dbLoan = await prisma.loan.findUnique({ where: { id: res.body.id } });
    expect(dbLoan?.type).toBe('BORROWED');
  });

  // Test validation errors on loan creation
  it('POST /api/loans rejects invalid amounts, empty names, malformed dates, and invalid types', async () => {
    // Empty name
    const emptyNameRes = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ friendName: '   ', amount: '100.00', dueDate: '2026-12-31' });
    expect(emptyNameRes.status).toBe(400);

    // Negative amount
    const negAmountRes = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ friendName: 'Rahul', amount: '-50.00', dueDate: '2026-12-31' });
    expect(negAmountRes.status).toBe(400);

    // Excessive decimal places (>2)
    const excessDecRes = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ friendName: 'Rahul', amount: '100.123', dueDate: '2026-12-31' });
    expect(excessDecRes.status).toBe(400);

    // Invalid date format
    const badDateRes = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ friendName: 'Rahul', amount: '100.00', dueDate: '31-12-2026' });
    expect(badDateRes.status).toBe(400);

    // Invalid type
    const badTypeRes = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ friendName: 'Rahul', amount: '100.00', dueDate: '2026-12-31', type: 'INVALID' });
    expect(badTypeRes.status).toBe(400);
  });

  // Test single loan detail endpoint and ownership protection
  it('GET /api/loans/:id returns loan details for owner and 404 for other users', async () => {
    const createRes = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ friendName: 'Confidential Lender', amount: '1200.00', dueDate: '2026-12-15', type: 'BORROWED' });

    const loanId = createRes.body.id;

    // Owner gets 200 with details
    const ownerRes = await request(app)
      .get(`/api/loans/${loanId}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(ownerRes.status).toBe(200);
    expect(ownerRes.body.id).toBe(loanId);
    expect(ownerRes.body.type).toBe('BORROWED');
    expect(ownerRes.body.amount).toBe('1200.00');

    // Other user gets 404
    const otherRes = await request(app)
      .get(`/api/loans/${loanId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(otherRes.status).toBe(404);
  });

  // Test user isolation and filtering when listing loans
  it('GET /api/loans returns only the authenticated user loans and supports filtering by type and search', async () => {
    // User A creates 1 LENT loan and 1 BORROWED loan
    await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ friendName: 'Kavita LENT', amount: '500.00', dueDate: '2026-11-01', type: 'LENT' });

    await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ friendName: 'Suresh BORROWED', amount: '750.00', dueDate: '2026-11-15', type: 'BORROWED' });

    // User B creates 1 loan
    await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ friendName: 'User B Friend', amount: '2000.00', dueDate: '2026-12-01' });

    // User A lists all loans (default)
    const allResA = await request(app)
      .get('/api/loans')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(allResA.status).toBe(200);
    expect(allResA.body.data.length).toBe(2);

    // User A filters by type=LENT
    const lentRes = await request(app)
      .get('/api/loans?type=LENT')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(lentRes.status).toBe(200);
    expect(lentRes.body.data.length).toBe(1);
    expect(lentRes.body.data[0].friendName).toBe('Kavita LENT');

    // User A filters by type=BORROWED
    const borrowedRes = await request(app)
      .get('/api/loans?type=BORROWED')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(borrowedRes.status).toBe(200);
    expect(borrowedRes.body.data.length).toBe(1);
    expect(borrowedRes.body.data[0].friendName).toBe('Suresh BORROWED');

    // User A filters by search query
    const searchRes = await request(app)
      .get('/api/loans?search=Kavita')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.length).toBe(1);
    expect(searchRes.body.data[0].friendName).toBe('Kavita LENT');
  });

  // Test marking borrowed loan as repaid
  it('PATCH /api/loans/:id/repay marks an unpaid BORROWED loan as repaid', async () => {
    const createRes = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ friendName: 'Lender Mohan', amount: '600.00', dueDate: '2026-10-15', type: 'BORROWED' });

    const loanId = createRes.body.id;

    const repayRes = await request(app)
      .patch(`/api/loans/${loanId}/repay`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(repayRes.status).toBe(200);
    expect(repayRes.body.isRepaid).toBe(true);
    expect(repayRes.body.type).toBe('BORROWED');
    expect(repayRes.body.repaidAt).not.toBeNull();

    // Verify in database
    const dbLoan = await prisma.loan.findUnique({ where: { id: loanId } });
    expect(dbLoan?.isRepaid).toBe(true);
    expect(dbLoan?.repaidAt).not.toBeNull();
  });

  // Test repeat repayment returns 409 conflict
  it('PATCH /api/loans/:id/repay rejects duplicate repayment with 409 LOAN_ALREADY_REPAID', async () => {
    const createRes = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ friendName: 'Rohan', amount: '600.00', dueDate: '2026-10-15' });

    const loanId = createRes.body.id;

    // First repayment succeeds
    await request(app)
      .patch(`/api/loans/${loanId}/repay`)
      .set('Authorization', `Bearer ${userAToken}`);

    // Second repayment must return 409 conflict
    const secondRepayRes = await request(app)
      .patch(`/api/loans/${loanId}/repay`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(secondRepayRes.status).toBe(409);
    expect(secondRepayRes.body.error.code).toBe('LOAN_ALREADY_REPAID');
  });

  // Test cross-user repayment protection
  it('PATCH /api/loans/:id/repay returns 404 when User B attempts to repay User A loan', async () => {
    const createRes = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ friendName: 'User A Secret Friend', amount: '900.00', dueDate: '2026-10-20' });

    const loanId = createRes.body.id;

    // User B attempts to repay User A's loan
    const repayRes = await request(app)
      .patch(`/api/loans/${loanId}/repay`)
      .set('Authorization', `Bearer ${userBToken}`);

    // Must return 404 and not leak whether loanId exists
    expect(repayRes.status).toBe(404);
    expect(repayRes.body.error.code).toBe('NOT_FOUND');

    // Confirm loan remains unpaid
    const dbLoan = await prisma.loan.findUnique({ where: { id: loanId } });
    expect(dbLoan?.isRepaid).toBe(false);
  });

  // Test summary calculations including separate Lent and Borrowed metrics
  it('GET /api/summary returns correct decimal-safe totals for both LENT and BORROWED', async () => {
    const pastDate = '2026-10-01'; // Overdue
    const futureDate = '2026-12-31'; // Future

    // 1. Future unpaid LENT loan: 1000.10
    await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ friendName: 'Friend 1', amount: '1000.10', dueDate: futureDate, type: 'LENT' });

    // 2. Overdue unpaid LENT loan: 500.20
    await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ friendName: 'Friend 2', amount: '500.20', dueDate: pastDate, type: 'LENT' });

    // 3. Repaid LENT loan: 300.00
    const repaidLentRes = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ friendName: 'Friend 3', amount: '300.00', dueDate: pastDate, type: 'LENT' });

    await request(app)
      .patch(`/api/loans/${repaidLentRes.body.id}/repay`)
      .set('Authorization', `Bearer ${userAToken}`);

    // 4. Future unpaid BORROWED loan: 2000.00
    await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ friendName: 'Lender 1', amount: '2000.00', dueDate: futureDate, type: 'BORROWED' });

    // 5. Overdue unpaid BORROWED loan: 800.50
    const overdueBorrowedRes = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ friendName: 'Lender 2', amount: '800.50', dueDate: pastDate, type: 'BORROWED' });

    // 6. Repaid BORROWED loan: 400.00
    const repaidBorrowedRes = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ friendName: 'Lender 3', amount: '400.00', dueDate: pastDate, type: 'BORROWED' });

    await request(app)
      .patch(`/api/loans/${repaidBorrowedRes.body.id}/repay`)
      .set('Authorization', `Bearer ${userAToken}`);

    // Query summary
    const summaryRes = await request(app)
      .get('/api/summary')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(summaryRes.status).toBe(200);

    // Lent Totals
    // Total lent: 1000.10 + 500.20 + 300.00 = 1800.30
    expect(summaryRes.body.totalLent).toBe('1800.30');
    // Total repaid lent: 300.00
    expect(summaryRes.body.totalRepaidLent).toBe('300.00');
    // Outstanding lent: 1800.30 - 300.00 = 1500.30
    expect(summaryRes.body.outstandingLent).toBe('1500.30');
    // Overdue receivable: 500.20
    expect(summaryRes.body.overdueReceivable).toBe('500.20');

    // Borrowed Totals
    // Total borrowed: 2000.00 + 800.50 + 400.00 = 3200.50
    expect(summaryRes.body.totalBorrowed).toBe('3200.50');
    // Total repaid borrowed: 400.00
    expect(summaryRes.body.totalRepaidBorrowed).toBe('400.00');
    // Outstanding borrowed: 3200.50 - 400.00 = 2800.50
    expect(summaryRes.body.outstandingBorrowed).toBe('2800.50');
    // Overdue payable: 800.50
    expect(summaryRes.body.overduePayable).toBe('800.50');

    // Backward-compatible fields
    expect(summaryRes.body.totalRepaid).toBe('300.00');
    expect(summaryRes.body.outstandingAmount).toBe('1500.30');
    expect(summaryRes.body.overdueAmount).toBe('500.20');
  });

  // Test empty user returns all zeroes
  it('GET /api/summary returns 0.00 for user with no loans', async () => {
    const summaryRes = await request(app)
      .get('/api/summary')
      .set('Authorization', `Bearer ${userBToken}`);

    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.totalLent).toBe('0.00');
    expect(summaryRes.body.totalBorrowed).toBe('0.00');
    expect(summaryRes.body.outstandingLent).toBe('0.00');
    expect(summaryRes.body.outstandingBorrowed).toBe('0.00');
    expect(summaryRes.body.overdueReceivable).toBe('0.00');
    expect(summaryRes.body.overduePayable).toBe('0.00');
  });
});
