import { v2 as cloudinary } from "cloudinary";
import { ObjectId, type Db } from "mongodb";
export async function cleanupCloudinaryTestFiles(
  database: Db,
  importId: string,
) {
  if (!process.env.CLOUDINARY_URL) return;
  const connection = new URL(process.env.CLOUDINARY_URL);
  cloudinary.config({
    cloud_name: connection.hostname,
    api_key: decodeURIComponent(connection.username),
    api_secret: decodeURIComponent(connection.password),
    secure: true,
  });
  for (const name of [
    "packagingDetailFiles",
    "packagingAssets",
    "mediaUploads",
    "sustainabilityProofs",
  ]) {
    const files = await database
      .collection(name)
      .find({ importId }, { projection: { storage: 1 } })
      .toArray();
    for (const file of files)
      if (file.storage?.provider === "cloudinary")
        await cloudinary.uploader.destroy(file.storage.publicId, {
          resource_type: file.storage.resourceType,
          type: "authenticated",
          invalidate: true,
        });
  }
  const imported = await database
    .collection("packagingImports")
    .findOne(
      { _id: new ObjectId(importId) },
      { projection: { "file.storage": 1 } },
    );
  if (imported?.file?.storage?.provider === "cloudinary")
    await cloudinary.uploader.destroy(imported.file.storage.publicId, {
      resource_type: imported.file.storage.resourceType,
      type: "authenticated",
      invalidate: true,
    });
}
export async function cleanupCloudinaryTestAvatar(
  database: Db,
  userId: ObjectId,
) {
  const user = await database
    .collection("user")
    .findOne({ _id: userId }, { projection: { imageStorage: 1 } });
  if (user?.imageStorage?.provider === "cloudinary")
    await cloudinary.uploader.destroy(user.imageStorage.publicId, {
      resource_type: user.imageStorage.resourceType,
      type: "authenticated",
      invalidate: true,
    });
}
