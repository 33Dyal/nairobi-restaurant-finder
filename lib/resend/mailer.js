import { Resend } from "resend";

// Sends through Resend when RESEND_API_KEY and RESEND_FROM_EMAIL are set.
// In development the email is ALWAYS printed to the server terminal as well,
// so you can click the link even if delivery fails or goes to spam.
// Never throws: email problems must not break sign-up or reset flows.
export async function sendEmail({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL?.trim().replace(/^["']|["']$/g, "");
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    console.log(`\n[EMAIL] To: ${to}\n[EMAIL] Subject: ${subject}\n\n${text}\n`);
  }

  if (!apiKey || !from) {
    if (isDev) console.log("[EMAIL] Not sent: RESEND_API_KEY or RESEND_FROM_EMAIL is empty. Use the link above.");
    else console.warn("[EMAIL] RESEND_API_KEY or RESEND_FROM_EMAIL is missing; email not sent.");
    return { sent: false };
  }

  try {
    const { data, error } = await new Resend(apiKey).emails.send({ from, to, subject, html, text });
    if (error) {
      console.error(`[EMAIL] Resend rejected the email: ${error.message ?? JSON.stringify(error)}`);
      if (from.endsWith("@resend.dev")) {
        console.error("[EMAIL] Hint: onboarding@resend.dev only delivers to the email you signed up to Resend with. Verify your own domain in Resend to email anyone.");
      }
      return { sent: false };
    }
    if (isDev) console.log(`[EMAIL] Accepted by Resend (id ${data?.id}). If it doesn't arrive, check spam.`);
    return { sent: true };
  } catch (error) {
    console.error("[EMAIL] Failed to send:", error);
    return { sent: false };
  }
}
