import { z } from "zod";

const emptyToNull = (v: unknown) => (v === "" || v === undefined ? null : v);
const opt = () => z.preprocess(emptyToNull, z.string().nullable().optional());

export const userProfileSchema = z.object({
  nickname: opt(),
  birthPlace: opt(),
  birthDate: opt(),
  gender: z.preprocess(emptyToNull, z.enum(["MALE", "FEMALE"]).nullable().optional()),
  maritalStatus: z.preprocess(
    emptyToNull,
    z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]).nullable().optional()
  ),
  nik: opt(),
  kkNumber: opt(),
  npwp: opt(),
  passportNumber: opt(),
  addressKtp: opt(),
  addressDomicile: opt(),
  personalEmail: z.preprocess(
    emptyToNull,
    z.string().email("Email pribadi tidak valid").nullable().optional()
  ),
  emergencyName: opt(),
  emergencyRelation: opt(),
  emergencyPhone: opt(),
  employeeId: opt(),
  jobTitle: opt(),
  departmentId: opt(),
  level: opt(),
  officeId: opt(),
  joinDate: opt(),
  endDate: opt(),
  employmentStatus: z.preprocess(
    emptyToNull,
    z.enum(["PERMANENT", "CONTRACT", "INTERNSHIP", "FREELANCE"]).nullable().optional()
  ),

  // Domisili
  domicileCountry: opt(),
  domicileProvince: opt(),
  domicileCity: opt(),
});

// Role per aplikasi: { ASET: "ASSET_MANAGER", HRIS: "" } — "" berarti tanpa akses
const appRolesSchema = z.record(z.string(), z.string()).optional();

export const createUserSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  isSuperAdmin: z.boolean().optional(),
  phone: opt(),
  reportsToId: opt(),
  profile: userProfileSchema.optional(),
  appRoles: appRolesSchema,
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.preprocess(
    emptyToNull,
    z.string().min(6, "Password minimal 6 karakter").nullable().optional()
  ),
  isActive: z.boolean().optional(),
  isSuperAdmin: z.boolean().optional(),
  phone: opt(),
  reportsToId: opt(),
  profile: userProfileSchema.optional(),
  appRoles: appRolesSchema,
});

export type UserProfileInput = z.infer<typeof userProfileSchema>;

export function profileToPrisma(
  profile: UserProfileInput | undefined
): Record<string, unknown> {
  if (!profile) return {};
  const dateFields = ["birthDate", "joinDate", "endDate"];
  const out: Record<string, unknown> = { ...profile };
  for (const f of dateFields) {
    const v = out[f];
    out[f] = v ? new Date(v as string) : null;
  }
  return out;
}
