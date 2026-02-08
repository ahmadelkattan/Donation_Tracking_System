'use client'

import { ToastMessage } from '@/hooks/useToastMessage'
import { X } from 'lucide-react'

interface ToastProps {
  toasts: ToastMessage[]
  onRemove: (id: string) => void
}

export function Toast({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg p-4 text-sm font-medium flex items-center justify-between gap-2 min-w-[250px] ${
            toast.type === 'success'
              ? 'bg-green-500 text-white'
              : toast.type === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-blue-500 text-white'
          }`}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => onRemove(toast.id)}
            className="hover:opacity-80 transition"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
