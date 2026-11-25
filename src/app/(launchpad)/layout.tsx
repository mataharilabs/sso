import { redirect } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";
import { getCurrentUser } from "@/lib/session";
import "./launchpad.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

// Layout khusus launchpad SSO (/dash): tanpa chrome admin, header sendiri.
export default async function LaunchpadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <div className={`lp ${jakarta.variable}`}>{children}</div>;
}
