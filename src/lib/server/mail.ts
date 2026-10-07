import "server-only";
import { createTransport, type Transporter } from "nodemailer";
import { env } from "@/config/env";
import { isMailConfigured, serverEnv } from "@/config/env.server";
import { site } from "@/config/site";

/*
 * Transactional mail over SMTP (Яндекс 360, Mail.ru для бизнеса, Unisender Go и т.п.): address
 * confirmation and password reset, nothing else. Without SMTP_* the site works as before — the
 * letters just aren't sent, and the auth config turns confirmation off (lib/server/auth.ts).
 * Letters are plain and self-contained: inline styles only (mail clients strip <style> and
 * external CSS), a text version alongside the HTML, and nothing loaded from the network.
 */

const cache = globalThis as unknown as { __idxMail?: Transporter };

function getTransport(): Transporter {
  cache.__idxMail ??= createTransport({
    host: serverEnv.smtpHost,
    port: serverEnv.smtpPort,
    // 465 is TLS from the start, 587 upgrades with STARTTLS
    secure: serverEnv.smtpPort === 465,
    auth: { user: serverEnv.smtpUser, pass: serverEnv.smtpPassword },
    // Don't hold the queue hostage if the provider stalls
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return cache.__idxMail;
}

/**
 * Accounts created through Telegram get a technical address (`…@telegram.invalid`, a domain
 * reserved by RFC 2606 that can never exist): there is nothing to write to.
 */
export function isSendableEmail(email: string): boolean {
  return Boolean(email) && !email.toLowerCase().endsWith(".invalid");
}

const BRAND = "#b89b6a";
const INK = "#15171a";

/** The letter: a heading, a paragraph or two, one button, and the same link as plain text. */
function template({ title, lines, buttonLabel, url, note }: { title: string; lines: string[]; buttonLabel: string; url: string; note: string }) {
  const paragraphs = lines
    .map((line) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#3c4045">${line}</p>`)
    .join("");

  const html = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title></head>
<body style="margin:0;padding:24px 12px;background:#f4f2ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.06)">
    <tr><td style="padding:22px 32px;background:${INK}">
      <span style="font-size:17px;font-weight:700;letter-spacing:0.08em;color:#f3ead9">IDELUXE<span style="color:${BRAND}"> STUDIO</span></span>
    </td></tr>
    <tr><td style="padding:32px">
      <h1 style="margin:0 0 16px;font-size:21px;line-height:1.3;color:${INK}">${title}</h1>
      ${paragraphs}
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0"><tr>
        <td style="border-radius:12px;background:${INK}">
          <a href="${url}" style="display:inline-block;padding:14px 26px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none">${buttonLabel}</a>
        </td>
      </tr></table>
      <p style="margin:0 0 6px;font-size:13px;line-height:1.6;color:#70757c">Если кнопка не работает, открой ссылку:</p>
      <p style="margin:0 0 22px;font-size:13px;line-height:1.6;word-break:break-all"><a href="${url}" style="color:#8a6d3f">${url}</a></p>
      <p style="margin:0;padding-top:18px;border-top:1px solid #eceae6;font-size:13px;line-height:1.6;color:#70757c">${note}</p>
    </td></tr>
    <tr><td style="padding:18px 32px 26px;font-size:12px;line-height:1.6;color:#9aa0a6">
      ${site.name} · <a href="${env.siteUrl}" style="color:#9aa0a6">${env.siteUrl.replace(/^https?:\/\//, "")}</a><br>
      Письмо отправлено автоматически, отвечать на него не нужно.
    </td></tr>
  </table>
</body></html>`;

  const text = [title, "", ...lines.map((l) => l.replace(/<[^>]+>/g, "")), "", `${buttonLabel}: ${url}`, "", note, "", site.name].join("\n");
  return { html, text };
}

/** Sends a letter with one action button. Never throws: a dead SMTP must not break sign-up. */
async function send(to: string, subject: string, parts: Parameters<typeof template>[0]): Promise<void> {
  if (!isMailConfigured() || !isSendableEmail(to)) return;
  const { html, text } = template(parts);
  try {
    await getTransport().sendMail({
      from: serverEnv.mailFrom,
      replyTo: serverEnv.mailReplyTo || undefined,
      to,
      subject,
      html,
      text,
    });
  } catch (error) {
    // The person sees «письмо отправлено» and can ask for it again; the reason stays in the logs
    console.error(`[mail] не удалось отправить «${subject}»:`, error instanceof Error ? error.message : error);
  }
}

export function sendVerificationMail({ to, url }: { to: string; url: string }): Promise<void> {
  return send(to, `Подтверди email · ${site.shortName}`, {
    title: "Подтверди свой email",
    lines: [
      "Остался один шаг: подтверди адрес, и профиль откроется.",
      "Адрес нужен, чтобы вернуть доступ, если забудешь пароль, и чтобы привязать к нему покупки.",
    ],
    buttonLabel: "Подтвердить email",
    url,
    note: "Ссылка действует 1 час. Если ты не создавал профиль на IDELUXE STUDIO, просто удали это письмо: без перехода по ссылке ничего не произойдёт.",
  });
}

export function sendResetPasswordMail({ to, url }: { to: string; url: string }): Promise<void> {
  return send(to, `Новый пароль · ${site.shortName}`, {
    title: "Сброс пароля",
    lines: ["Мы получили запрос на смену пароля. Нажми кнопку и задай новый — старый перестанет работать."],
    buttonLabel: "Задать новый пароль",
    url,
    note: "Ссылка действует 1 час и срабатывает один раз. Если пароль ты не терял, ничего делать не нужно: письмо можно удалить, пароль останется прежним.",
  });
}
