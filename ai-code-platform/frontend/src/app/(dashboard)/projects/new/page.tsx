'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import apiClient from '@/lib/api'
import { CreateProjectData } from '@/types'

export default function NewProjectPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<CreateProjectData>({
    name: '',
    description: '',
    jiraProjectKey: '',
    githubRepoUrl: '',
  })

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  const createProjectMutation = useMutation({
    mutationFn: async (data: CreateProjectData) => {
      const response = await apiClient.post('/projects', data)
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      router.push(`/projects/${data.id}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createProjectMutation.mutate(formData)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Create New Project</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter project name"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter project description"
              />
            </div>

            {/* Jira Project Key (Optional) */}
            <div>
              <label htmlFor="jiraProjectKey" className="block text-sm font-medium text-gray-700 mb-2">
                Jira Project Key (Optional)
              </label>
              <input
                type="text"
                id="jiraProjectKey"
                name="jiraProjectKey"
                value={formData.jiraProjectKey}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., PROJ"
              />
              <p className="mt-1 text-sm text-gray-500">
                You can configure Jira integration later in project settings
              </p>
            </div>

            {/* GitHub Repository URL (Optional) */}
            <div>
              <label htmlFor="githubRepoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                GitHub Repository URL (Optional)
              </label>
              <input
                type="url"
                id="githubRepoUrl"
                name="githubRepoUrl"
                value={formData.githubRepoUrl}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://github.com/username/repository"
              />
              <p className="mt-1 text-sm text-gray-500">
                You can configure GitHub integration later in project settings
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-4">
              <Link
                href="/dashboard"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={createProjectMutation.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
              >
                {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
              </button>
            </div>

            {/* Error Message */}
            {createProjectMutation.isError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  Error creating project. Please try again.
                </p>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  )
}

