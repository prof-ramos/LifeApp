import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Life Super App',
  description: 'Vida condominial, comunidade e marketplace em um só lugar.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" className="dark"><body>{children}</body></html>;
}
