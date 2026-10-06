import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const COOKIE = "footwear_session";
const DAYS = 7;

export type UserRoleName = "OWNER" | "MANAGER" | "STAFF";
export type Permission =
  | "sell"
  | "manage_products"
  | "manage_stock"
  | "view_reports"
  | "manage_customers"
  | "manage_users"
  | "manage_settings";

const ROLE_PERMISSIONS: Record<UserRoleName, Permission[]> = {
  OWNER: [
    "sell",
    "manage_products",
    "manage_stock",
    "view_reports",
    "manage_customers",
    "manage_users",
    "manage_settings",
  ],
  MANAGER: [
    "sell",
    "manage_products",
    "manage_stock",
    "view_reports",
    "manage_customers",
    "manage_settings",
  ],
  STAFF: ["sell", "manage_customers"],
};

function hash(value: string) { return crypto.createHash("sha256").update(value).digest("hex"); }
export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  await prisma.session.create({ data: { userId, tokenHash: hash(token), expiresAt: new Date(Date.now() + DAYS * 86400000) } });
  const jar = await cookies();
  jar.set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: DAYS * 86400 });
}
export async function clearSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hash(token) } });
  jar.delete(COOKIE);
}
export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { tokenHash: hash(token) }, include: { user: { include: { shop: true } } } });
  if (!session || session.expiresAt <= new Date() || !session.user.isActive) return null;
  return session.user;
}
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export function hasPermission(user: { role: UserRoleName }, permission: Permission) {
  return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
}

export async function requirePermission(permission: Permission | Permission[]) {
  const user = await requireUser();
  const permissions = Array.isArray(permission) ? permission : [permission];
  if (!permissions.every((entry) => hasPermission(user, entry))) {
    redirect("/dashboard");
  }
  return user;
}

export async function requireAnyPermission(permission: Permission | Permission[]) {
  const user = await requireUser();
  const permissions = Array.isArray(permission) ? permission : [permission];
  if (!permissions.some((entry) => hasPermission(user, entry))) {
    redirect("/dashboard");
  }
  return user;
}

export async function requireRole(roles: Array<UserRoleName>) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}
