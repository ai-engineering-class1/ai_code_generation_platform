'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Cropper, { Area } from 'react-easy-crop'
import apiClient from '@/lib/api'
import { User } from '@/types'
import UserMenu from '@/components/UserMenu'
import { Save } from 'lucide-react'

const fetchCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get('/auth/me')
  return response.data
}

export default function ProfilePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: '',
    avatarUrl: '',
    bio: '',
  })
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isCropping, setIsCropping] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
  })

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        avatarUrl: user.avatarUrl || '',
        bio: user.bio || '',
      })
    }
  }, [user])

  const updateMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const response = await apiClient.put('/auth/me', payload)
      return response.data as User
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['currentUser'], updatedUser)
      alert('Profile updated successfully!')
    },
  })

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener('load', () => resolve(image))
      image.addEventListener('error', (error) => reject(error))
      image.setAttribute('crossOrigin', 'anonymous')
      image.src = url
    })

  const getCroppedImg = useCallback(
    async (imageSrc: string, cropPixels: Area) => {
      const image = await createImage(imageSrc)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Failed to create canvas context')
      }

      canvas.width = cropPixels.width
      canvas.height = cropPixels.height

      ctx.drawImage(
        image,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        cropPixels.width,
        cropPixels.height
      )

      return canvas.toDataURL('image/png')
    },
    []
  )

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setSelectedImage(reader.result as string)
      setIsCropping(true)
      setZoom(1)
      setCrop({ x: 0, y: 0 })
    }
    reader.readAsDataURL(file)
  }

  const handleApplyCrop = async () => {
    if (!selectedImage || !croppedAreaPixels) return
    try {
      const croppedImage = await getCroppedImg(selectedImage, croppedAreaPixels)
      setForm((prev) => ({ ...prev, avatarUrl: croppedImage }))
      setIsCropping(false)
      setSelectedImage(null)
    } catch (error) {
      console.error(error)
      alert('Failed to crop image. Please try again.')
    }
  }

  const handleCancelCrop = () => {
    setIsCropping(false)
    setSelectedImage(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(form)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-sm text-gray-600">Update your personal information and avatar</p>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          {isLoading ? (
            <p className="text-gray-500">Loading profile...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                {form.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.avatarUrl}
                    alt={form.name}
                    className="h-24 w-24 rounded-full object-cover border"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-600 text-2xl font-semibold text-white">
                    {form.name
                      ? form.name
                          .split(' ')
                          .map((part) => part[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()
                      : 'U'}
                  </div>
                )}
                <div className="flex flex-col items-center space-y-2">
                  <label className="inline-flex items-center space-x-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-600 cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                    <span>Upload new avatar</span>
                  </label>
                  <p className="text-xs text-gray-500 text-center">
                    Upload and crop an image to update your avatar. Supported formats: JPG, PNG, GIF.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Name *
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="bio" className="text-sm font-medium text-gray-700">
                  Bio
                </label>
                <textarea
                  id="bio"
                  rows={4}
                  placeholder="Tell your team a bit more about yourself"
                  value={form.bio}
                  onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="inline-flex items-center rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {isCropping && selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Adjust your avatar</h2>
            <div className="relative h-80 w-full bg-gray-900">
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="mt-4 flex items-center space-x-3">
              <label className="text-sm text-gray-600">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1"
              />
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancelCrop}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCrop}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Use Avatar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

