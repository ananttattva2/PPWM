type SupplierAccount = {
  email: string;
  name: string;
  emailVerified: false;
  role: "supplier";
  active: true;
};

export async function provisionSupplierLogin(
  emailInput: string,
  dependencies: {
    findUser: (email: string) => Promise<unknown>;
    hasAssignments: (email: string) => Promise<boolean>;
    createUser: (account: SupplierAccount) => Promise<unknown>;
  },
) {
  const email = emailInput.trim().toLowerCase();
  if (!email || (await dependencies.findUser(email))) return;
  if (!(await dependencies.hasAssignments(email))) return;
  try {
    await dependencies.createUser({
      email,
      name: email.split("@")[0],
      emailVerified: false,
      role: "supplier",
      active: true,
    });
  } catch (error) {
    // A concurrent OTP request may have provisioned the same email.
    if (!(await dependencies.findUser(email))) throw error;
  }
}
