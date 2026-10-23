// Purpose: Integration test suite for phone OTP authentication, rate limits, one-time consumption, and JWT protection.
// Imported by: vitest test runner (no source importers)

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import express, { Request, Response } from 'express';
import '../src/types/express.d.ts';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { hashOtp } from '../src/lib/crypto.js';
import { requireAuth } from '../src/middleware/auth.middleware.js';

describe('Auth Integration Tests', () => {
  const testPhone = '+919876543210';
  const secondaryPhone = '+919999988888';
  const testOtp = '123456';

  beforeEach(async () => {
    // Clean up test data for deterministic test runs
    await prisma.otpChallenge.deleteMany({ where: { phone: { in: [testPhone, secondaryPhone] } } });
    await prisma.loan.deleteMany({ where: { user: { phone: { in: [testPhone, secondaryPhone] } } } });
    await prisma.user.deleteMany({ where: { phone: { in: [testPhone, secondaryPhone] } } });
  });

  afterAll(async () => {
    // Clean up any remaining test records and disconnect Prisma client
    await prisma.otpChallenge.deleteMany({ where: { phone: { in: [testPhone, secondaryPhone] } } });
    await prisma.loan.deleteMany({ where: { user: { phone: { in: [testPhone, secondaryPhone] } } } });
    await prisma.user.deleteMany({ where: { phone: { in: [testPhone, secondaryPhone] } } });
    await prisma.$disconnect();
  });

  // Test send-otp endpoint generates challenge without exposing OTP in response
  it('POST /api/auth/send-otp creates challenge and does not return OTP in body', async () => {
    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({ phone: testPhone });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: 'If the phone number is valid, an OTP request was created.',
    });
    // Ensure OTP is not leaked in the response object
    expect(res.body.otp).toBeUndefined();

    // Verify challenge was created in database
    const challenge = await prisma.otpChallenge.findFirst({
      where: { phone: testPhone, consumedAt: null },
    });
    expect(challenge).not.toBeNull();
    expect(challenge?.phone).toBe(testPhone);
  });

  // Test invalid phone number rejection
  it('POST /api/auth/send-otp rejects invalid phone formats', async () => {
    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({ phone: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // Test successful OTP verification issues JWT and creates user
  it('POST /api/auth/verify-otp succeeds with correct OTP and issues JWT', async () => {
    // Seed an active challenge
    await prisma.otpChallenge.create({
      data: {
        phone: testPhone,
        codeHash: hashOtp(testPhone, testOtp),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: testPhone, otp: testOtp });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.phone).toBe(testPhone);

    // Verify challenge is marked consumed
    const updatedChallenge = await prisma.otpChallenge.findFirst({
      where: { phone: testPhone },
      orderBy: { createdAt: 'desc' },
    });
    expect(updatedChallenge?.consumedAt).not.toBeNull();

    // Verify user was persisted in database
    const user = await prisma.user.findUnique({
      where: { phone: testPhone },
    });
    expect(user).not.toBeNull();
    expect(user?.phone).toBe(testPhone);
  });

  // Test incorrect OTP rejection
  it('POST /api/auth/verify-otp rejects wrong OTP', async () => {
    await prisma.otpChallenge.create({
      data: {
        phone: testPhone,
        codeHash: hashOtp(testPhone, testOtp),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: testPhone, otp: '000000' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_OTP');

    // Verify attempt counter incremented
    const challenge = await prisma.otpChallenge.findFirst({
      where: { phone: testPhone },
    });
    expect(challenge?.attemptCount).toBe(1);
  });

  // Test expired OTP challenge rejection
  it('POST /api/auth/verify-otp rejects expired OTP', async () => {
    await prisma.otpChallenge.create({
      data: {
        phone: testPhone,
        codeHash: hashOtp(testPhone, testOtp),
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      },
    });

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: testPhone, otp: testOtp });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_OTP');
  });

  // Test one-time use policy: already-consumed OTP cannot be reused
  it('POST /api/auth/verify-otp prevents OTP reuse after consumption', async () => {
    await prisma.otpChallenge.create({
      data: {
        phone: testPhone,
        codeHash: hashOtp(testPhone, testOtp),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        consumedAt: new Date(), // Already consumed
      },
    });

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: testPhone, otp: testOtp });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_OTP');
  });

  // Test attempt limit enforcement
  it('POST /api/auth/verify-otp locks challenge after 3 failed attempts', async () => {
    await prisma.otpChallenge.create({
      data: {
        phone: testPhone,
        codeHash: hashOtp(testPhone, testOtp),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        attemptCount: 3, // Max attempts reached
      },
    });

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: testPhone, otp: testOtp });

    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('OTP_ATTEMPTS_EXCEEDED');
  });
});

describe('JWT Middleware Integration Tests', () => {
  const testApp = express();
  testApp.use(express.json());
  testApp.get('/api/test-protected', requireAuth, (req: Request, res: Response) => {
    res.json({ success: true, user: req.user });
  });

  // Test protected dummy route rejecting missing Bearer token
  it('rejects requests without Authorization header', async () => {
    const res = await request(testApp).get('/api/test-protected');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  // Test protected dummy route rejecting malformed or invalid token
  it('rejects requests with invalid JWT token', async () => {
    const res = await request(testApp)
      .get('/api/test-protected')
      .set('Authorization', 'Bearer invalid.token.value');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  // Test protected route accepting valid JWT token issued by verify-otp
  it('accepts requests with valid JWT and derives identity from token', async () => {
    const secondaryPhone = '+919999988888';
    const testOtp = '654321';

    await prisma.otpChallenge.create({
      data: {
        phone: secondaryPhone,
        codeHash: hashOtp(secondaryPhone, testOtp),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    const loginRes = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phone: secondaryPhone, otp: testOtp });

    const token = loginRes.body.token;

    const res = await request(testApp)
      .get('/api/test-protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.phone).toBe(secondaryPhone);
    expect(res.body.user.id).toBe(loginRes.body.user.id);
  });
});
