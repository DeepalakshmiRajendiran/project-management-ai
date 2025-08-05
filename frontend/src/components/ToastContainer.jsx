import React, { useState, useCallback } from 'react'
import Toast from './Toast'

const ToastContainer = () => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random()
    const newToast = { id, ...toast }
    setToasts(prev => [...prev, newToast])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showSuccess = useCallback((title, message, duration = 5000) => {
    addToast({ type: 'success', title, message, duration })
  }, [addToast])

  const showError = useCallback((title, message, duration = 5000) => {
    addToast({ type: 'error', title, message, duration })
  }, [addToast])

  const showWarning = useCallback((title, message, duration = 5000) => {
    addToast({ type: 'warning', title, message, duration })
  }, [addToast])

  const showInfo = useCallback((title, message, duration = 5000) => {
    addToast({ type: 'info', title, message, duration })
  }, [addToast])

  const showComment = useCallback((title, message, duration = 5000) => {
    addToast({ type: 'comment', title, message, duration })
  }, [addToast])

  const showAssignment = useCallback((title, message, duration = 5000) => {
    addToast({ type: 'assignment', title, message, duration })
  }, [addToast])

  const showStatusChange = useCallback((title, message, duration = 5000) => {
    addToast({ type: 'status_change', title, message, duration })
  }, [addToast])

  const showMilestone = useCallback((title, message, duration = 5000) => {
    addToast({ type: 'milestone', title, message, duration })
  }, [addToast])

  // Expose methods globally for easy access
  React.useEffect(() => {
    window.showToast = {
      success: showSuccess,
      error: showError,
      warning: showWarning,
      info: showInfo,
      comment: showComment,
      assignment: showAssignment,
      statusChange: showStatusChange,
      milestone: showMilestone
    }
  }, [showSuccess, showError, showWarning, showInfo, showComment, showAssignment, showStatusChange, showMilestone])

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            transform: `translateY(${index * 80}px)`,
            zIndex: 1000 - index
          }}
        >
          <Toast
            {...toast}
            onClose={removeToast}
          />
        </div>
      ))}
    </div>
  )
}

export default ToastContainer 