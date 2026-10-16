import Clients from "@/components/workspace/clients";
import { currentUser } from "@/lib/access";
import { redirect } from "next/navigation";
export default async function Page() {
  const user = await currentUser();
  if (user?.role === "supplier") redirect("/dashboard/supplier");
  return (
    <Clients
      canEdit={["super_admin", "admin", "manager"].includes(user?.role || "")}
    />
  );
}
