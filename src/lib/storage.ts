import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";

const bucket = process.env.S3_BUCKET ?? "surplus-flooring-listings";

function getClient() {
  return new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: Boolean(process.env.S3_ENDPOINT), // needed for R2/MinIO
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    },
  });
}

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

/**
 * Returns a presigned PUT URL the browser can upload directly to, plus the
 * public URL the object will be reachable at afterwards. Keeps large image
 * uploads off our own server.
 */
export async function createPresignedUpload(opts: {
  folder: "listings" | "verification";
  contentType: string;
}) {
  if (!ALLOWED_CONTENT_TYPES.has(opts.contentType)) {
    throw new Error("Unsupported file type");
  }
  const ext = opts.contentType.split("/")[1];
  const key = `${opts.folder}/${nanoid(24)}.${ext}`;

  const client = getClient();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: opts.contentType,
  });
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });

  const publicBase = process.env.S3_PUBLIC_BASE_URL || `${process.env.S3_ENDPOINT}/${bucket}`;
  const publicUrl = `${publicBase.replace(/\/$/, "")}/${key}`;

  return { uploadUrl, publicUrl, key };
}

export async function deleteObjectByUrl(url: string) {
  const publicBase = process.env.S3_PUBLIC_BASE_URL || `${process.env.S3_ENDPOINT}/${bucket}`;
  const key = url.replace(`${publicBase.replace(/\/$/, "")}/`, "");
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export function isStorageConfigured() {
  return Boolean(process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY);
}
