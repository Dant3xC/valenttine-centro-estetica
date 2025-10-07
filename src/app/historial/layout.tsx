import type { Metadata } from 'next';
import AuthShell from '@/components/layout/AuthShell';

export const metadata: Metadata = {
  title: 'Pacientes · ERP Valenttine',
};

export default function PacientesLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
