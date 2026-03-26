'use client'

import { useToast } from '@/hooks/use-toast'
import { Toast } from '@/components/ui/toast'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <>
      {toasts.map(({ id, title, description }) => (
        <Toast 
          key={id} 
          title={title ?? 'Notificación'} 
          description={description !== undefined && description !== null ? description : id} 
        />
      ))}
    </>
  )
}
