import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { cn } from '../../lib/cn';

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={cn('rounded-lg border border-border bg-card p-5', className)}>{children}</View>;
}
export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <Text className={cn('text-lg font-black text-foreground', className)}>{children}</Text>;
}
export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <Text className={cn('text-sm leading-5 text-muted-foreground', className)}>{children}</Text>;
}
