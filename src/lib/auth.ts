import "server-only";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { emailOTP } from "better-auth/plugins";
import { db, getClient } from "./db";
import { sendOTP } from "./mail";
export const auth = betterAuth({
  database: mongodbAdapter(db(), { client: getClient() }),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    requireEmailVerification: true,
    minPasswordLength: 12,
  },
  user: {
    additionalFields: {
      firstName: { type: "string", defaultValue: "", input: false },
      lastName: { type: "string", defaultValue: "", input: false },
      role: { type: "string", defaultValue: "user", input: false },
      active: { type: "boolean", defaultValue: true, input: false },
    },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 20,
    customRules: {
      "/email-otp/send-verification-otp": { window: 60, max: 3 },
      "/sign-in/email-otp": { window: 60, max: 5 },
    },
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 5,
      storeOTP: "hashed",
      disableSignUp: true,
      async sendVerificationOTP({ email, otp }) {
        await sendOTP(email, otp);
      },
    }),
  ],
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await db()
            .collection("user")
            .findOne({
              $or: [
                { id: session.userId },
                ...(/^[a-f0-9]{24}$/i.test(session.userId)
                  ? [
                      {
                        _id: new (await import("mongodb")).ObjectId(
                          session.userId,
                        ),
                      },
                    ]
                  : []),
              ],
            });
          if (!user || user.active === false) return false;
          return { data: session };
        },
      },
    },
  },
});
