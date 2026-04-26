'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  MessageSquare,
  BookText,
  Sparkles,
  Compass,
  User,
  LifeBuoy,
  ChevronRight,
  Mail,
  Activity,
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import type { EmotionTheme } from '@/lib/emotion-theme';

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/chat', icon: MessageSquare, label: 'Conversations' },
  { href: '/journal', icon: BookText, label: 'Journal' },
  { href: '/tools', icon: Sparkles, label: 'Tools' },
  { href: '/letters', icon: Mail, label: 'Letters' },
  { href: '/clinical', icon: Activity, label: 'Check-ins' },
  { href: '/onboarding', icon: Compass, label: 'Re-assess' },
];

interface SidebarProps {
  theme: EmotionTheme;
}

export function Sidebar({ theme }: SidebarProps) {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
      className="fixed inset-y-0 left-0 z-30 hidden md:flex md:left-3 md:top-3 md:bottom-3 md:w-[72px] flex-col items-center rounded-2xl border border-white/[0.08] bg-[color:var(--color-bg)]/60 shadow-2xl shadow-black/20 backdrop-blur-2xl"
    >
      <div className="flex h-[68px] w-full items-center justify-center border-b border-white/[0.04]">
        <Link href="/dashboard" aria-label="Silent Help">
          <Logo size={30} />
        </Link>
      </div>

      <nav className="flex flex-1 flex-col items-center gap-1 py-4">
        {NAV.map((item) => {
          const active =
            pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'relative flex h-10 w-10 items-center justify-center rounded-xl text-[color:var(--color-fg-muted)] transition-all duration-300',
                    'hover:bg-white/[0.06] hover:text-[color:var(--color-fg)]',
                    active && 'text-[color:var(--color-fg)]',
                  )}
                  style={active ? { background: `${theme.soft}` } : undefined}
                >
                  {active && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute -left-[5px] top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full"
                      style={{ background: theme.gradient }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <item.icon className="h-[18px] w-[18px]" strokeWidth={active ? 2 : 1.6} />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <div className="flex flex-col items-center gap-1.5 pb-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/sos"
              className={cn(
                'group relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all',
                'border-[color:var(--color-danger)]/20 bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)]',
                'hover:scale-105 hover:border-[color:var(--color-danger)]/40 hover:bg-[color:var(--color-danger)]/20',
              )}
            >
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--color-danger)] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--color-danger)]" />
              </span>
              <LifeBuoy className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Crisis SOS</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/profile"
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl text-[color:var(--color-fg-muted)] transition-all',
                'hover:bg-white/[0.06] hover:text-[color:var(--color-fg)]',
                pathname.startsWith('/profile') && 'bg-white/[0.06] text-[color:var(--color-fg)]',
              )}
            >
              <User className="h-[18px] w-[18px]" strokeWidth={1.6} />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Profile</TooltipContent>
        </Tooltip>
      </div>
    </motion.aside>
  );
}

export function MobileNav({ theme }: SidebarProps) {
  const pathname = usePathname();
  const items = [
    ...NAV.slice(0, 4),
    { href: '/sos', icon: LifeBuoy, label: 'SOS' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];
  return (
    <motion.nav
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.15 }}
      className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-center px-3 pb-3 md:hidden"
    >
      <div className="flex w-full max-w-md items-center justify-around rounded-2xl border border-white/[0.08] bg-[color:var(--color-bg)]/60 px-1 py-1.5 shadow-2xl shadow-black/25 backdrop-blur-2xl">
        {items.map((item) => {
          const active =
            pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const isSOS = item.href === '/sos';
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 text-[9px] font-medium uppercase tracking-wider transition-all',
                isSOS
                  ? 'text-[color:var(--color-danger)]'
                  : active
                    ? 'text-[color:var(--color-fg)]'
                    : 'text-[color:var(--color-fg-subtle)]',
              )}
            >
              {isSOS && (
                <span className="absolute top-1 right-1.5 flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--color-danger)] opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[color:var(--color-danger)]" />
                </span>
              )}
              <item.icon
                className="h-[18px] w-[18px]"
                style={active && !isSOS ? { color: theme.accent } : undefined}
                strokeWidth={active ? 2 : 1.6}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}

export { ChevronRight };
