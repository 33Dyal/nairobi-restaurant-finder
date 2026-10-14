const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function layout(title, bodyHtml, buttonLabel, url) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#16211c">
<h1 style="font-size:20px;margin:0 0 16px">${esc(title)}</h1>
${bodyHtml}
${url ? `<p style="margin:24px 0"><a href="${esc(url)}" style="background:#66379f;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">${esc(buttonLabel)}</a></p>
<p style="font-size:13px;color:#4b5a52">If the button doesn't work, copy this link into your browser:<br>${esc(url)}</p>` : ""}
</div>`;
}

export function verifyEmailTemplate({ name, url }) {
  return {
    subject: "Verify your email for Nairobi Eats",
    text: `Hi ${name},\n\nConfirm your email address to finish setting up your account:\n${url}\n\nThis link expires in 24 hours. If you didn't create an account, you can ignore this email.`,
    html: layout("Verify your email", `<p>Hi ${esc(name)}, confirm your email address to finish setting up your account.</p><p style="font-size:13px;color:#4b5a52">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>`, "Verify email", url),
  };
}

export function resetPasswordTemplate({ name, url }) {
  return {
    subject: "Reset your Nairobi Eats password",
    text: `Hi ${name},\n\nUse this link to choose a new password:\n${url}\n\nThis link expires in 1 hour. If you didn't ask for this, you can ignore this email and your password will stay the same.`,
    html: layout("Reset your password", `<p>Hi ${esc(name)}, use the button below to choose a new password.</p><p style="font-size:13px;color:#4b5a52">This link expires in 1 hour. If you didn't ask for this, ignore this email and your password will stay the same.</p>`, "Choose a new password", url),
  };
}

export function accountExistsTemplate({ name, loginUrl, resetUrl }) {
  return {
    subject: "You already have a Nairobi Eats account",
    text: `Hi ${name},\n\nSomeone tried to create an account with this email address, but you already have one.\nSign in: ${loginUrl}\nForgot your password? ${resetUrl}\n\nIf this wasn't you, no action is needed.`,
    html: layout("You already have an account", `<p>Hi ${esc(name)}, someone tried to create an account with this email address, but you already have one.</p><p><a href="${esc(resetUrl)}">Forgot your password?</a></p><p style="font-size:13px;color:#4b5a52">If this wasn't you, no action is needed.</p>`, "Sign in", loginUrl),
  };
}

export function welcomeTemplate({ name, exploreUrl }) {
  return {
    subject: "Welcome to Nairobi Eats",
    text: `Hi ${name},\n\nYour email is verified and your account is ready. Find your next favourite restaurant:\n${exploreUrl}`,
    html: layout(
      "Welcome to Nairobi Eats",
      `<p>Hi ${esc(name)}, your email is verified and your account is ready.</p><p>Find restaurants by cuisine, area, budget and vibe, save your favorites, and spot the latest offers.</p>`,
      "Explore restaurants",
      exploreUrl
    ),
  };
}