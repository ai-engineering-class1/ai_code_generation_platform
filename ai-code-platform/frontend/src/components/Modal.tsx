import { X } from 'lucide-react'
import { useEffect } from 'react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps) {
  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Modal Content */}
        <div
          className={`relative bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} transform transition-all`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              {title && <h2 className="text-xl font-semibold text-gray-900">{title}</h2>}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className="px-6 py-4">{children}</div>
        </div>
      </div>
    </div>
  )
}

