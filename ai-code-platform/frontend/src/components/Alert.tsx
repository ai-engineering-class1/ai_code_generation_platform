import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'

export interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  message: string
  onClose?: () => void
}

export function Alert({ type = 'info', title, message, onClose }: AlertProps) {
  const config = {
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      icon: <Info className="h-5 w-5 text-blue-600" />,
    },
    success: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
    },
    warning: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
    },
    error: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      icon: <AlertCircle className="h-5 w-5 text-red-600" />,
    },
  }

  const styles = config[type]

  return (
    <div
      className={`p-4 rounded-md border ${styles.bgColor} ${styles.borderColor}`}
      role="alert"
    >
      <div className="flex">
        <div className="flex-shrink-0">{styles.icon}</div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${styles.textColor}`}>{title}</h3>
          )}
          <p className={`text-sm ${styles.textColor} ${title ? 'mt-1' : ''}`}>
            {message}
          </p>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <button
              onClick={onClose}
              className={`inline-flex rounded-md p-1.5 ${styles.textColor} hover:bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

