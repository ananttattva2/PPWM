import "server-only";
import { assertPackagingScope } from "./packaging-scopes";
import { ObjectId } from "mongodb";
import { db } from "./db";
import { requireUser } from "./access";
import { assertImportAccess } from "./client-access";
import { additionalKindSchema } from "./additional-packaging";

export async function detailAccess(
  id: string,
  kindValue: string,
  rowNumber: number,
  write = false,
) {
  const user = await requireUser(
    write
      ? ["super_admin", "admin", "manager", "user"]
      : ["super_admin", "admin", "manager", "user", "compliance"],
  );
  const kind = additionalKindSchema.safeParse(kindValue);
  if (
    !/^[a-f0-9]{24}$/i.test(id) ||
    !kind.success ||
    !Number.isInteger(rowNumber) ||
    rowNumber < 1 ||
    rowNumber > 1001
  )
    return null;
  assertPackagingScope(user, kind.data);
  const record = await db()
    .collection("packagingImports")
    .findOne(
      { _id: new ObjectId(id) },
      {
        projection: {
          createdBy: 1,
          clientId: 1,
          draftClientId: 1,
          status: 1,
          "analysis.rows.rowNumber": 1,
        },
      },
    );
  if (!record) return null;
  await assertImportAccess(user, record);
  if (
    !record.analysis?.rows?.some(
      (row: { rowNumber: number }) => row.rowNumber === rowNumber,
    )
  )
    return null;
  return { user, kind: kind.data };
}
