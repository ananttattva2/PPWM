import { assertPackagingScope } from "@/lib/packaging-scopes";
import { storeMedia, type MediaStorage } from "@/lib/cloudinary-storage";
import { assertImportAccess } from "@/lib/client-access";
import { ObjectId } from "mongodb";
import { db, getClient } from "@/lib/db";
import { apiError, checkOrigin, requireUser } from "@/lib/access";
import { hydrateImportSuppliers } from "@/lib/hydrate-import-suppliers";
import { initialComposition } from "@/lib/packaging-composition";
import type { PackagingComposition } from "@/lib/packaging-composition";
import type { PackagingRow } from "@/lib/packaging-import-schema";
import { supplierOwnsComponent } from "@/lib/supplier-access";
export const runtime = "nodejs";
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    checkOrigin(req);
    const user = await requireUser([
      "super_admin",
      "admin",
      "manager",
      "user",
      "supplier",
    ]);
    assertPackagingScope(user, "sales");
    const { id } = await params;
    if (!/^[a-f0-9]{24}$/i.test(id))
      return Response.json({ error: "Import not found" }, { status: 404 });
    if (Number(req.headers.get("content-length")) > 13 * 1024 * 1024)
      throw new Error("Upload up to 6 images, 2 MB each.");
    const form = await req.formData();
    const rowNumber = Number(form.get("rowNumber"));
    const files = form.getAll("photos");
    const componentId = String(form.get("componentId") || "");
    if (user.role === "supplier" && !componentId) throw new Error("FORBIDDEN");
    if (
      componentId &&
      (!/^[a-zA-Z0-9-]{1,60}$/.test(componentId) || files.length !== 1)
    )
      throw new Error("Choose one photo for a saved component.");
    if (
      !Number.isInteger(rowNumber) ||
      rowNumber < 1 ||
      rowNumber > 1001 ||
      !files.length ||
      files.length > 6
    )
      throw new Error("Choose 1–6 photos for this SKU.");
    const uploads: {
      name: string;
      type: string;
      storage: MediaStorage;
    }[] = [];
    for (const file of files) {
      if (
        !(file instanceof File) ||
        !file.size ||
        file.size > 2 * 1024 * 1024 ||
        !["image/png", "image/jpeg"].includes(file.type)
      )
        throw new Error("Use PNG or JPEG photos up to 2 MB each.");
      const bytes = Buffer.from(await file.arrayBuffer());
      const valid =
        file.type === "image/png"
          ? bytes
              .subarray(0, 8)
              .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
      if (!valid)
        throw new Error("A photo does not match its declared image type.");
      uploads.push({
        name: file.name.slice(0, 180),
        type: file.type,
        ...(await storeMedia(bytes, file.name, file.type)),
      });
    }
    const database = db();
    await database
      .collection("packagingAssets")
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    let composition: PackagingComposition | undefined;
    await getClient().withSession(async (session) =>
      session.withTransaction(async () => {
        const record = await database
          .collection("packagingImports")
          .findOne({ _id: new ObjectId(id) }, { session });
        if (!record) throw new Error("FORBIDDEN");
        await assertImportAccess(user, record);
        const index = (record.analysis.rows as PackagingRow[]).findIndex(
          (row) => row.rowNumber === rowNumber,
        );
        if (index < 0) throw new Error("SKU not found.");
        const hydrated = hydrateImportSuppliers({
          headers: record.headers,
          mapping: record.mapping || {},
          rawRows: record.rawRows,
          settings: record.settings,
          analysis: record.analysis,
        });
        composition = structuredClone(
          initialComposition(hydrated.analysis.rows[index]),
        );
        const component = componentId
          ? composition.components.find(
              (component) => component.id === componentId,
            )
          : undefined;
        if (
          user.role === "supplier" &&
          (record.status !== "confirmed" ||
            !component ||
            !supplierOwnsComponent(user.email, component))
        )
          throw new Error("FORBIDDEN");
        if (componentId && !component)
          throw new Error(
            "Component not found. Reload this SKU before uploading.",
          );
        if (!record.analysis.rows[index].composition && !componentId)
          composition.components = [];
        if (
          !componentId &&
          composition.productImages.length +
            (composition.productImage ? 1 : 0) +
            uploads.length >
            12
        )
          throw new Error("Keep a maximum of 12 product photos per SKU.");
        for (const upload of uploads) {
          const assetId = new ObjectId();
          await database.collection("packagingAssets").insertOne(
            {
              _id: assetId,
              ...upload,
              importId: id,
              rowNumber,
              componentId: componentId || "gallery",
              createdBy: user.id,
              createdAt: new Date(),
              ...(record.expiresAt ? { expiresAt: record.expiresAt } : {}),
            },
            { session },
          );
          if (component) component.image = assetId.toString();
          else if (!composition.productImage)
            composition.productImage = assetId.toString();
          else composition.productImages.push(assetId.toString());
        }
        const now = new Date();
        await database.collection("packagingImports").updateOne(
          { _id: record._id },
          {
            $set: {
              [`analysis.rows.${index}.composition`]: composition,
              updatedAt: now,
            },
          },
          { session },
        );
        if (record.clientId)
          await database
            .collection("packagingSkus")
            .updateOne(
              { importId: id, rowNumber },
              { $set: { composition, updatedAt: now } },
              { session },
            );
      }),
    );
    if (user.role === "supplier" && composition) {
      composition = {
        ...composition,
        components: composition.components.filter((component) =>
          supplierOwnsComponent(user.email, component),
        ),
      };
    }
    return Response.json({ composition });
  } catch (error) {
    if (
      error instanceof Error &&
      !["UNAUTHORIZED", "FORBIDDEN"].includes(error.message)
    )
      return Response.json(
        {
          error: [
            "Use PNG",
            "Choose 1",
            "Choose one",
            "Component not",
            "Upload up",
            "A photo",
            "Keep a maximum",
            "SKU not",
          ].some((prefix) => error.message.startsWith(prefix))
            ? error.message
            : "Could not save photos. Please try again.",
        },
        { status: 400 },
      );
    return apiError(error);
  }
}
