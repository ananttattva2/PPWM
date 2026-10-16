import { assertImportAccess } from "@/lib/client-access";
import { ObjectId, Binary } from "mongodb";
import { db, getClient } from "@/lib/db";
import { requireUser, apiError, checkOrigin } from "@/lib/access";
import {
  compositionUpdateSchema,
  type PackagingComposition,
} from "@/lib/packaging-composition";
import { hydrateImportSuppliers } from "@/lib/hydrate-import-suppliers";
import { syncComponentSources } from "@/lib/component-import";
import { analysePackaging } from "@/lib/packaging-import";
import {
  importFields,
  type PackagingRow,
  type ColumnMapping,
} from "@/lib/packaging-import-schema";
export const runtime = "nodejs";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (!/^[a-f0-9]{24}$/i.test(id))
      return Response.json({ error: "Import not found" }, { status: 404 });
    const record = await db()
      .collection("packagingImports")
      .findOne({ _id: new ObjectId(id) });
    if (!record)
      return Response.json({ error: "Import not found" }, { status: 404 });
    await assertImportAccess(user, record);
    if (new URL(req.url).searchParams.get("download") === "true") {
      const bytes =
        record.file.data instanceof Binary
          ? record.file.data.buffer
          : record.file.data;
      return new Response(new Uint8Array(bytes), {
        headers: {
          "Content-Type":
            record.file.type === "CSV"
              ? "text/csv"
              : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(record.file.name)}`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    const { data, ...file } = record.file;
    const hydrated = hydrateImportSuppliers({
      headers: record.headers,
      mapping: record.mapping || {},
      rawRows: record.rawRows,
      settings: record.settings,
      analysis: record.analysis,
    });
    return Response.json({
      id: record._id.toString(),
      file,
      settings: record.settings,
      mapping: hydrated.mapping,
      headers: record.headers,
      analysis: hydrated.analysis,
      clientId: record.clientId,
      status: record.status,
    });
  } catch (e) {
    return apiError(e);
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  return saveRow(req, context, false);
}
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  return saveRow(req, context, true);
}
async function saveRow(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
  creating: boolean,
) {
  try {
    checkOrigin(req);
    const user = await requireUser(["super_admin", "admin", "manager", "user"]);
    const { id } = await params;
    if (!/^[a-f0-9]{24}$/i.test(id))
      return Response.json({ error: "Import not found" }, { status: 404 });
    if (Number(req.headers.get("content-length")) > 13 * 1024 * 1024)
      throw new Error("Upload too large");
    const body = await req.formData();
    const update = compositionUpdateSchema.parse(
      JSON.parse(String(body.get("data") || "{}")),
    );
    const database = db();
    await database
      .collection("packagingAssets")
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    let response;
    await getClient().withSession(async (session) =>
      session.withTransaction(async () => {
        const record = await database
          .collection("packagingImports")
          .findOne({ _id: new ObjectId(id) }, { session });
        if (!record) throw new Error("FORBIDDEN");
        await assertImportAccess(user, record);
        const existingRows = record.analysis.rows as PackagingRow[];
        if (creating && existingRows.length >= 1000)
          throw new Error("Use a maximum of 1,000 data rows.");
        if (creating && !update.fields.sku && !update.fields.productName)
          throw new Error("Enter a product name or SKU before saving.");
        if (
          creating &&
          update.fields.sku &&
          existingRows.some(
            (row) => row.sku.toLowerCase() === update.fields.sku.toLowerCase(),
          )
        )
          throw new Error("This SKU already exists. Use a different SKU.");
        const rowNumber = creating
          ? existingRows.length +
            (record.settings.firstRow === "headers" ? 2 : 1)
          : update.rowNumber;
        if (creating) {
          record.rawRows.push({});
          record.analysis.rows.push({
            rowNumber,
            category:
              record.settings.category === "All Categories"
                ? ""
                : record.settings.category,
          });
        }
        const index = (record.analysis.rows as PackagingRow[]).findIndex(
          (row) => row.rowNumber === rowNumber,
        );
        if (index < 0) throw new Error("Row not found");
        const composition = structuredClone(update.composition);
        const permittedImages = new Set<string>();
        const previous = record.analysis.rows[index].composition as
          PackagingComposition | undefined;
        if (previous?.productImage) permittedImages.add(previous.productImage);
        previous?.productImages?.forEach((image) => permittedImages.add(image));
        previous?.components.forEach((component) => {
          if (component.image) permittedImages.add(component.image);
        });
        for (const image of [
          composition.productImage,
          ...composition.productImages,
          ...composition.components.map((component) => component.image),
        ]) {
          if (image && !permittedImages.has(image))
            throw new Error("Invalid image reference");
        }
        // The component editor does not remove gallery photos, including photos
        // uploaded after an older editor tab was opened.
        composition.productImages = [
          ...new Set([
            ...(previous?.productImages || []),
            ...composition.productImages,
          ]),
        ];
        const uploads = [...body.entries()].filter(
          ([key, value]) => key.startsWith("image:") && value instanceof File,
        );
        if (uploads.length > 6)
          throw new Error("Upload up to 6 images at a time");
        for (const [key, value] of uploads) {
          const file = value as File;
          if (
            !file.size ||
            file.size > 2 * 1024 * 1024 ||
            !["image/png", "image/jpeg"].includes(file.type)
          )
            throw new Error("Use PNG or JPEG images up to 2 MB");
          const bytes = Buffer.from(await file.arrayBuffer());
          const valid =
            file.type === "image/png"
              ? bytes
                  .subarray(0, 8)
                  .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
              : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
          if (!valid)
            throw new Error("Image content does not match its file type");
          const componentId = key.slice(6);
          const component = composition.components.find(
            (item) => item.id === componentId,
          );
          if (componentId !== "product" && !component)
            throw new Error("Unknown component image");
          const assetId = new ObjectId();
          await database.collection("packagingAssets").insertOne(
            {
              _id: assetId,
              importId: id,
              rowNumber,
              componentId,
              createdBy: user.id,
              name: file.name.slice(0, 180),
              type: file.type,
              data: new Binary(bytes),
              createdAt: new Date(),
              ...(record.expiresAt ? { expiresAt: record.expiresAt } : {}),
            },
            { session },
          );
          if (componentId === "product")
            composition.productImage = assetId.toString();
          else component!.image = assetId.toString();
        }
        const retainedImages = [
          composition.productImage,
          ...composition.productImages,
          ...composition.components.map((component) => component.image),
        ]
          .filter(Boolean)
          .map((image) => new ObjectId(image));
        await database.collection("packagingAssets").deleteMany(
          {
            importId: id,
            rowNumber,
            _id: { $nin: retainedImages },
          },
          { session },
        );
        const mapping: ColumnMapping = { ...record.mapping };
        const headers: string[] = [...record.headers];
        const rawRows: Record<string, string>[] = record.rawRows.map(
          (row: Record<string, string>) => ({ ...row }),
        );
        const settings = { ...record.settings };
        if (
          settings.category !== "All Categories" &&
          update.fields.category !== record.analysis.rows[index].category
        ) {
          let header = mapping.category;
          if (!header) {
            header = "Category (edited)";
            while (headers.includes(header)) header += " (edited)";
            headers.push(header);
            mapping.category = header;
          }
          rawRows.forEach((raw, rowIndex) => {
            raw[header] = record.analysis.rows[rowIndex].category;
          });
          settings.category = "All Categories";
        }
        for (const field of importFields) {
          if (!mapping[field.key] && update.fields[field.key]) {
            let header = field.label;
            while (headers.includes(header)) header += " (edited)";
            mapping[field.key] = header;
            headers.push(header);
          }
          const header = mapping[field.key];
          if (header) rawRows[index][header] = update.fields[field.key] || "";
        }
        syncComponentSources(rawRows[index], mapping, headers, composition);
        const analysis = analysePackaging(rawRows, mapping, settings);
        analysis.rows.forEach((row, rowIndex) => {
          const saved = record.analysis.rows[rowIndex].composition;
          if (saved) row.composition = saved;
        });
        analysis.rows[index].composition = composition;
        const now = new Date();
        await database.collection("packagingImports").updateOne(
          { _id: record._id },
          {
            $set: {
              analysis,
              rawRows,
              mapping,
              headers,
              settings,
              updatedAt: now,
            },
          },
          { session },
        );
        if (record.clientId) {
          // Revalidation may change duplicate-SKU issues on more than the edited row.
          await database.collection("packagingSkus").bulkWrite(
            analysis.rows.map((row) => ({
              updateOne: {
                filter: { importId: id, rowNumber: row.rowNumber },
                update: {
                  $set: {
                    ...row,
                    clientId: record.clientId,
                    importId: id,
                    plant: settings.plant,
                    updatedAt: now,
                  },
                  $setOnInsert: { createdAt: now },
                },
                upsert: creating,
              },
            })),
            { session },
          );
          await database.collection("clients").updateOne(
            { _id: new ObjectId(record.clientId) },
            {
              $set: {
                "packagingImport.summary": analysis.summary,
                "packagingImport.settings": settings,
                materials: analysis.materialFamilies,
                updatedAt: now,
              },
            },
            { session },
          );
        }
        const { data: _bytes, ...file } = record.file;
        response = {
          id,
          file,
          headers,
          mapping,
          settings,
          analysis,
          clientId: record.clientId,
        };
      }),
    );
    return Response.json(response, { status: creating ? 201 : 200 });
  } catch (error) {
    if (
      error instanceof Error &&
      !["FORBIDDEN", "UNAUTHORIZED"].includes(error.message)
    )
      return Response.json(
        {
          error: ["This SKU already", "Enter a product", "Use a maximum"].some(
            (prefix) => error.message.startsWith(prefix),
          )
            ? error.message
            : "Could not save. Check your field values and use PNG/JPEG images up to 2 MB.",
        },
        { status: 400 },
      );
    return apiError(error);
  }
}
