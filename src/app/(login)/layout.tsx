import { Plus_Jakarta_Sans } from "next/font/google";
import "./login.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

// Layout khusus halaman login (dua kolom: panel merek + formulir).
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={`lgn ${jakarta.variable}`}>{children}</div>;
}
