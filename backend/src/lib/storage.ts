// Purpose: Neon Object Storage client using AWS S3 SDK with path-style addressing for bucket asset management.
// Imported by: src/routes/health.routes.ts, tests/storage.test.ts

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
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
