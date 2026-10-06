"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAnyPermission, requirePermission } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  gstNumber: z.string().optional(),
});

export async function createCustomer(formData: FormData) {
  const user = await requireAnyPermission(["sell", "manage_customers"]);
  const data = contactSchema.parse(Object.fromEntries(formData.entries()));

  await prisma.customer.create({
    data: {
      shopId: user.shopId,
      name: data.name,
      phone: data.phone || undefined,
      email: data.email || undefined,
      address: data.address || undefined,
    },
  });

  redirect("/customers");
}

export async function createSupplier(formData: FormData) {
  const user = await requirePermission("manage_stock");
  const data = contactSchema.parse(Object.fromEntries(formData.entries()));

  await prisma.supplier.create({
    data: {
      shopId: user.shopId,
      name: data.name,
      phone: data.phone || undefined,
      email: data.email || undefined,
      address: data.address || undefined,
      gstNumber: data.gstNumber || undefined,
    },
  });

  redirect("/suppliers");
}

export async function createUser(formData: FormData) {
  const owner = await requirePermission("manage_users");

  const role = z.enum(["OWNER", "MANAGER", "STAFF"]).parse(String(formData.get("role")));
  const name = z.string().min(1, "Name is required").parse(String(formData.get("name")));
  const email = z.string().email("Invalid email address").parse(String(formData.get("email")));
  const password = z.string().min(8, "Password must be at least 8 characters").parse(String(formData.get("password")));

  await prisma.user.create({
    data: {
      shopId: owner.shopId,
      name,
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      role,
    },
  });

  redirect("/settings");
}
