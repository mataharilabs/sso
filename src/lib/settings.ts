import { prisma } from "@/lib/prisma";

const GLOBAL_ID = "global";

export type NotificationSettingData = {
  id: string;
  whatsappEnabled: boolean;
  emailEnabled: boolean;
  emailFrom: string | null;
  whatsappPhone: string | null;
};

/** Ambil (atau buat) baris setelan notifikasi singleton. */
export async function getNotificationSetting(): Promise<NotificationSettingData> {
  const row = await prisma.notificationSetting.upsert({
    where: { id: GLOBAL_ID },
    update: {},
    create: { id: GLOBAL_ID },
  });
  return row;
}

export async function updateNotificationSetting(data: {
  whatsappEnabled?: boolean;
  emailEnabled?: boolean;
  whatsappPhone?: string | null;
}): Promise<NotificationSettingData> {
  return prisma.notificationSetting.upsert({
    where: { id: GLOBAL_ID },
    update: data,
    create: { id: GLOBAL_ID, ...data },
  });
}
