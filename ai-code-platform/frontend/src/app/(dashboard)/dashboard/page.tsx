'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Activity, CheckCircle2, AlertTriangle, FileText } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import { Project, Task } from '@/types'
import UserMenu from '@/components/UserMenu'
import NotificationBell from '@/components/NotificationBell'

export default function DashboardPage() {
  const router = useRouter()

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await apiClient.get('/projects')
      return response.data
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Link
              href="/projects/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Project
            </Link>
            <NotificationBell />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Projects</h2>
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading projects...</p>
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500 mb-4">No projects yet</p>
              <Link
                href="/projects/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Project
              </Link>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Projects" value={projects?.length || 0} />
          <StatCard title="Active Tasks" value="0" />
          <StatCard title="Completed Today" value="0" />
          <StatCard title="Success Rate" value="0%" />
        </div>
      </main>
    </div>
  )
}

function ProjectCard({ project }: { project: Project }) {
  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ['projectTasksSummary', project.id],
    queryFn: async () => {
      const response = await apiClient.get(`/projects/${project.id}/tasks`)
      return response.data
    },
  })

  const totalTasks = tasks?.length ?? 0
  const inProgress = tasks?.filter((task) => task.status === 'in_progress').length ?? 0
  const completed = tasks?.filter((task) => task.status === 'completed').length ?? 0
  const blocked =
    tasks?.filter((task) => task.status === 'blocked' || task.status === 'failed').length ?? 0
  const completionRate = totalTasks ? Math.round((completed / totalTasks) * 100) : 0

  return (
    <Link
      href={`/projects/${project.id}`}
      className="block bg-white rounded-lg shadow hover:shadow-lg transition p-6"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
          <p className="text-sm text-gray-500 line-clamp-2">
            {project.description || 'No description provided'}
          </p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
          {project.status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <MetricPill
          icon={<Activity className="h-4 w-4 text-blue-600" />}
          label="Total"
          value={isLoading ? '...' : totalTasks}
        />
        <MetricPill
          icon={<Activity className="h-4 w-4 text-yellow-600" />}
          label="In Progress"
          value={isLoading ? '...' : inProgress}
        />
        <MetricPill
          icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
          label="Done"
          value={isLoading ? '...' : completed}
        />
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Completion</span>
          <span>{isLoading ? '...' : `${completionRate}%`}</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span>{isLoading ? '...' : `${blocked} blocked`}</span>
        </div>
        <span>Updated {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : '—'}</span>
      </div>
    </Link>
  )
}

function MetricPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
      <div className="flex items-center space-x-2 text-gray-600">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'paused':
      return 'bg-yellow-100 text-yellow-800'
    case 'completed':
      return 'bg-blue-100 text-blue-800'
    case 'archived':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

