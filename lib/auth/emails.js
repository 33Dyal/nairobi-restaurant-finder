import { sendEmail } from "@/lib/resend/mailer";
import {
  verifyEmailTemplate,
  resetPasswordTemplate,
  accountExistsTemplate,
  welcomeTemplate,
} from "@/lib/resend/templates";
import { createEmailToken } from "./email-tokens";

const appUrl = () => (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

export async function sendVerificationEmail(user) {
  const token = await createEmailToken(user.id, "VERIFY_EMAIL");
  const url = `${appUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  await sendEmail({ to: user.email, ...verifyEmailTemplate({ name: user.name, url }) });
}

export async function sendPasswordResetEmail(user) {
  const token = await createEmailToken(user.id, "RESET_PASSWORD");
  const url = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  await sendEmail({ to: user.email, ...resetPasswordTemplate({ name: user.name, url }) });
}

export async function sendAccountExistsEmail(user) {
  await sendEmail({
    to: user.email,
    ...accountExistsTemplate({
      name: user.name,
      loginUrl: `${appUrl()}/login`,
      resetUrl: `${appUrl()}/forgot-password`,
    }),
  });
}

export async function sendWelcomeEmail(user) {
  await sendEmail({
    to: user.email,
    ...welcomeTemplate({ name: user.name, exploreUrl: `${appUrl()}/explore` }),
  });
}

// Runs an email task in the background and logs failures instead of losing them.
export async function runSafely(task) {
  try {
    await task();
  } catch (error) {
    console.error("[EMAIL] failed:", error);
  }
}

