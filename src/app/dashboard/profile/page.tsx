import Profile from "@/components/workspace/profile";
import { currentUser } from "@/lib/access";
export default async function Page() {
  const u = await currentUser();
  if (!u) return null;
  return (
    <Profile
      user={{
        id: u.id,
        name: u.name,
        email: u.email,
        image: u.image ?? "",
        role: u.role,
        firstName: u.firstName,
        lastName: u.lastName,
      }}
    />
  );
}
