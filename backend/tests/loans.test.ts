// Purpose: Integration test suite verifying loan CRUD operations, ownership access controls, decimal arithmetic, and summary totals.
// Imported by: none (test file executed by test runner)

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { config } from '../src/config/env.js';
import { formatDateOnly } from '../src/lib/date.js';

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

  // Test creating a valid loan
  it('POST /api/loans creates a new loan for authenticated user', async () => {
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
    expect(res.body.isRepaid).toBe(false);
    expect(res.body.repaidAt).toBeNull();

    // Verify loan is stored in database with correct ownership
    const dbLoan = await prisma.loan.findUnique({ where: { id: res.body.id } });
    expect(dbLoan?.userId).toBe(userAId);
  });

  // Test validation errors on loan creation
  it('POST /api/loans rejects invalid amounts, empty names, and malformed dates', async () => {
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
  });

  // Test user isolation when listing loans
  it('GET /api/loans returns only the authenticated user loans in newest-first order', async () => {
    // User A creates 2 loans
    await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ friendName: 'First Friend', amount: '500.00', dueDate: '2026-11-01' });

    await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ friendName: 'Second Friend', amount: '750.00', dueDate: '2026-11-15' });

    // User B creates 1 loan
    await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ friendName: 'User B Friend', amount: '2000.00', dueDate: '2026-12-01' });

    // User A lists loans
    const resA = await request(app)
      .get('/api/loans')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(resA.status).toBe(200);
    expect(resA.body.data.length).toBe(2);
    expect(resA.body.data[0].friendName).toBe('Second Friend'); // Newest first
    expect(resA.body.data[1].friendName).toBe('First Friend');

    // User B lists loans
    const resB = await request(app)
      .get('/api/loans')
      .set('Authorization', `Bearer ${userBToken}`);

    expect(resB.status).toBe(200);
    expect(resB.body.data.length).toBe(1);
    expect(resB.body.data[0].friendName).toBe('User B Friend');
  });

  // Test marking loan as repaid
  it('PATCH /api/loans/:id/repay marks an unpaid loan as repaid', async () => {
    const createRes = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ friendName: 'Rohan', amount: '600.00', dueDate: '2026-10-15' });

    const loanId = createRes.body.id;

    const repayRes = await request(app)
      .patch(`/api/loans/${loanId}/repay`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(repayRes.status).toBe(200);
    expect(repayRes.body.isRepaid).toBe(true);
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

  // Test summary calculations including overdue, repaid, and decimal precision
  it('GET /api/summary returns correct decimal-safe totals and overdue amounts', async () => {
    const pastDate = '2026-10-01'; // Definitely overdue
    const futureDate = '2026-12-31'; // Future due date

    // 1. Future unpaid loan: 1000.10
    await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ friendName: 'Friend 1', amount: '1000.10', dueDate: futureDate });

    // 2. Overdue unpaid loan: 500.20
    const overdueLoanRes = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ friendName: 'Friend 2', amount: '500.20', dueDate: pastDate });

    // 3. Loan that was repaid: 300.00
    const repaidLoanRes = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ friendName: 'Friend 3', amount: '300.00', dueDate: pastDate });

    await request(app)
      .patch(`/api/loans/${repaidLoanRes.body.id}/repay`)
      .set('Authorization', `Bearer ${userAToken}`);

    // Query summary
    const summaryRes = await request(app)
      .get('/api/summary')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(summaryRes.status).toBe(200);
    // Total lent: 1000.10 + 500.20 + 300.00 = 1800.30
    expect(summaryRes.body.totalLent).toBe('1800.30');
    // Total repaid: 300.00
    expect(summaryRes.body.totalRepaid).toBe('300.00');
    // Outstanding: 1800.30 - 300.00 = 1500.30
    expect(summaryRes.body.outstandingAmount).toBe('1500.30');
    // Overdue: Friend 2 is unpaid & past due = 500.20 (Friend 3 is past due but repaid, so excluded)
    expect(summaryRes.body.overdueAmount).toBe('500.20');

    // Mark the overdue loan as repaid and verify overdue amount updates to 0.00
    await request(app)
      .patch(`/api/loans/${overdueLoanRes.body.id}/repay`)
      .set('Authorization', `Bearer ${userAToken}`);

    const updatedSummaryRes = await request(app)
      .get('/api/summary')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(updatedSummaryRes.body.totalLent).toBe('1800.30');
    expect(updatedSummaryRes.body.totalRepaid).toBe('800.20');
    expect(updatedSummaryRes.body.outstandingAmount).toBe('1000.10');
    expect(updatedSummaryRes.body.overdueAmount).toBe('0.00');
  });

  // Test empty user returns all zeroes
  it('GET /api/summary returns 0.00 for user with no loans', async () => {
    const summaryRes = await request(app)
      .get('/api/summary')
      .set('Authorization', `Bearer ${userBToken}`);

    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body).toEqual({
      totalLent: '0.00',
      totalRepaid: '0.00',
      outstandingAmount: '0.00',
      overdueAmount: '0.00',
    });
  });
});
