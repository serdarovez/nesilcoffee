"use server";

import { revalidateContent } from "@/server/revalidate";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/guard";
import { TAGS } from "@/server/cache-tags";
import {
  type FormState,
  fieldErrors,
  localizedRequired,
  readLocalized,
  readString,
  readBool,
} from "@/server/form";

/* -------------------------------------------------------------------------- */
/*  Team                                                                      */
/* -------------------------------------------------------------------------- */

const teamSchema = z.object({
  name: localizedRequired,
  role: localizedRequired,
  phone: z.string().nullable(),
  email: z.string().email("Некорректный e-mail").nullable().or(z.literal(null)),
  avatarId: z.string().nullable(),
  isActive: z.boolean(),
});

export async function saveTeamMember(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const id = readString(formData, "id");

  const parsed = teamSchema.safeParse({
    name: readLocalized(formData, "name"),
    role: readLocalized(formData, "role"),
    phone: readString(formData, "phone"),
    email: readString(formData, "email"),
    avatarId: readString(formData, "avatarId"),
    isActive: readBool(formData, "isActive"),
  });
  if (!parsed.success) return fieldErrors(parsed.error);

  if (id) {
    await prisma.teamMember.update({ where: { id }, data: parsed.data });
  } else {
    const last = await prisma.teamMember.findFirst({
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    await prisma.teamMember.create({
      data: { ...parsed.data, sortOrder: (last?.sortOrder ?? -1) + 1 },
    });
  }

  revalidateContent(TAGS.team);
  redirect("/admin/team");
}

export async function toggleTeamMember(id: string): Promise<void> {
  await requireAdmin();
  const c = await prisma.teamMember.findUnique({ where: { id }, select: { isActive: true } });
  if (!c) return;
  await prisma.teamMember.update({ where: { id }, data: { isActive: !c.isActive } });
  revalidateContent(TAGS.team);
}

export async function deleteTeamMember(id: string): Promise<void> {
  await requireAdmin();
  await prisma.teamMember.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
  revalidateContent(TAGS.team);
}

export async function restoreTeamMember(id: string): Promise<void> {
  await requireAdmin();
  await prisma.teamMember.update({ where: { id }, data: { deletedAt: null } });
  revalidateContent(TAGS.team);
}

export async function moveTeamMember(id: string, direction: -1 | 1): Promise<void> {
  await requireAdmin();
  const all = await prisma.teamMember.findMany({
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  const i = all.findIndex((x) => x.id === id);
  const t = i + direction;
  if (i === -1 || t < 0 || t >= all.length) return;
  [all[i], all[t]] = [all[t], all[i]];
  await prisma.$transaction(
    all.map((x, n) => prisma.teamMember.update({ where: { id: x.id }, data: { sortOrder: n } })),
  );
  revalidateContent(TAGS.team);
}

/* -------------------------------------------------------------------------- */
/*  FAQ                                                                       */
/* -------------------------------------------------------------------------- */

const faqSchema = z.object({
  question: localizedRequired,
  answer: localizedRequired,
  isActive: z.boolean(),
});

export async function saveFaqItem(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const id = readString(formData, "id");

  const parsed = faqSchema.safeParse({
    question: readLocalized(formData, "question"),
    answer: readLocalized(formData, "answer"),
    isActive: readBool(formData, "isActive"),
  });
  if (!parsed.success) return fieldErrors(parsed.error);

  if (id) {
    await prisma.faqItem.update({ where: { id }, data: parsed.data });
  } else {
    const last = await prisma.faqItem.findFirst({
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    await prisma.faqItem.create({
      data: { ...parsed.data, sortOrder: (last?.sortOrder ?? -1) + 1 },
    });
  }

  revalidateContent(TAGS.faq);
  redirect("/admin/faq");
}

export async function toggleFaqItem(id: string): Promise<void> {
  await requireAdmin();
  const c = await prisma.faqItem.findUnique({ where: { id }, select: { isActive: true } });
  if (!c) return;
  await prisma.faqItem.update({ where: { id }, data: { isActive: !c.isActive } });
  revalidateContent(TAGS.faq);
}

export async function deleteFaqItem(id: string): Promise<void> {
  await requireAdmin();
  await prisma.faqItem.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
  revalidateContent(TAGS.faq);
}

export async function restoreFaqItem(id: string): Promise<void> {
  await requireAdmin();
  await prisma.faqItem.update({ where: { id }, data: { deletedAt: null } });
  revalidateContent(TAGS.faq);
}

export async function moveFaqItem(id: string, direction: -1 | 1): Promise<void> {
  await requireAdmin();
  const all = await prisma.faqItem.findMany({
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  const i = all.findIndex((x) => x.id === id);
  const t = i + direction;
  if (i === -1 || t < 0 || t >= all.length) return;
  [all[i], all[t]] = [all[t], all[i]];
  await prisma.$transaction(
    all.map((x, n) => prisma.faqItem.update({ where: { id: x.id }, data: { sortOrder: n } })),
  );
  revalidateContent(TAGS.faq);
}

/* -------------------------------------------------------------------------- */
/*  Certificates                                                              */
/* -------------------------------------------------------------------------- */

const certSchema = z.object({
  name: localizedRequired,
  description: localizedRequired,
  imageId: z.string().nullable(),
  isActive: z.boolean(),
});

export async function saveCertificate(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const id = readString(formData, "id");

  const parsed = certSchema.safeParse({
    name: readLocalized(formData, "name"),
    description: readLocalized(formData, "description"),
    imageId: readString(formData, "imageId"),
    isActive: readBool(formData, "isActive"),
  });
  if (!parsed.success) return fieldErrors(parsed.error);

  if (id) {
    await prisma.certificate.update({ where: { id }, data: parsed.data });
  } else {
    const last = await prisma.certificate.findFirst({
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    await prisma.certificate.create({
      data: { ...parsed.data, sortOrder: (last?.sortOrder ?? -1) + 1 },
    });
  }

  revalidateContent(TAGS.certificates);
  redirect("/admin/certificates");
}

export async function toggleCertificate(id: string): Promise<void> {
  await requireAdmin();
  const c = await prisma.certificate.findUnique({ where: { id }, select: { isActive: true } });
  if (!c) return;
  await prisma.certificate.update({ where: { id }, data: { isActive: !c.isActive } });
  revalidateContent(TAGS.certificates);
}

export async function deleteCertificate(id: string): Promise<void> {
  await requireAdmin();
  await prisma.certificate.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
  revalidateContent(TAGS.certificates);
}

export async function restoreCertificate(id: string): Promise<void> {
  await requireAdmin();
  await prisma.certificate.update({ where: { id }, data: { deletedAt: null } });
  revalidateContent(TAGS.certificates);
}

export async function moveCertificate(id: string, direction: -1 | 1): Promise<void> {
  await requireAdmin();
  const all = await prisma.certificate.findMany({
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  const i = all.findIndex((x) => x.id === id);
  const t = i + direction;
  if (i === -1 || t < 0 || t >= all.length) return;
  [all[i], all[t]] = [all[t], all[i]];
  await prisma.$transaction(
    all.map((x, n) => prisma.certificate.update({ where: { id: x.id }, data: { sortOrder: n } })),
  );
  revalidateContent(TAGS.certificates);
}
