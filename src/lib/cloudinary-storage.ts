import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import { Binary } from "mongodb";

export type CloudinaryStorage = {
  provider: "cloudinary";
  publicId: string;
  resourceType: "image" | "video" | "raw";
  deliveryType: "authenticated";
  format: string;
};
export type StoredMedia = { storage: CloudinaryStorage };
function client() {
  const value = process.env.CLOUDINARY_URL;
  if (!value) throw new Error("Cloudinary storage is not configured.");
  const url = new URL(value);
  if (
    url.protocol !== "cloudinary:" ||
    !url.hostname ||
    !url.username ||
    !url.password
  )
    throw new Error("Cloudinary storage is not configured.");
  cloudinary.config({
    cloud_name: url.hostname,
    api_key: decodeURIComponent(url.username),
    api_secret: decodeURIComponent(url.password),
    secure: true,
  });
  return cloudinary;
}
export async function storeMedia(
  bytes: Uint8Array,
  name: string,
  type: string,
): Promise<StoredMedia> {
  const resourceType = type.startsWith("image/")
    ? "image"
    : type.startsWith("video/") || type.startsWith("audio/")
      ? "video"
      : "raw";
  const extension = extname(name)
    .replace(/[^a-zA-Z0-9.]/g, "")
    .slice(0, 15);
  const publicId = `ppwm/${randomUUID()}${resourceType === "raw" ? extension : ""}`;
  const api = client();
  const result = await new Promise<{ public_id: string; format?: string }>(
    (resolve, reject) => {
      const stream = api.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: resourceType,
          type: "authenticated",
          overwrite: false,
          timeout: 120000,
        },
        (error, result) => {
          if (error || !result)
            reject(new Error("Cloudinary upload failed. Please try again."));
          else resolve(result);
        },
      );
      stream.end(Buffer.from(bytes));
    },
  );
  return {
    storage: {
      provider: "cloudinary",
      publicId: result.public_id,
      resourceType,
      deliveryType: "authenticated",
      format: result.format || "",
    },
  };
}
export async function readMedia(
  file: Record<string, unknown>,
): Promise<Uint8Array<ArrayBuffer>> {
  const storage = file.storage as CloudinaryStorage | undefined;
  if (storage?.provider === "cloudinary") {
    const { publicId, format, resourceType } = storage;
    const url = client().utils.private_download_url(publicId, format, {
      resource_type: resourceType,
      type: "authenticated",
      expires_at: Math.floor(Date.now() / 1000) + 60,
    });
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(120000),
    });
    if (!response.ok)
      throw new Error("Cloudinary file could not be downloaded.");
    return new Uint8Array(await response.arrayBuffer());
  }
  if (file.data instanceof Binary) return new Uint8Array(file.data.buffer);
  if (file.data instanceof Uint8Array) return new Uint8Array(file.data);
  throw new Error("File content is unavailable.");
}
export async function removeMedia(storage: CloudinaryStorage) {
  await client().uploader.destroy(storage.publicId, {
    resource_type: storage.resourceType,
    type: "authenticated",
    invalidate: true,
  });
}
