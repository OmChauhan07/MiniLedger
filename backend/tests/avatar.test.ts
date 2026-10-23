// Purpose: Integration test verifying profile image upload, validation, deletion, and cross-account isolation.
// Imported by: Vitest test runner

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { hashPassword } from '../src/lib/password.js';
import { config } from '../src/config/env.js';

describe('Profile Avatar Upload & Management Integration Tests', () => {
  let userAToken: string;
  let userAId: string;
  const userAPhone = '+919888811111';

  let userBToken: string;
  let userBId: string;
  const userBPhone = '+919888822222';

  // Sample valid 1x1 pixel image buffers with genuine magic bytes
  const validJpeg = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
    0x00, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01,
    0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
    0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff,
    0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0xbf, 0x80, 0xff,
    0xd9,
  ]);

  const validPng = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);

  const validWebp = Buffer.from([
    0x52, 0x49, 0x46, 0x46, 0x1a, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    0x56, 0x50, 0x38, 0x4c, 0x0e, 0x00, 0x00, 0x00, 0x2f, 0x00, 0x00, 0x00,
    0x00, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);

  const invalidFakeImage = Buffer.from('This is not an image file content at all!');

  beforeAll(async () => {
    await prisma.$connect();

    // Clean up test users
    await prisma.loan.deleteMany({
      where: {
        OR: [
          { user: { phone: { in: [userAPhone, userBPhone] } } },
          { counterpartyUser: { phone: { in: [userAPhone, userBPhone] } } },
        ],
      },
    });
    await prisma.otpChallenge.deleteMany({
      where: { phone: { in: [userAPhone, userBPhone] } },
    });
    await prisma.user.deleteMany({
      where: { phone: { in: [userAPhone, userBPhone] } },
    });

    // Seed User A
    const passwordHash = await hashPassword('Password123!');
    const userA = await prisma.user.create({
      data: {
        phone: userAPhone,
        passwordHash,
        name: 'Alice Avatar',
        phoneVerifiedAt: new Date(),
      },
    });
    userAId = userA.id;
    userAToken = jwt.sign(
      { userId: userA.id, phone: userA.phone },
      config.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Seed User B
    const userB = await prisma.user.create({
      data: {
        phone: userBPhone,
        passwordHash,
        name: 'Bob Avatar',
        phoneVerifiedAt: new Date(),
      },
    });
    userBId = userB.id;
    userBToken = jwt.sign(
      { userId: userB.id, phone: userB.phone },
      config.JWT_SECRET,
      { expiresIn: '1d' }
    );
  });

  afterAll(async () => {
    await prisma.loan.deleteMany({
      where: {
        OR: [
          { user: { phone: { in: [userAPhone, userBPhone] } } },
          { counterpartyUser: { phone: { in: [userAPhone, userBPhone] } } },
        ],
      },
    });
    await prisma.otpChallenge.deleteMany({
      where: { phone: { in: [userAPhone, userBPhone] } },
    });
    await prisma.user.deleteMany({
      where: { phone: { in: [userAPhone, userBPhone] } },
    });
  });

  describe('1. Security & Validation Controls', () => {
    it('rejects unauthenticated avatar upload with 401', async () => {
      const res = await request(app)
        .post('/api/account/avatar')
        .set('Content-Type', 'image/jpeg')
        .send(validJpeg);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects empty or missing payload with 400', async () => {
      const res = await request(app)
        .post('/api/account/avatar')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MISSING_IMAGE_PAYLOAD');
    });

    it('rejects invalid/spoofed file content with 400 INVALID_IMAGE_FORMAT', async () => {
      const res = await request(app)
        .post('/api/account/avatar')
        .set('Authorization', `Bearer ${userAToken}`)
        .set('Content-Type', 'image/jpeg')
        .send(invalidFakeImage);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_IMAGE_FORMAT');
    });

    it('rejects oversized uploads exceeding 5MB limit', async () => {
      // Create a 6MB dummy buffer with JPEG header
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024);
      largeBuffer[0] = 0xff;
      largeBuffer[1] = 0xd8;
      largeBuffer[2] = 0xff;

      const res = await request(app)
        .post('/api/account/avatar')
        .set('Authorization', `Bearer ${userAToken}`)
        .set('Content-Type', 'image/jpeg')
        .send(largeBuffer);

      expect([400, 413]).toContain(res.status);
    });
  });

  describe('2. Authenticated Upload & Formats Support', () => {
    it('uploads valid JPEG via binary buffer and sets avatarUrl', async () => {
      const res = await request(app)
        .post('/api/account/avatar')
        .set('Authorization', `Bearer ${userAToken}`)
        .set('Content-Type', 'image/jpeg')
        .send(validJpeg);

      expect(res.status).toBe(200);
      expect(res.body.user.hasAvatar).toBe(true);
      expect(res.body.avatarUrl).toBeDefined();

      // Verify DB persistence
      const user = await prisma.user.findUnique({ where: { id: userAId } });
      expect(user?.avatarKey).toBeTruthy();
      expect(user?.avatarKey).toContain(`avatars/${userAId}/`);
    });

    it('uploads valid PNG via JSON base64 payload', async () => {
      const base64Png = validPng.toString('base64');
      const res = await request(app)
        .post('/api/account/avatar')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          imageBase64: base64Png,
          mimeType: 'image/png',
        });

      expect(res.status).toBe(200);
      expect(res.body.user.hasAvatar).toBe(true);
      expect(res.body.avatarUrl).toBeDefined();

      const user = await prisma.user.findUnique({ where: { id: userAId } });
      expect(user?.avatarKey).toContain('.png');
    });

    it('uploads valid WebP image and replaces previous avatar', async () => {
      const res = await request(app)
        .post('/api/account/avatar')
        .set('Authorization', `Bearer ${userAToken}`)
        .set('Content-Type', 'image/webp')
        .send(validWebp);

      expect(res.status).toBe(200);
      expect(res.body.user.hasAvatar).toBe(true);
      expect(res.body.avatarUrl).toBeDefined();

      const user = await prisma.user.findUnique({ where: { id: userAId } });
      expect(user?.avatarKey).toContain('.webp');
    });
  });

  describe('3. Profile Retrieval, Search & Persistence After Login', () => {
    it('returns avatarUrl on GET /api/account', async () => {
      const res = await request(app)
        .get('/api/account')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.hasAvatar).toBe(true);
      expect(res.body.user.avatarUrl).toBeDefined();
    });

    it('returns avatarUrl when searching registered users', async () => {
      const res = await request(app)
        .get('/api/users/search?q=Alice')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
      const alice = res.body.data.find((u: any) => u.id === userAId);
      expect(alice).toBeDefined();
      expect(alice.avatarUrl).toBeDefined();
    });

    it('persists avatarUrl across a fresh login', async () => {
      const loginRes = await request(app).post('/api/auth/login').send({
        phone: userAPhone,
        password: 'Password123!',
      });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.user.hasAvatar).toBe(true);
      expect(loginRes.body.user.avatarUrl).toBeDefined();
    });

    it('provides direct avatar streaming via GET /api/account/avatar', async () => {
      const res = await request(app)
        .get('/api/account/avatar')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('image/webp');
      expect(res.body).toBeDefined();
    });

    it('allows registered counterparties to view avatar via GET /api/users/:id/avatar', async () => {
      const res = await request(app)
        .get(`/api/users/${userAId}/avatar`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('image/webp');
    });
  });

  describe('4. Deletion & Reversion to Default Avatar', () => {
    it('DELETE /api/account/avatar removes avatar and resets to default initials state', async () => {
      const res = await request(app)
        .delete('/api/account/avatar')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.hasAvatar).toBe(false);
      expect(res.body.user.avatarUrl).toBeNull();

      // Verify DB
      const user = await prisma.user.findUnique({ where: { id: userAId } });
      expect(user?.avatarKey).toBeNull();

      // Verify GET /api/account/avatar returns 404
      const getRes = await request(app)
        .get('/api/account/avatar')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(getRes.status).toBe(404);
      expect(getRes.body.error.code).toBe('AVATAR_NOT_FOUND');
    });

    it('User B with no avatar receives valid default avatar state', async () => {
      const res = await request(app)
        .get('/api/account')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.hasAvatar).toBe(false);
      expect(res.body.user.avatarUrl).toBeNull();
    });
  });
});
