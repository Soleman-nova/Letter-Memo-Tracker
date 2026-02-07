import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext()

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Helper to parse API error responses into user-friendly messages
export function parseApiError(error) {
  if (!error) return 'An error occurred'
  
  // If it's an axios error with response data
  const data = error.response?.data || error
  
  if (typeof data === 'string') return data
  
  // Handle Django REST Framework validation errors
  if (typeof data === 'object') {
    const messages = []
    for (const [field, errors] of Object.entries(data)) {
      if (Array.isArray(errors)) {
        // Field-specific errors like {ref_no: ["A document with this reference number already exists"]}
        const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        errors.forEach(err => messages.push(`${fieldName}: ${err}`))
      } else if (typeof errors === 'string') {
        // Simple field error
        const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        messages.push(`${fieldName}: ${errors}`)
      } else if (field === 'detail') {
        // DRF detail message
        messages.push(errors)
      } else if (field === 'non_field_errors' && Array.isArray(errors)) {
        errors.forEach(err => messages.push(err))
      }
    }
    if (messages.length > 0) return messages.join('\n')
  }
  
  return error.message || 'An error occurred'
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }
    
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const success = useCallback((message, duration) => addToast(message, 'success', duration), [addToast])
  const error = useCallback((message, duration) => addToast(message, 'error', duration ?? 8000), [addToast])
  const warning = useCallback((message, duration) => addToast(message, 'warning', duration), [addToast])
  const info = useCallback((message, duration) => addToast(message, 'info', duration), [addToast])

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info, parseApiError }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, removeToast }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function Toast({ toast, onClose }) {
  const { message, type } = toast

  const styles = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/90',
      border: 'border-green-200 dark:border-green-700',
      text: 'text-green-800 dark:text-green-200',
      icon: <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0" />,
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/90',
      border: 'border-red-200 dark:border-red-700',
      text: 'text-red-800 dark:text-red-200',
      icon: <XCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" />,
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/90',
      border: 'border-amber-200 dark:border-amber-700',
      text: 'text-amber-800 dark:text-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0" />,
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/90',
      border: 'border-blue-200 dark:border-blue-700',
      text: 'text-blue-800 dark:text-blue-200',
      icon: <Info className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0" />,
    },
  }

  const s = styles[type] || styles.info

  return (
    <div
      className={`${s.bg} ${s.border} ${s.text} border rounded-lg shadow-lg p-4 flex items-start gap-3 animate-slide-in`}
      role="alert"
    >
      {s.icon}
      <div className="flex-1 text-sm font-medium whitespace-pre-line">{message}</div>
      <button
        onClick={onClose}
        className={`${s.text} hover:opacity-70 transition-opacity flex-shrink-0`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export default ToastProvider
