import { redirect } from "next/navigation";
import { currentUser } from "@/lib/access";
import { supplierAssignments } from "@/lib/supplier-assignments";
import SupplierPackaging from "@/components/workspace/supplier-packaging";

export default async function Page() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "supplier") redirect("/dashboard");
  const assignments = await supplierAssignments(user.email);
  return <SupplierPackaging assignments={assignments} />;
}
