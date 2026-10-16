import Clients from "@/components/workspace/clients";
import { currentUser } from "@/lib/access";
import { redirect } from "next/navigation";
import { clientEditorRoles } from "@/lib/client-permissions";
export default async function Page() {
  const user = await currentUser();
  if (user?.role === "supplier") redirect("/dashboard/supplier");
  return (
    <Clients
      canEdit={(clientEditorRoles as readonly string[]).includes(
        user?.role || "",
      )}
    />
  );
}
