// Purpose: Neon Object Storage client using AWS S3 SDK with path-style addressing for bucket asset management.
// Imported by: src/routes/health.routes.ts, tests/storage.test.ts

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config/env.js';

// Initializes the S3 client for Neon Object Storage with required path-style addressing
export const s3Client = new S3Client({
  endpoint: config.AWS_ENDPOINT_URL_S3,
  region: config.AWS_REGION,
  credentials:
    config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: config.AWS_ACCESS_KEY_ID,
          secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
  forcePathStyle: true, // required by Neon Object Storage
});

export const STORAGE_BUCKET = config.NEON_STORAGE_BUCKET;

// Uploads a file or data buffer to the Neon Object Storage bucket
export async function uploadObject(
  key: string,
  data: Buffer | Uint8Array | string,
  contentType: string = 'application/octet-stream'
): Promise<void> {
  const body = typeof data === 'string' ? Buffer.from(data) : data;
  await s3Client.send(
    new PutObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

// Retrieves an object's contents as a Buffer from the Neon Object Storage bucket
export async function downloadObject(key: string): Promise<Buffer> {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: key,
    })
  );

  const stream = response.Body;
  if (!stream) {
    throw new Error(`Object body is empty for key: ${key}`);
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of stream as any) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Lists object keys in the Neon Object Storage bucket with an optional prefix
export async function listBucketObjects(prefix?: string): Promise<string[]> {
  const response = await s3Client.send(
    new ListObjectsV2Command({
      Bucket: STORAGE_BUCKET,
      Prefix: prefix,
    })
  );
  return (response.Contents || []).map((item) => item.Key || '').filter(Boolean);
}

// Deletes an object from the Neon Object Storage bucket
export async function deleteBucketObject(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: key,
    })
  );
}

// Tests and verifies connectivity to the Neon Object Storage service
export async function testStorageConnection(): Promise<{ ok: boolean; bucket: string; count: number }> {
  const response = await s3Client.send(
    new ListObjectsV2Command({
      Bucket: STORAGE_BUCKET,
      MaxKeys: 1,
    })
  );
  return {
    ok: true,
    bucket: STORAGE_BUCKET,
    count: response.KeyCount ?? 0,
  };
}

export type SupportedImageFormat = 'jpeg' | 'png' | 'webp';

/**
 * Validates image buffers against cryptographic magic bytes to prevent file spoofing.
 * Supports JPEG, PNG, and WebP.
 */
export function detectImageFormat(buffer: Buffer): SupportedImageFormat | null {
  if (buffer.length < 12) return null;

  // JPEG: 0xFF 0xD8 0xFF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpeg';
  }

  // PNG: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'png';
  }

  // WebP: RIFF .... WEBP
  if (
    buffer.slice(0, 4).toString('ascii') === 'RIFF' &&
    buffer.slice(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'webp';
  }

  return null;
}

/**
 * Generates a short-lived private signed URL for secure image viewing.
 */
export async function getSignedAvatarUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: STORAGE_BUCKET,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Safely deletes an object without throwing if it does not exist.
 */
export async function deleteBucketObjectSafely(key: string): Promise<void> {
  try {
    await deleteBucketObject(key);
  } catch (err: any) {
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
      return;
    }
    console.warn('Failed to delete object from bucket:', err.message);
  }
}

/**
 * Retrieves an object alongside its Content-Type for streaming responses.
 */
export async function getObjectWithMetadata(key: string): Promise<{ buffer: Buffer; contentType: string }> {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: key,
    })
  );

  const stream = response.Body;
  if (!stream) {
    throw new Error(`Object body is empty for key: ${key}`);
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of stream as any) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return {
    buffer: Buffer.concat(chunks),
    contentType: response.ContentType || 'image/jpeg',
  };
}
