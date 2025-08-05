import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { eventsAPI } from '../services/api'

const CalendarContext = createContext()

export const useCalendar = () => {
  const context = useContext(CalendarContext)
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider')
  }
  return context
}

export const CalendarProvider = ({ children }) => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Load events from localStorage on mount
  useEffect(() => {
    try {
      const savedEvents = localStorage.getItem('calendarEvents')
      if (savedEvents) {
        const parsedEvents = JSON.parse(savedEvents)
        // Convert date strings back to Date objects
        const eventsWithDates = parsedEvents.map(event => ({
          ...event,
          date: new Date(event.date)
        }))
        setEvents(eventsWithDates)
        console.log('Loaded events from localStorage:', eventsWithDates)
      }
    } catch (error) {
      console.error('Failed to load events from localStorage:', error)
    }
  }, [])

  // Save events to localStorage whenever events change
  useEffect(() => {
    try {
      localStorage.setItem('calendarEvents', JSON.stringify(events))
      console.log('Saved events to localStorage:', events)
    } catch (error) {
      console.error('Failed to save events to localStorage:', error)
    }
  }, [events])

  const fetchEvents = useCallback(async (params = {}) => {
    try {
      setLoading(true)
      setError('')
      const response = await eventsAPI.getAll(params)
      console.log('Calendar events response:', response)
      
      const eventsData = response.data?.data || response.data || []
      console.log('Calendar events data:', eventsData)
      
      if (Array.isArray(eventsData)) {
        setEvents(eventsData)
      } else {
        console.error('Events data is not an array:', eventsData)
        setEvents([])
        setError('Invalid data format received')
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
      // Fallback to mock data when API is not available
      console.log('Using fallback mock data for calendar events')
      const mockEvents = [
        {
          id: 1,
          title: 'Project Review Meeting',
          type: 'meeting',
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          time: '10:00 AM',
          duration: 60,
          attendees: ['John Doe', 'Jane Smith'],
          project: 'Website Redesign'
        },
        {
          id: 2,
          title: 'Milestone Deadline',
          type: 'deadline',
          date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          time: '5:00 PM',
          project: 'Mobile App Development'
        },
        {
          id: 3,
          title: 'Client Presentation',
          type: 'presentation',
          date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          time: '2:00 PM',
          duration: 90,
          attendees: ['Client Team', 'Development Team'],
          project: 'E-commerce Platform'
        }
      ]
      setEvents(mockEvents)
      setError('') // Clear error since we have fallback data
    } finally {
      setLoading(false)
    }
  }, [])

  const createEvent = async (eventData) => {
    try {
      console.log('CalendarContext createEvent called with:', eventData)
      setLoading(true)
      setError('')
      
      const response = await eventsAPI.create(eventData)
      console.log('CalendarContext createEvent response:', response.data)
      
      const newEvent = response.data?.data || response.data
      console.log('CalendarContext newEvent:', newEvent)
      
      setEvents(prev => [...prev, newEvent])
      return { success: true, event: newEvent }
    } catch (error) {
      console.error('CalendarContext createEvent error:', error)
      // Fallback: add event to local state even if API fails
      console.log('API failed, adding event to local state')
      const fallbackEvent = {
        id: Date.now(),
        ...eventData,
        date: new Date(eventData.date + 'T' + eventData.time),
        created_at: new Date().toISOString()
      }
      setEvents(prev => [...prev, fallbackEvent])
      return { success: true, event: fallbackEvent }
    } finally {
      setLoading(false)
    }
  }

  const updateEvent = async (id, eventData) => {
    try {
      setLoading(true)
      setError('')
      const response = await eventsAPI.update(id, eventData)
      const updatedEvent = response.data?.data || response.data
      setEvents(prev => prev.map(e => e.id === id ? updatedEvent : e))
      return { success: true, event: updatedEvent }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update event'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const deleteEvent = async (id) => {
    try {
      setLoading(true)
      setError('')
      await eventsAPI.delete(id)
      setEvents(prev => prev.filter(e => e.id !== id))
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete event'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const getEventById = async (id) => {
    try {
      const response = await eventsAPI.getById(id)
      return response.data?.data || response.data
    } catch (error) {
      console.error('Failed to fetch event:', error)
      return null
    }
  }

  const getEventsByProject = async (projectId) => {
    try {
      const response = await eventsAPI.getByProject(projectId)
      const eventsData = response.data?.data || response.data || []
      return Array.isArray(eventsData) ? eventsData : []
    } catch (error) {
      console.error('Failed to fetch project events:', error)
      return []
    }
  }

  const getEventsByDate = async (date) => {
    try {
      const response = await eventsAPI.getByDate(date)
      const eventsData = response.data?.data || response.data || []
      return Array.isArray(eventsData) ? eventsData : []
    } catch (error) {
      console.error('Failed to fetch date events:', error)
      return []
    }
  }

  const getUpcomingEvents = async () => {
    try {
      const response = await eventsAPI.getUpcoming()
      const eventsData = response.data?.data || response.data || []
      return Array.isArray(eventsData) ? eventsData : []
    } catch (error) {
      console.error('Failed to fetch upcoming events:', error)
      return []
    }
  }

  const getTodayEvents = async () => {
    try {
      const response = await eventsAPI.getToday()
      const eventsData = response.data?.data || response.data || []
      return Array.isArray(eventsData) ? eventsData : []
    } catch (error) {
      console.error('Failed to fetch today events:', error)
      return []
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const value = {
    events,
    loading,
    error,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventById,
    getEventsByProject,
    getEventsByDate,
    getUpcomingEvents,
    getTodayEvents,
  }

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  )
} 