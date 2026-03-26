'use client'

import { useToast } from '@/hooks/use-toast'
import { Toast } from '@/components/ui/toast'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <>
      {toasts.map(({ id, title, description }) => {
          const stringId = String(id);
          const stringTitle = String(title ?? 'Notificación');
          const stringDescription = description != null ? String(description) : stringId;
          
          return (
            <Toast 
              key={stringId} 
              title={stringTitle} 
              description={stringDescription} 
            />
          );
        })}
    </>
  )
}
