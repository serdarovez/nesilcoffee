import { NextResponse } from "next/server";
import { getApiUser } from "@/server/auth/guard";
import { storeUpload, MediaError } from "@/server/media";

/**
 * Admin image upload.
 *
 * Authorization is checked here rather than relying on the proxy matcher —
 * /api is excluded from it entirely, and a matcher is not an authorization
 * boundary in any case.
 */
export async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не выбран" }, { status: 400 });
  }

  const alt = form.get("alt");

  try {
    const { media } = await storeUpload(
      file,
      typeof alt === "string" ? alt : undefined,
    );

    return NextResponse.json({
      id: media.id,
      path: media.path,
      originalName: media.originalName,
      width: media.width,
      height: media.height,
      blurDataUrl: media.blurDataUrl,
      bytes: media.bytes,
    });
  } catch (error) {
    if (error instanceof MediaError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Upload failed:", error);
    return NextResponse.json(
      { error: "Не удалось загрузить файл" },
      { status: 500 },
    );
  }
}
