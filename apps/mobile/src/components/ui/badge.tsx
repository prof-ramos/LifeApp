import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { cn } from '../../lib/cn';

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={cn('self-start rounded-full bg-primary/10 px-2.5 py-1', className)}><Text className="text-xs font-black text-primary">{children}</Text></View>;
}
