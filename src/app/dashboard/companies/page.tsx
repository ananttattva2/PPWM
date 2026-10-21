import { redirect } from "next/navigation";
import { currentUser } from "@/lib/access";
import CompanyManagement from "@/components/workspace/companies";
export default async function Page() {
  const user = await currentUser();
  if (!user || !["admin", "super_admin"].includes(user.role))
    redirect("/dashboard");
  return <CompanyManagement role={user.role} actorId={user.id} />;
}
