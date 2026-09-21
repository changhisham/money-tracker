import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, XCircle, Info } from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: 'border-success/30 text-ink',
  error: 'border-red-500/30 text-ink',
  info: 'border-blue-500/30 text-ink',
}

const VARIANT_ICON: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

const VARIANT_ICON_COLOR: Record<ToastVariant, string> = {
  success: 'text-success',
  error: 'text-red-400',
  info: 'text-blue-400',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = nextId.current++
    setToasts((prev) => [...prev, { id, message, variant }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:px-6"
      >
        {toasts.map((toast) => {
          const Icon = VARIANT_ICON[toast.variant]
          return (
            <div
              key={toast.id}
              role="status"
              className={`animate-fade-in pointer-events-auto flex items-center gap-2 rounded-xl border bg-surface px-4 py-2.5 text-sm font-medium shadow-lg ${VARIANT_STYLES[toast.variant]}`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${VARIANT_ICON_COLOR[toast.variant]}`} aria-hidden />
              {toast.message}
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
