'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, Settings } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { User } from '@/types'

const fetchCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get('/auth/me')
  return response.data
}

export default function UserMenu() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const { data: user } = useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
  })

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials =
    user?.name
      ?.split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U'

  const handleLogout = () => {
    localStorage.removeItem('token')
    queryClient.clear()
    router.push('/login')
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center space-x-2 rounded-full border border-gray-200 bg-white px-3 py-1 shadow-sm hover:border-blue-500 transition"
      >
        {user?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-8 w-8 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
            {initials}
          </div>
        )}
        <span className="hidden sm:block text-sm font-medium text-gray-700">{user?.name || 'Profile'}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <div className="py-1">
            <Link
              href="/profile"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Profile Settings
            </Link>
            <button
              type="button"
              className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

