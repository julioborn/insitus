"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/home",    icon: "🏠", label: "Inicio" },
  { href: "/matches", icon: "💬", label: "Matches" },
  { href: "/profile/me", icon: "👤", label: "Perfil" },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 safe-bottom flex items-center justify-around px-2 py-3"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.08)" }}
    >
      {ITEMS.map(item => {
        const active = path.startsWith(item.href);
        return (
          <Link
            key={item.href} href={item.href}
            className="flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-colors"
            style={{ color: active ? "#8296E3" : "rgba(255,255,255,0.40)" }}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
