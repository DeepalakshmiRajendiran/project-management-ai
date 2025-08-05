import React, { useState, useEffect } from 'react'
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  XCircle, 
  X,
  MessageSquare,
  UserPlus,
  TrendingUp,
  Flag
} from 'lucide-react'

const Toast = ({ 
  id, 
  type = 'info', 
  title, 
  message, 
  duration = 5000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose(id)
    }, 300)
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'comment':
        return <MessageSquare className="h-5 w-5 text-blue-500" />
      case 'assignment':
        return <UserPlus className="h-5 w-5 text-green-500" />
      case 'status_change':
        return <TrendingUp className="h-5 w-5 text-yellow-500" />
      case 'milestone':
        return <Flag className="h-5 w-5 text-purple-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'comment':
        return 'bg-blue-50 border-blue-200'
      case 'assignment':
        return 'bg-green-50 border-green-200'
      case 'status_change':
        return 'bg-yellow-50 border-yellow-200'
      case 'milestone':
        return 'bg-purple-50 border-purple-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  if (!isVisible) return null

  return (
    <div
      className={`fixed top-4 right-4 w-80 max-w-sm bg-white rounded-lg shadow-lg border z-50 transform transition-all duration-300 ${
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      } ${getBackgroundColor()}`}
    >
      <div className="flex items-start p-4">
        {/* Icon */}
        <div className="flex-shrink-0 mr-3">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <p className="text-sm font-medium text-gray-900 mb-1">
              {title}
            </p>
          )}
          <p className="text-sm text-gray-600">
            {message}
          </p>
        </div>

        {/* Close Button */}
        <div className="flex-shrink-0 ml-3">
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {duration > 0 && (
        <div className="h-1 bg-gray-200 rounded-b-lg overflow-hidden">
          <div
            className="h-full bg-gray-400 transition-all duration-300 ease-linear"
            style={{
              width: isExiting ? '0%' : '100%',
              transitionDuration: `${duration}ms`
            }}
          />
        </div>
      )}
    </div>
  )
}

export default Toast 