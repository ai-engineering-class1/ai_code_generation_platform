'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usePathname } from 'next/navigation'
import { toast } from 'sonner'
import apiClient from '@/lib/api'
import { Notification } from '@/types'
import { ExternalLink, GitPullRequest, GitBranch, Workflow } from 'lucide-react'

const fetchRecentNotifications = async (): Promise<Notification[]> => {
  try {
    const response = await apiClient.get('/notifications?limit=10')
    return response.data
  } catch (error: any) {
    // If unauthorized, return empty array (user not logged in)
    if (error.response?.status === 401) {
      return []
    }
    throw error
  }
}

export default function WebhookNotificationListener() {
  const queryClient = useQueryClient()
  const pathname = usePathname()
  const lastNotificationIdRef = useRef<string | null>(null)
  const shownNotificationIdsRef = useRef<Set<string>>(new Set())

  // Check if user is authenticated and not on auth pages
  const isAuthenticated = typeof window !== 'undefined' && !!localStorage.getItem('token')
  const isAuthPage = pathname === '/login' || pathname === '/register'
  const shouldFetch = isAuthenticated && !isAuthPage

  // Poll for new notifications every 5 seconds (only if authenticated and not on auth pages)
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications', 'webhook-listener'],
    queryFn: fetchRecentNotifications,
    refetchInterval: shouldFetch ? 5000 : false, // Poll every 5 seconds only when authenticated
    enabled: shouldFetch && typeof window !== 'undefined', // Only run when authenticated and not on auth pages
    retry: false, // Don't retry on 401 errors
  })

  useEffect(() => {
    if (!notifications || notifications.length === 0) return

    // Get the most recent notification
    const mostRecent = notifications[0]

    // Check if this is a webhook-related notification
    const isWebhookNotification =
      mostRecent.title.includes('Pull Request') ||
      mostRecent.title.includes('Workflow') ||
      mostRecent.title.includes('Push') ||
      mostRecent.title.includes('GitHub Webhook')

    if (!isWebhookNotification) return

    // Skip if we've already shown this notification
    if (shownNotificationIdsRef.current.has(mostRecent.id)) return

    // Skip if this is the same notification we last processed
    if (lastNotificationIdRef.current === mostRecent.id) return

    // Mark as shown
    shownNotificationIdsRef.current.add(mostRecent.id)
    lastNotificationIdRef.current = mostRecent.id

    // Determine icon and type based on notification
    let icon: React.ReactNode
    let toastType: 'success' | 'info' | 'warning' | 'error' = 'info'

    if (mostRecent.title.includes('Pull Request')) {
      icon = <GitPullRequest className="h-5 w-5" />
      if (mostRecent.title.includes('Merged')) {
        toastType = 'success'
      }
    } else if (mostRecent.title.includes('Workflow')) {
      icon = <Workflow className="h-5 w-5" />
      if (mostRecent.title.includes('Failed')) {
        toastType = 'error'
      } else if (mostRecent.title.includes('Succeeded')) {
        toastType = 'success'
      }
    } else if (mostRecent.title.includes('Push')) {
      icon = <GitBranch className="h-5 w-5" />
    } else {
      icon = <ExternalLink className="h-5 w-5" />
    }

    // Show toast notification
    const toastId = toast[toastType](mostRecent.title, {
      description: mostRecent.message,
      duration: 5000,
      icon: icon,
      action: mostRecent.actionUrl
        ? {
          label: 'View',
          onClick: () => {
            window.open(mostRecent.actionUrl, '_blank')
          },
        }
        : undefined,
    })

    // Clean up old notification IDs (keep only last 50)
    if (shownNotificationIdsRef.current.size > 50) {
      const idsArray = Array.from(shownNotificationIdsRef.current)
      const toRemove = idsArray.slice(0, idsArray.length - 50)
      toRemove.forEach(id => shownNotificationIdsRef.current.delete(id))
    }
  }, [notifications])

  // This component doesn't render anything visible
  return null
}
