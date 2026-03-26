'use client'
import { useEffect, useState } from 'react'


export function Toast({ message }: { message: string }) {
const [show, setShow] = useState(true)
useEffect(() => { const t = setTimeout(() => setShow(false), 2500); return () => clearTimeout(t) }, [])
if (!show) return null
return <div className="fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded-md shadow-lg">{message}</div>
}