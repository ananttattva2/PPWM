import { currentUser } from "@/lib/access";
import { db } from "@/lib/db";
import Dashboard from "@/components/workspace/dashboard";
export default async function Page() {
  const user = await currentUser();
  const clients = await db()
    .collection("clients")
    .find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray();
  const count = await db().collection("clients").countDocuments();
  const team = await db()
    .collection("user")
    .countDocuments({ active: { $ne: false } });
  return (
    <Dashboard
      name={user?.firstName || user?.name || "there"}
      count={count}
      team={team}
      clients={JSON.parse(JSON.stringify(clients))}
    />
  );
}
