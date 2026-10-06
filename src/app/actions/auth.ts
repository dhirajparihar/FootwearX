"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, clearSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
const schema = z.object({ email: z.string().email(), password: z.string().min(6) });
export async function login(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) redirect("/login?error=Invalid%20login");
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase().trim() } });
  if (!user || !user.isActive || !verifyPassword(parsed.data.password, user.passwordHash)) redirect("/login?error=Invalid%20email%20or%20password");
  await createSession(user.id);
  redirect("/dashboard");
}
export async function logout() { await clearSession(); redirect("/login"); }
