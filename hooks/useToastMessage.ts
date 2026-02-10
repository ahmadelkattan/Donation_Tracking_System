// 'use client';
//
// import { useState, useCallback } from 'react'
//
// export interface ToastMessage {
//   id: string
//   message: string
//   type: 'success' | 'error' | 'info'
// }
//
// export function useToastMessage() {
//   const [toasts, setToasts] = useState<ToastMessage[]>([])
//
//   const addToast = useCallback(
//     (message: string, type: 'success' | 'error' | 'info' = 'info') => {
//       const id = Date.now().toString()
//       const toast: ToastMessage = { id, message, type }
//       setToasts((prev) => [...prev, toast])
//
//       setTimeout(() => {
//         setToasts((prev) => prev.filter((t) => t.id !== id))
//       }, 3000)
//     },
//     []
//   )
//
//   const removeToast = useCallback((id: string) => {
//     setToasts((prev) => prev.filter((t) => t.id !== id))
//   }, [])
//
//   return { toasts, addToast, removeToast }
// }
'use client'

import { useCallback, useRef, useState } from 'react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
    id: string
    message: string
    type: ToastType
}

export function useToastMessage() {
    const [toasts, setToasts] = useState<ToastItem[]>([])
    const counterRef = useRef(0)

    const addToast = useCallback((message: string, type: ToastType = 'info') => {
        counterRef.current += 1

        // Unique id even if called multiple times in the same millisecond
        const id = `${Date.now()}-${counterRef.current}-${Math.random().toString(16).slice(2)}`

        setToasts((prev) => [...prev, { id, message, type }])

        // Auto-remove
        window.setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, 3500)
    }, [])

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    return { toasts, addToast, removeToast }
}
