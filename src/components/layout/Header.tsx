'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import Image from 'next/image';

type Props = {
  subtitle?: string;
};

export function Header({ subtitle = '' }: Props) {
  const { session, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleConfirmLogout = () => {
    logout();
    setOpen(false);
    router.replace('/login');
  };

  return (
    <header className="bg-white text-gray-900 shadow-lg border-b border-gray-200 sticky top-0 z-40">

      <div className="w-full max-w-none px-3 sm:px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo + titulo */}
          <div className="flex items-center gap-3">
            <Image
              src="/imagen/Logo_Valenttine.png"
              alt="Logo Valenttine"
              width={40}
              height={40}
              priority
              className="rounded-lg object-contain"
            />
            {subtitle ? (
              <p className="text-sm sm:text-base text-gray-700 font-medium">
                {subtitle}
              </p>
            ) : null}
          </div>

          {/* DERECHA: Usuario + cerrar sesión */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium text-gray-800">{session?.role}</p>
              <p className="text-sm text-gray-600">{session?.name}</p>
            </div>
            <button
              onClick={() => setOpen(true)}
              className="px-3 py-2 rounded-lg hover:bg-red-50 text-red-600"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={open}
        title="Cerrar sesión"
        description="Seguro queres cerrar la sesión?"
        confirmText="Cerrar sesión"
        cancelText="Cancelar"
        onConfirm={handleConfirmLogout}
        onCancel={() => setOpen(false)}
      />
    </header>
  );
}
