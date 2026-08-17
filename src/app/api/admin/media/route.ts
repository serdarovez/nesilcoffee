import { NextResponse } from "next/server";
import { getApiUser } from "@/server/auth/guard";
import { prisma } from "@/server/db";

const PAGE_SIZE = 40;

/** Paginated media library, newest first — backs the picker's browse tab. */
export async function GET(request: Request) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
  const search = searchParams.get("q")?.trim();

  const where = search
    ? { path: { contains: search, mode: "insensitive" as const } }
    : {};

  const [items, total] = await Promise.all([
    prisma.media.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        path: true,
        width: true,
        height: true,
        blurDataUrl: true,
        bytes: true,
      },
    }),
    prisma.media.count({ where }),
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    hasMore: page * PAGE_SIZE < total,
  });
}
