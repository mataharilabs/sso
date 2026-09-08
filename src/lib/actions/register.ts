"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

const registerSchema = z.object({
  companyName: z.string().min(2, "Nama perusahaan minimal 2 karakter"),
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export type RegisterState = { error?: string; success?: boolean };

export async function registerCompany(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    companyName: formData.get("companyName"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const { companyName, name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Email sudah terdaftar" };

  let slug = slugify(companyName);
  if (await prisma.company.findUnique({ where: { slug } }))
    slug = `${slug}-${Date.now().toString(36)}`;

  const hashed = await bcrypt.hash(password, 10);

  await prisma.company.create({
    data: {
      name: companyName,
      slug,
      users: {
        create: {
          name,
          email,
          password: hashed,
          isSuperAdmin: true,
        },
      },
    },
  });

  return { success: true };
}
