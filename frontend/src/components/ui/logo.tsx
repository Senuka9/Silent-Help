import Image from 'next/image';
import { cn } from '@/lib/cn';

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
  withWordmark?: boolean;
}

export function Logo({ size = 40, withWordmark, className, ...props }: LogoProps) {
  return (
    <div className={cn('inline-flex items-center gap-3', className)} {...props}>
      <Image
        src="/logo.png"
        alt="Silent Help"
        width={size}
        height={size}
        className="rounded-full object-contain"
        priority
      />
      {withWordmark && (
        <span className="text-[1.05rem] font-semibold tracking-tight text-[color:var(--color-fg)]">
          Silent Help
        </span>
      )}
    </div>
  );
}
