import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth/session";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Вход" };

export default async function LoginPage() {
  // Already signed in — skip the form rather than showing it pointlessly.
  const user = await getSessionUser();
  if (user) redirect("/admin");

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-12">
      <div className="w-full max-w-100">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Image
            src="/logo-mark.png"
            alt="NesilCoffee"
            width={72}
            height={72}
            priority
            className="h-16 w-auto object-contain"
          />
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-3xl font-bold uppercase leading-none tracking-tight text-ink">
              Панель управления
            </h1>
            <p className="text-sm text-ink-3">
              Войдите, чтобы управлять содержимым сайта
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-paper p-6 shadow-sm md:p-8">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
