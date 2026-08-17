import "server-only";
import nodemailer from "nodemailer";
import type { Submission } from "@prisma/client";

/**
 * Gmail SMTP via nodemailer.
 *
 * SMTP_PASS must be a Google App Password, which Google only issues for
 * accounts with 2-step verification enabled — a normal account password will
 * be rejected. Sending is skipped (not failed) when credentials are absent, so
 * the site works in development and before the mailbox is configured.
 */

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;

  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    // Port 587 uses STARTTLS, which nodemailer negotiates when secure=false.
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: { user, pass },
  });

  return transporter;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderRows(rows: [string, string | null | undefined][]): string {
  return rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#777;white-space:nowrap">${escapeHtml(k)}</td>` +
        `<td style="padding:4px 0;color:#1a1a1a">${escapeHtml(String(v))}</td></tr>`,
    )
    .join("");
}

export type EmailResult = { sent: boolean; error?: string };

export async function sendSubmissionEmail(
  submission: Submission,
): Promise<EmailResult> {
  const transport = getTransporter();
  if (!transport) return { sent: false, error: "SMTP не настроен" };

  const to = process.env.CONTACT_TO_EMAIL || "info@nesilcoffee.com";
  const from =
    process.env.CONTACT_FROM_EMAIL ||
    `NesilCoffee <${process.env.SMTP_USER}>`;

  const isOrder = submission.type === "ORDER";
  const subject = isOrder
    ? `Заявка на товар: ${submission.productName ?? "—"}${submission.quantity ? ` × ${submission.quantity}` : ""}`
    : `Сообщение с сайта: ${submission.subject ?? "без темы"}`;

  const rows = renderRows([
    ["Имя", submission.name],
    ["Телефон", submission.phone],
    ["E-mail", submission.email],
    ["Товар", submission.productName],
    ["Количество", submission.quantity ? String(submission.quantity) : null],
    ["Тема", submission.subject],
    ["Язык страницы", submission.locale],
  ]);

  const html = `
    <div style="font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;max-width:560px">
      <h2 style="margin:0 0 16px;font-size:18px;color:#1a1a1a">
        ${isOrder ? "Новая заявка на товар" : "Новое сообщение с сайта"}
      </h2>
      <table style="border-collapse:collapse;font-size:14px;margin-bottom:16px">${rows}</table>
      ${
        submission.message
          ? `<div style="padding:12px 14px;background:#f5f5f5;border-radius:8px;font-size:14px;line-height:1.5;color:#1a1a1a;white-space:pre-wrap">${escapeHtml(submission.message)}</div>`
          : ""
      }
      <p style="margin-top:20px;font-size:12px;color:#999">
        Отправлено с nesilcoffee.com · ${submission.createdAt.toISOString()}
      </p>
    </div>`;

  try {
    await transport.sendMail({
      from,
      to,
      subject,
      html,
      // Replying in the mail client goes straight to the customer rather than
      // to the site's own mailbox.
      ...(submission.email ? { replyTo: submission.email } : {}),
    });
    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Email send failed:", message);
    return { sent: false, error: message };
  }
}
