"use client"

import { useState, useCallback } from "react"
import { ToastType } from "../components/ui/Toast"

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback(
    ({
      type,
      title,
      message,
      duration = 4000,
    }: {
      type: ToastType
      title: string
      message?: string
      duration?: number
    }) => {
      const id = Math.random().toString(36).substr(2, 9)
      const newToast: Toast = {
        id,
        type,
        title,
        message,
        duration,
      }

      setToasts((prev) => [...prev, newToast])
      return id
    },
    []
  )

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const success = useCallback(
    (title: string, message?: string, duration?: number) => {
      return addToast({ type: "success", title, message, duration })
    },
    [addToast]
  )

  const error = useCallback(
    (title: string, message?: string, duration?: number) => {
      return addToast({ type: "error", title, message, duration })
    },
    [addToast]
  )

  const warning = useCallback(
    (title: string, message?: string, duration?: number) => {
      return addToast({ type: "warning", title, message, duration })
    },
    [addToast]
  )

  const info = useCallback(
    (title: string, message?: string, duration?: number) => {
      return addToast({ type: "info", title, message, duration })
    },
    [addToast]
  )

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  }
}