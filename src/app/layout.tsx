import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { AppProvider } from "@/lib/store";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PsicoGestión",
  description: "Gestión profesional para psicólogos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-slate-50`}>
        <AppProvider>
          <Sidebar />
          <main className="ml-0 md:ml-60 min-h-screen pb-20 md:pb-0">{children}</main>
        </AppProvider>
      </body>
    </html>
  );
}
