import { redirect } from "next/navigation";
import { currentUser } from "@/lib/access";
import Shell from "@/components/workspace/shell";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  return (
    <Shell
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image ?? "",
        role: user.role,
        packagingScopes: user.packagingScopes,
        firstName: user.firstName,
        lastName: user.lastName,
      }}
    >
      {children}
    </Shell>
  );
}
