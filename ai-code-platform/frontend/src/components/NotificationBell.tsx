'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api'
import { Notification } from '@/types'

const fetchNotifications = async (unreadOnly: boolean = false): Promise<Notification[]> => {
  const response = await apiClient.get(`/notifications?unread_only=${unreadOnly}&limit=20`)
  return response.data
}

const fetchUnreadCount = async (): Promise<number> => {
  const response = await apiClient.get('/notifications/unread-count')
  return response.data.count
}

const markAsRead = async (notificationId: string): Promise<void> => {
  await apiClient.put(`/notifications/${notificationId}/read`)
}

const markAllAsRead = async (notificationIds: string[]): Promise<void> => {
  await apiClient.put('/notifications/mark-read', { notification_ids: notificationIds })
}

export default function NotificationBell() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch unread count
  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadCount,
    refetchInterval: 10000, // Refresh every 10 seconds
  })

  // Fetch notifications when dropdown is open
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications', 'list'],
    queryFn: () => fetchNotifications(false),
    enabled: open, // Only fetch when dropdown is open
    refetchInterval: open ? 5000 : false, // Refresh every 5 seconds when open
  })

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markReadMutation.mutate(notification.id)
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
      setOpen(false)
    }
  }

  const handleMarkAllRead = () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (unreadIds.length > 0) {
      markAllReadMutation.mutate(unreadIds)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error':
        return '🔴'
      case 'warning':
        return '🟡'
      case 'approval_required':
        return '🟠'
      default:
        return '🔵'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'border-red-200 bg-red-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'approval_required':
        return 'border-orange-200 bg-orange-50'
      default:
        return 'border-blue-200 bg-blue-50'
    }
  }

  const unreadNotifications = notifications.filter(n => !n.read)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-96 rounded-lg border border-gray-200 bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            {unreadNotifications.length > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700"
                disabled={markAllReadMutation.isPending}
              >
                <CheckCheck className="h-4 w-4" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No notifications
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${!notification.read ? 'bg-blue-50/50' : ''
                      }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 text-lg">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p
                            className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-600'
                              }`}
                          >
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="ml-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600" />
                          )}
                        </div>
                        {notification.message && (
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                            {notification.message}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-400">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-200 px-4 py-2 text-center">
              <button
                type="button"
                onClick={() => {
                  router.push('/notifications')
                  setOpen(false)
                }}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

