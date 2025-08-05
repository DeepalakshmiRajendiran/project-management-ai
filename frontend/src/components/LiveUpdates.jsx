import React, { useEffect, useState } from 'react'

const LiveUpdates = () => {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Simulate connection status
    setIsConnected(true)
    
    // Cleanup on unmount
    return () => {
      setIsConnected(false)
    }
  }, [])

  // Connection status indicator removed to clean up UI
  return null
}

export default LiveUpdates 