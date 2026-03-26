'use client'
import * as React from 'react'
import { cn } from '@/lib/utils'

export type ToastProps = {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}

export type ToastActionElement = React.ReactNode

export function Toast({ 
  title, 
  description, 
  action,
  ...props 
}: React.ComponentPropsWithoutRef<'div'> & ToastProps) {
  const [show, setShow] = React.useState(true)
  React.useEffect(() => { 
    const t = setTimeout(() => setShow(false), 2500); 
    return () => clearTimeout(t) 
  }, [])
  if (!show) return null
  
  return (
    <div 
      className={cn(
        'fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded-md shadow-lg',
        props.className
      )}
      {...props}
    >
      {title && <div className="mb-1 font-medium">{title}</div>}
      {description && <div className="mb-2">{description}</div>}
      {action && <div>{action}</div>}
      {!title && !description && !action && <div className="mb-2">Toast</div>}
    </div>
  )
}