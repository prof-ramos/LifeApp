import type { ReactNode } from 'react';
import { Pressable, Text, type PressableProps } from 'react-native';
import { cn } from '../../lib/cn';

type Variant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'default' | 'lg' | 'icon';

const variantClass: Record<Variant,string> = {
  default: 'bg-primary', secondary: 'bg-secondary', outline: 'border border-border bg-transparent', ghost: 'bg-transparent', destructive: 'bg-destructive',
};
const textClass: Record<Variant,string> = {
  default: 'text-primary-foreground', secondary: 'text-secondary-foreground', outline: 'text-foreground', ghost: 'text-foreground', destructive: 'text-white',
};
const sizeClass: Record<Size,string> = {
  sm: 'min-h-10 px-3', default: 'min-h-12 px-4', lg: 'min-h-12 px-6', icon: 'h-12 w-12 px-0',
};

export type ButtonProps = PressableProps & { children: ReactNode; variant?: Variant; size?: Size; className?: string };

export function Button({ children, variant='default', size='default', className, disabled, ...props }: ButtonProps) {
  return <Pressable accessibilityRole="button" disabled={disabled} className={cn('items-center justify-center rounded-md active:opacity-80', variantClass[variant], sizeClass[size], disabled && 'opacity-50', className)} {...props}><Text className={cn('text-sm font-black', textClass[variant])}>{children}</Text></Pressable>;
}
