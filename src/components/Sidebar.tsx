"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, CalendarDays, Users, CreditCard, Settings, Brain, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/",          icon: LayoutDashboard, label: "Inicio"    },
  { href: "/agenda",    icon: CalendarDays,    label: "Agenda"    },
  { href: "/pacientes", icon: Users,           label: "Pacientes" },
  { href: "/cobros",    icon: CreditCard,      label: "Cobros"    },
  { href: "/ajustes",   icon: Settings,        label: "Ajustes"   },
];

export default function Sidebar() {
  const path     = usePathname();
  const router   = useRouter();
  const supabase = createClient();

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (path === "/login") return null;

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-slate-100 flex flex-col z-10">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-slate-800 text-sm leading-tight">PsicoGestión</p>
          <p className="text-xs text-slate-400">Panel profesional</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ href, icon: Icon, label }) => {
          const active = path === href;
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? "bg-violet-50 text-violet-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}>
              <Icon className={`w-4 h-4 ${active ? "text-violet-600" : "text-slate-400"}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-slate-100 space-y-2">
        <button onClick={cerrarSesion}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors">
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
