'use client'
import { ReactNode } from 'react'

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
if (!open) return null
return (
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
<div className="bg-white rounded-2xl p-6 shadow-2xl min-w-[320px] max-w-lg">
{title && <h2 className="text-lg font-semibold mb-4">{title}</h2>}
<button onClick={onClose} className="absolute right-4 top-4 text-gray-500 hover:text-gray-700">✕</button>
{children}
</div>
</div>
)
}