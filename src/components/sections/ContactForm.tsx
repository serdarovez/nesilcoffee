"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, AlertCircle } from "lucide-react";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export function ContactForm({ variant = "light" }: { variant?: "light" | "dark" }) {
  const t = useTranslations("form");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">(
    "idle",
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
      reset();
    } catch {
      setStatus("error");
    }
  };

  const labelColor =
    variant === "dark" ? "text-white/60" : "text-muted-foreground";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 w-full"
      noValidate
    >
      <div>
        <Input
          {...register("name")}
          placeholder={t("name")}
          aria-invalid={!!errors.name}
          className={cn(errors.name && "border-destructive")}
        />
        {errors.name && (
          <p className={cn("mt-1.5 text-xs", labelColor)}>
            {t("validation.required")}
          </p>
        )}
      </div>
      <div>
        <Input
          type="email"
          {...register("email")}
          placeholder={t("email")}
          aria-invalid={!!errors.email}
          className={cn(errors.email && "border-destructive")}
        />
        {errors.email && (
          <p className={cn("mt-1.5 text-xs", labelColor)}>
            {t("validation.email")}
          </p>
        )}
      </div>
      <div>
        <Input
          {...register("subject")}
          placeholder={t("subject")}
          aria-invalid={!!errors.subject}
          className={cn(errors.subject && "border-destructive")}
        />
        {errors.subject && (
          <p className={cn("mt-1.5 text-xs", labelColor)}>
            {t("validation.required")}
          </p>
        )}
      </div>
      <div>
        <Textarea
          {...register("message")}
          placeholder={t("message")}
          aria-invalid={!!errors.message}
          className={cn(errors.message && "border-destructive")}
        />
        {errors.message && (
          <p className={cn("mt-1.5 text-xs", labelColor)}>
            {t("validation.required")}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-2">
        <Button
          type="submit"
          variant="dark"
          disabled={status === "sending"}
          className="w-full sm:w-auto"
        >
          {status === "sending" ? t("sending") : t("send")}
        </Button>
        {status === "success" && (
          <span className="inline-flex items-center gap-2 text-sm text-emerald-600">
            <Check className="h-4 w-4" />
            {t("success")}
          </span>
        )}
        {status === "error" && (
          <span className="inline-flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {t("error")}
          </span>
        )}
      </div>
    </form>
  );
}
