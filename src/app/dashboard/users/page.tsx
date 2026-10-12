import { redirect } from "next/navigation";
import { currentUser } from "@/lib/access";
import UserManagement from "@/components/workspace/users";
export default async function Page() {
  const user = await currentUser();
  if (!user || !["admin", "super_admin"].includes(user.role))
    redirect("/dashboard");
  return <UserManagement role={user.role} actorId={user.id} />;
}
