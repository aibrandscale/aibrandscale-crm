import { Resend } from "resend";

const DEFAULT_FROM = process.env.RESEND_FROM || "AI Brand Scale <onboarding@resend.dev>";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ sent: boolean; reason?: string; id?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY not set — email NOT sent to", opts.to);
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }
  try {
    const resend = new Resend(key);
    const res = await resend.emails.send({
      from: DEFAULT_FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    if (res.error) {
      console.error("[email] Resend error", res.error);
      return { sent: false, reason: res.error.message };
    }
    return { sent: true, id: res.data?.id };
  } catch (err) {
    console.error("[email] send failed", err);
    return { sent: false, reason: err instanceof Error ? err.message : "unknown" };
  }
}

export function inviteEmailHtml(opts: {
  email: string;
  password: string;
  loginUrl: string;
  invitedBy: string;
}) {
  return `<!doctype html>
<html lang="bg"><body style="margin:0;padding:0;background:#f6f6f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #ececef;border-radius:14px;overflow:hidden;">
      <tr><td style="background:linear-gradient(135deg,#552B69 0%,#903CA5 100%);color:#fff;padding:22px 28px;">
        <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;opacity:.85;">AI Brand Scale CRM</div>
        <div style="font-size:20px;font-weight:800;margin-top:4px;">Покана за достъп</div>
      </td></tr>
      <tr><td style="padding:28px;">
        <p style="margin:0 0 12px;font-size:15px;line-height:1.55;">Здрасти,</p>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.55;"><strong>${escapeHtml(opts.invitedBy)}</strong> те покани в AI Brand Scale CRM. Влез с тези данни:</p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#faf9fc;border:1px solid #ececef;border-radius:10px;padding:14px 18px;margin:0 0 18px;">
          <tr><td style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#6b7280;padding-bottom:4px;">Имейл</td></tr>
          <tr><td style="font-size:15px;font-weight:600;padding-bottom:12px;">${escapeHtml(opts.email)}</td></tr>
          <tr><td style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#6b7280;padding-bottom:4px;">Парола</td></tr>
          <tr><td style="font-size:15px;font-weight:600;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:#fff;border:1px solid #ececef;border-radius:8px;padding:8px 12px;display:inline-block;">${escapeHtml(opts.password)}</td></tr>
        </table>
        <p style="margin:0 0 22px;font-size:13px;color:#6b7280;line-height:1.55;">Препоръчваме да я смениш веднага след първото влизане.</p>
        <a href="${escapeHtml(opts.loginUrl)}" style="display:inline-block;background:linear-gradient(135deg,#552B69 0%,#903CA5 100%);color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:8px;">Влез в CRM →</a>
        <p style="margin:22px 0 0;font-size:12px;color:#9ca3af;">Ако имаш проблем, отговори на този имейл.</p>
      </td></tr>
    </table>
    <div style="font-size:11px;color:#9ca3af;margin-top:14px;">© AI Brand Scale</div>
  </td></tr>
</table></body></html>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export function generatePassword(length = 14): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#%&";
  let pwd = "";
  const arr = new Uint32Array(length);
  // Web Crypto (Node 19+) — supported on Vercel/modern Node
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(arr);
    for (let i = 0; i < length; i += 1) pwd += alphabet[arr[i] % alphabet.length];
  } else {
    for (let i = 0; i < length; i += 1) pwd += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return pwd;
}
