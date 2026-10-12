import Clients from "@/components/workspace/clients";
import { currentUser } from "@/lib/access";
export default async function Page() {
  const user = await currentUser();
  return (
    <Clients
      canEdit={["super_admin", "admin", "manager"].includes(user?.role || "")}
    />
  );
}
