import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { WellnessProvider } from '@/components/wellness/WellnessProvider';
import { AccessibilityProvider } from '@/components/a11y/AccessibilityProvider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import ServiceWorkerRegister from '@/components/offline/ServiceWorkerRegister';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Silent Help · The quiet place between you and the storm',
  description:
    'A private, pathway-aware mental-health companion. Encrypted journalling, AI support, offline-first calm tools and a UK crisis safety net.',
  openGraph: {
    title: 'Silent Help',
    description:
      'A private mental-health companion. Pathway-aware support, encrypted journalling, and a crisis safety net — calm in under a minute.',
    siteName: 'Silent Help',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Silent Help',
    description:
      'A private mental-health companion. Pathway-aware support, encrypted journalling, and a crisis safety net.',
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://silent-help.vercel.app'),
};

export const viewport: Viewport = {
  themeColor: '#05070d',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#7dd3fc',
          colorBackground: '#0f172a',
          colorInputBackground: 'rgba(255,255,255,0.06)',
          colorInputText: '#f1f5f9',
          colorText: '#f1f5f9',
          colorTextSecondary: '#94a3b8',
          colorNeutral: '#cbd5e1',
          borderRadius: '14px',
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        },
        elements: {
          rootBox: 'w-full',
          card: 'bg-[#0f172a] border border-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-xl rounded-2xl',
          cardBox: 'shadow-none',
          headerTitle: 'text-2xl font-semibold tracking-tight !text-white',
          headerSubtitle: '!text-slate-300',
          socialButtonsBlockButton:
            'bg-white/[0.05] border border-white/[0.1] !text-slate-200 hover:bg-white/[0.1] hover:border-white/[0.2] hover:!text-white',
          socialButtonsBlockButtonText: '!text-slate-200 font-medium',
          socialButtonsProviderIcon: 'brightness-0 invert',
          dividerLine: 'bg-white/[0.08]',
          dividerText: '!text-slate-400 uppercase text-xs tracking-wider',
          formFieldLabel: '!text-slate-300 font-medium',
          formFieldInput:
            'bg-white/[0.05] border border-white/[0.1] !text-white placeholder:!text-slate-500 focus:border-[#7dd3fc]/50 focus:ring-1 focus:ring-[#7dd3fc]/30',
          formFieldHintText: '!text-slate-400',
          formFieldInfoText: '!text-slate-400',
          formFieldWarningText: '!text-amber-400',
          formFieldErrorText: '!text-rose-400',
          formButtonPrimary:
            'bg-gradient-to-br from-[#7dd3fc] to-[#a78bfa] !text-slate-950 font-semibold hover:shadow-lg hover:shadow-sky-500/20 normal-case',
          formButtonReset: '!text-slate-400 hover:!text-white',
          footerActionLink: '!text-[#7dd3fc] hover:!text-[#a78bfa] font-medium',
          footerActionText: '!text-slate-400',
          footerAction: '!text-slate-400',
          identityPreviewText: '!text-slate-300',
          identityPreviewEditButton: '!text-[#7dd3fc] hover:!text-white',
          formResendCodeLink: '!text-[#7dd3fc] hover:!text-white',
          otpCodeFieldInput: 'bg-white/[0.05] border border-white/[0.1] !text-white',
          alertText: '!text-slate-300',
          alert: '!text-slate-300',
          modalCloseButton: '!text-slate-400 hover:!text-white',
          modalBackdrop: 'backdrop-blur-sm bg-black/60',
          userButtonPopoverCard: 'bg-[#0f172a] border border-white/[0.08]',
          userButtonPopoverActionButton: '!text-slate-300 hover:bg-white/[0.06]',
          userButtonPopoverActionButtonText: '!text-slate-300',
          userButtonPopoverActionButtonIcon: '!text-slate-400',
          userButtonPopoverFooter: 'hidden',
          selectButton: 'bg-white/[0.05] border border-white/[0.1] !text-white',
          selectOptionsContainer: 'bg-[#0f172a] border border-white/[0.1]',
          selectOption: '!text-slate-300 hover:bg-white/[0.06]',
          badge: '!text-[#7dd3fc] bg-[#7dd3fc]/10 border-[#7dd3fc]/20',
          tagInputContainer: 'bg-white/[0.05] border border-white/[0.1]',
          providerIcon: 'brightness-0 invert',
        },
      }}
    >
      <html lang="en" className={inter.variable} suppressHydrationWarning>
        <body className="font-sans antialiased">
          <TooltipProvider delayDuration={200}>
            <AccessibilityProvider>
              <WellnessProvider>
                {children}
                <Toaster />
                <ServiceWorkerRegister />
              </WellnessProvider>
            </AccessibilityProvider>
          </TooltipProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
