import { getApiUser } from "@/server/auth/guard";
import { prisma } from "@/server/db";

/** RFC 4180 quoting, plus a guard against spreadsheet formula injection. */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text = String(value);

  // A cell starting with =, +, - or @ is executed as a formula by Excel and
  // Sheets when the file is opened. Prefixing with a quote neutralises it.
  if (/^[=+\-@]/.test(text)) text = `'${text}`;

  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const user = await getApiUser();
  if (!user) {
    return new Response("Требуется вход", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  const where =
    type === "order"
      ? { type: "ORDER" as const, isSpam: false }
      : type === "contact"
        ? { type: "CONTACT" as const, isSpam: false }
        : type === "spam"
          ? { isSpam: true }
          : { isSpam: false };

  const rows = await prisma.submission.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "Дата",
    "Тип",
    "Имя",
    "Телефон",
    "E-mail",
    "Товар",
    "Количество",
    "Тема",
    "Сообщение",
    "Язык",
    "Email отправлен",
    "WhatsApp отправлен",
    "Спам",
  ];

  const lines = [
    header.map(csvCell).join(","),
    ...rows.map((r) =>
      [
        r.createdAt.toISOString(),
        r.type === "ORDER" ? "Заказ" : "Сообщение",
        r.name,
        r.phone,
        r.email,
        r.productName,
        r.quantity,
        r.subject,
        r.message,
        r.locale,
        r.notifiedEmail ? "да" : "нет",
        r.notifiedWhatsapp ? "да" : "нет",
        r.isSpam ? "да" : "нет",
      ]
        .map(csvCell)
        .join(","),
    ),
  ];

  // UTF-8 BOM so Excel on Windows reads the Cyrillic correctly instead of
  // showing mojibake.
  const csv = `﻿${lines.join("\r\n")}`;
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="nesilcoffee-submissions-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
