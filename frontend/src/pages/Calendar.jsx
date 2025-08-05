import React, { useState, useEffect } from 'react'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  TrendingUp,
  Users,
  Filter
} from 'lucide-react'
import EventModal from '../components/EventModal'
import { useCalendar } from '../contexts/CalendarContext'

const Calendar = () => {
  const { events, loading, error, createEvent, fetchEvents } = useCalendar()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState('month') // 'month', 'week', 'day'
  const [showEventModal, setShowEventModal] = useState(false)

  // Events are now loaded automatically by CalendarContext
  // No need for manual loading

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-100 text-blue-800'
      case 'deadline':
        return 'bg-red-100 text-red-800'
      case 'presentation':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getEventTypeIcon = (type) => {
    switch (type) {
      case 'meeting':
        return <Users className="h-4 w-4" />
      case 'deadline':
        return <AlertCircle className="h-4 w-4" />
      case 'presentation':
        return <TrendingUp className="h-4 w-4" />
      default:
        return <CalendarIcon className="h-4 w-4" />
    }
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (time) => {
    return time
  }

  const getUpcomingEvents = () => {
    const now = new Date()
    const eventsArray = Array.isArray(events) ? events : []
    return eventsArray
      .filter(event => event.date >= now)
      .sort((a, b) => a.date - b.date)
      .slice(0, 5)
  }

  const getTodayEvents = () => {
    const today = new Date()
    const eventsArray = Array.isArray(events) ? events : []
    return eventsArray.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate.toDateString() === today.toDateString()
    })
  }

  const handleAddEvent = async (eventData) => {
    try {
      console.log('Adding new event:', eventData)
      const result = await createEvent(eventData)
      console.log('Event creation result:', result)
      
      if (result.success) {
        console.log('Event added successfully')
      } else {
        console.log('Event creation failed:', result.error)
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Failed to add event:', error)
      throw error
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span className="text-gray-600">Loading calendar...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading calendar</h3>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={fetchEvents} // Use fetchEvents from context
          className="btn btn-primary mt-4"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600">
            View project timelines, meetings, and deadlines
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="btn btn-secondary flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </button>
          <button 
            onClick={() => setShowEventModal(true)}
            className="btn btn-primary"
          >
            Add Event
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                view === 'month' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                view === 'week' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1 rounded text-sm font-medium ${
                view === 'day' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Day
            </button>
          </div>
          <div className="text-lg font-medium text-gray-900">
            {currentDate.toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg border">
        <div className="p-6">
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* This is a simplified calendar grid - in a real app, you'd use a proper calendar library */}
          <div className="text-center py-12">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Calendar View</h3>
            <p className="text-gray-600">
              {view === 'month' && 'Monthly calendar view would be displayed here'}
              {view === 'week' && 'Weekly calendar view would be displayed here'}
              {view === 'day' && 'Daily calendar view would be displayed here'}
            </p>
          </div>
        </div>
      </div>

      {/* Today's Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Events</h3>
            
            {getTodayEvents().length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No events scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getTodayEvents().map((event) => (
                  <div key={event.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${getEventTypeColor(event.type)}`}>
                          {getEventTypeIcon(event.type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                          <p className="text-sm text-gray-600">{event.project}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatTime(event.time)}</p>
                        {event.duration && (
                          <p className="text-xs text-gray-500">{event.duration} min</p>
                        )}
                      </div>
                    </div>
                    
                    {event.attendees && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-500 mb-1">Attendees:</p>
                        <p className="text-sm text-gray-700">{event.attendees.join(', ')}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-lg border">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Events</h3>
            
            {getUpcomingEvents().length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No upcoming events</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getUpcomingEvents().map((event) => (
                  <div key={event.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${getEventTypeColor(event.type)}`}>
                          {getEventTypeIcon(event.type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                          <p className="text-sm text-gray-600">{event.project}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatDate(event.date)}</p>
                        <p className="text-xs text-gray-500">{formatTime(event.time)}</p>
                      </div>
                    </div>
                    
                    {event.attendees && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-500 mb-1">Attendees:</p>
                        <p className="text-sm text-gray-700">{event.attendees.join(', ')}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Modal */}
      <EventModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        onSave={handleAddEvent}
      />
    </div>
  )
}

export default Calendar 