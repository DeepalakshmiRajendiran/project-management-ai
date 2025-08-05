import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { notificationAPI } from '../services/api'

const NotificationContext = createContext()

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const [socket, setSocket] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        // In production, this would be your WebSocket server URL
        const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001'
        const ws = new WebSocket(wsUrl)

        ws.onopen = () => {
          console.log('WebSocket connected')
          setIsConnected(true)
          setError('')
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            handleWebSocketMessage(data)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        ws.onclose = () => {
          console.log('WebSocket disconnected')
          setIsConnected(false)
          // Attempt to reconnect after 5 seconds
          setTimeout(connectWebSocket, 5000)
        }

        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          setIsConnected(false)
        }

        setSocket(ws)

        return () => {
          ws.close()
        }
      } catch (error) {
        console.error('Failed to connect WebSocket:', error)
        setIsConnected(false)
      }
    }

    connectWebSocket()
  }, [])

  // Polling fallback when WebSocket is not available
  useEffect(() => {
    if (!isConnected) {
      const pollInterval = setInterval(() => {
        fetchNotifications()
      }, 30000) // Poll every 30 seconds

      return () => clearInterval(pollInterval)
    }
  }, [isConnected])

  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case 'notification':
        addNotification(data.notification)
        break
      case 'comment':
        addNotification({
          id: Date.now(),
          type: 'comment',
          title: 'New Comment',
          message: `${data.user} commented on ${data.task}`,
          data: data,
          created_at: new Date().toISOString(),
          read: false
        })
        break
      case 'assignment':
        addNotification({
          id: Date.now(),
          type: 'assignment',
          title: 'Task Assigned',
          message: `You have been assigned to "${data.task}"`,
          data: data,
          created_at: new Date().toISOString(),
          read: false
        })
        break
      case 'status_change':
        addNotification({
          id: Date.now(),
          type: 'status_change',
          title: 'Status Updated',
          message: `Task "${data.task}" status changed to ${data.status}`,
          data: data,
          created_at: new Date().toISOString(),
          read: false
        })
        break
      case 'milestone':
        addNotification({
          id: Date.now(),
          type: 'milestone',
          title: 'Milestone Reached',
          message: `Milestone "${data.milestone}" has been completed`,
          data: data,
          created_at: new Date().toISOString(),
          read: false
        })
        break
      default:
        console.log('Unknown WebSocket message type:', data.type)
    }
  }, [])

  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 49)]) // Keep last 50
    setUnreadCount(prev => prev + 1)
    
    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      })
    }
  }, [])

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const response = await notificationAPI.getAll()
      const notificationsData = response.data?.data || response.data || []
      
      if (Array.isArray(notificationsData)) {
        setNotifications(notificationsData)
        setUnreadCount(notificationsData.filter(n => !n.read).length)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      setError('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId)
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationAPI.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }, [])

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationAPI.delete(notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === notificationId)
        return notification && !notification.read ? Math.max(0, prev - 1) : prev
      })
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }, [notifications])

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false
  }, [])

  const sendNotification = useCallback((title, message, data = {}) => {
    const notification = {
      id: Date.now(),
      type: 'custom',
      title,
      message,
      data,
      created_at: new Date().toISOString(),
      read: false
    }
    addNotification(notification)
  }, [addNotification])

  // Initial load
  useEffect(() => {
    fetchNotifications()
    requestNotificationPermission()
  }, [fetchNotifications, requestNotificationPermission])

  const value = {
    notifications,
    unreadCount,
    isConnected,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendNotification,
    requestNotificationPermission,
    fetchNotifications
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
} 