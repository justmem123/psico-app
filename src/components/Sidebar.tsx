"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, CalendarDays, Users, CreditCard, Settings, Brain
} from "lucide-react";

const links = [
  { href: "/",          icon: LayoutDashboard, label: "Inicio"     },
  { href: "/agenda",    icon: CalendarDays,    label: "Agenda"     },
  { href: "/pacientes", icon: Users,           label: "Pacientes"  },
  { href: "/cobros",    icon: CreditCard,      label: "Cobros"     },
  { href: "/ajustes",   icon: Settings,        label: "Ajustes"    },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-slate-100 flex flex-col z-10">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-slate-800 text-sm leading-tight">PsicoGestión</p>
          <p className="text-xs text-slate-400">Panel profesional</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ href, icon: Icon, label }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-violet-50 text-violet-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <Icon className={`w-4.5 h-4.5 ${active ? "text-violet-600" : "text-slate-400"}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Usuario */}
      <div className="px-4 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm">
            MG
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-700 truncate">Mi cuenta</p>
            <p className="text-xs text-slate-400 truncate">Psicóloga</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
