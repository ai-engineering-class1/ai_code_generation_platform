'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { ArrowLeft, Settings, Plus, Activity, CheckCircle2, CalendarDays, Clock9, PlayCircle, Rocket, ExternalLink } from 'lucide-react'
import apiClient from '@/lib/api'
import { Project, Task, ProjectProgress, JiraConfiguration, GitHubConfiguration } from '@/types'
import UserMenu from '@/components/UserMenu'

export default function ProjectDetailPage({ params }: { params: { projectId: string } }) {
  const router = useRouter()
  const { projectId } = params

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await apiClient.get(`/projects/${projectId}`)
      return response.data
    },
  })

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const response = await apiClient.get(`/projects/${projectId}/tasks`)
      return response.data
    },
  })

  const { data: jiraConfig } = useQuery<JiraConfiguration>({
    queryKey: ['jiraConfig', projectId],
    queryFn: async () => {
      const response = await apiClient.get(`/jira/config/${projectId}`)
      return response.data
    },
    retry: (failureCount, error: any) => {
      // Don't retry if 404 (no config yet)
      if (error.response?.status === 404) {
        return false
      }
      return failureCount < 3
    },
  })

  const { data: githubConfig } = useQuery<GitHubConfiguration>({
    queryKey: ['githubConfig', projectId],
    queryFn: async () => {
      const response = await apiClient.get(`/github/config/${projectId}`)
      return response.data
    },
    retry: (failureCount, error: any) => {
      // Don't retry if 404 (no config yet)
      if (error.response?.status === 404) {
        return false
      }
      return failureCount < 3
    },
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Calculate pagination
  const totalTasks = tasks?.length || 0
  const totalPages = Math.ceil(totalTasks / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTasks = tasks?.slice(startIndex, endIndex) || []

  // Reset to page 1 when tasks change
  useEffect(() => {
    if (tasks && currentPage > Math.ceil(tasks.length / itemsPerPage)) {
      setCurrentPage(1)
    }
  }, [tasks, currentPage, itemsPerPage])

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading project...</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Project not found</p>
      </div>
    )
  }

  const completedTasks = tasks?.filter((t) => t.status === 'completed').length || 0
  const blockedTasks =
    tasks?.filter((t) => t.status === 'blocked' || t.status === 'failed').length || 0
  const nextReleaseDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()
  const lastReleaseDate = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toLocaleDateString()
  const releases = [
    {
      id: 'upcoming',
      title: 'Upcoming Release',
      targetDate: nextReleaseDate,
      scope: totalTasks,
      ready: completedTasks,
      risk: blockedTasks > 0 ? 'Needs Attention' : 'On Track',
      notes: 'Scope includes the tasks currently in progress or ready for QA.',
    },
    {
      id: 'previous',
      title: 'Previous Release',
      targetDate: lastReleaseDate,
      scope: Math.max(1, Math.round(totalTasks * 0.8)),
      ready: Math.max(1, Math.round(completedTasks * 0.9)),
      risk: 'Shipped',
      notes: 'Successfully deployed to production with green CI/CD pipelines.',
    },
  ]

  const ciPipelines = [
    {
      name: 'Quality Checks',
      status: tasks?.some((t) => t.currentStage === 'ci_running') ? 'Running' : 'Idle',
      lastRun: 'Just now',
      successRate: '96%',
    },
    {
      name: 'Unit / Integration Tests',
      status: 'Idle',
      lastRun: '3h ago',
      successRate: '92%',
    },
  ]

  const cdPipelines = [
    {
      name: 'Staging Deploy',
      status: tasks?.some((t) => t.currentStage === 'cd_staging') ? 'Deploying' : 'Idle',
      lastRun: 'Yesterday',
      environment: 'staging',
    },
    {
      name: 'Production Deploy',
      status: tasks?.some((t) => t.currentStage === 'cd_production') ? 'Deploying' : 'Idle',
      lastRun: 'Last week',
      environment: 'production',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                  {project.jiraProjectKey && (
                    <a
                      href={`${project.jiraProjectKey.startsWith('http') ? project.jiraProjectKey : `https://jira.com/browse/${project.jiraProjectKey}`}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      Jira
                      <ExternalLink className="ml-1 h-3.5 w-3.5" />
                    </a>
                  )}
                  {project.githubRepoUrl && (
                    <a
                      href={project.githubRepoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center text-sm text-gray-700 hover:text-gray-900"
                    >
                      GitHub
                      <ExternalLink className="ml-1 h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
                <p className="text-sm text-gray-600">{project.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href={`/projects/${projectId}/tasks/new`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Task
              </Link>
              <Link
                href={`/projects/${projectId}/settings`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
              >
                <Settings className="h-5 w-5 mr-2" />
                Settings
              </Link>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Tasks"
            value={tasks?.length || 0}
            icon={<Activity className="h-6 w-6 text-blue-600" />}
          />
          <StatCard
            title="In Progress"
            value={tasks?.filter(t => t.status === 'in_progress').length || 0}
            icon={<Activity className="h-6 w-6 text-yellow-600" />}
          />
          <StatCard
            title="Completed"
            value={tasks?.filter(t => t.status === 'completed').length || 0}
            icon={<CheckCircle2 className="h-6 w-6 text-green-600" />}
          />
          <StatCard
            title="Failed"
            value={tasks?.filter(t => t.status === 'failed').length || 0}
            icon={<Activity className="h-6 w-6 text-red-600" />}
          />
        </div>

        {/* Tasks Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
            {tasks && tasks.length > 0 && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Showing {startIndex + 1}-{Math.min(endIndex, totalTasks)} of {totalTasks}
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1"
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
            )}
          </div>
          <div className="p-6">
            {tasksLoading ? (
              <p className="text-center text-gray-500">Loading tasks...</p>
            ) : tasks && tasks.length > 0 ? (
              <>
                <div className="space-y-4">
                  {paginatedTasks.map((task) => (
                    <TaskCard key={task.id} task={task} projectId={projectId} jiraConfig={jiraConfig} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show first page, last page, current page, and pages around current
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-2 text-sm border rounded-md ${
                                currentPage === page
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          )
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return <span key={page} className="px-2 text-gray-500">...</span>
                        }
                        return null
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No tasks yet</p>
                <Link
                  href={`/projects/${projectId}/tasks/new`}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create First Task
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Integration Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <IntegrationCard
            title="Jira Integration"
            status={jiraConfig && jiraConfig.jiraUrl && jiraConfig.jiraUrl.trim() ? 'connected' : 'not_connected'}
            projectKey={project.jiraProjectKey}
            projectId={projectId}
            jiraConfig={jiraConfig}
          />
          <IntegrationCard
            title="GitHub Integration"
            status={project.githubRepoUrl ? 'connected' : 'not_connected'}
            repoUrl={project.githubRepoUrl}
            projectId={projectId}
            githubConfig={githubConfig}
          />
        </div>
        {/* Releases */}
        <section className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Release Plan</h2>
            <p className="text-sm text-gray-500">Track upcoming and historical releases</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {releases.map((release) => (
              <ReleaseCard key={release.id} release={release} totalTasks={totalTasks} />
            ))}
          </div>
        </section>

        {/* CI/CD */}
        <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">CI Pipelines</h2>
              <PlayCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div className="space-y-4">
              {ciPipelines.map((pipeline) => (
                <PipelineCard key={pipeline.name} pipeline={pipeline} type="ci" />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">CD Pipelines</h2>
              <Rocket className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="space-y-4">
              {cdPipelines.map((pipeline) => (
                <PipelineCard key={pipeline.name} pipeline={pipeline} type="cd" />
              ))}
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div>{icon}</div>
      </div>
    </div>
  )
}

function TaskCard({ task, projectId, jiraConfig }: { task: Task; projectId: string; jiraConfig?: JiraConfiguration }) {
  // Helper function to get Jira issue URL
  const getJiraIssueUrl = (jiraIssueKey: string, jiraConfig: JiraConfiguration): string | null => {
    if (!jiraConfig?.jiraUrl || !jiraIssueKey) return null
    
    let baseUrl = jiraConfig.jiraUrl.trim()
    baseUrl = baseUrl.replace(/\/$/, '') // Remove trailing slash
    try {
      const urlObj = new URL(baseUrl)
      baseUrl = `${urlObj.protocol}//${urlObj.hostname}`
    } catch (e) {
      const match = baseUrl.match(/https?:\/\/[^\/]+/)
      if (match) {
        baseUrl = match[0]
      }
    }
    
    // Construct Jira issue URL
    return `${baseUrl}/browse/${jiraIssueKey}`
  }

  const jiraIssueUrl = task.jiraIssueKey && jiraConfig ? getJiraIssueUrl(task.jiraIssueKey, jiraConfig) : null
  const cardHref = jiraIssueUrl || `/projects/${projectId}/tasks/${task.id}`

  return (
    <a
      href={cardHref}
      target={jiraIssueUrl ? '_blank' : '_self'}
      rel={jiraIssueUrl ? 'noopener noreferrer' : undefined}
      className="block border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-gray-900">
              {task.title}
            </h3>
            {task.jiraIssueKey && (
              <span className="text-xs text-blue-600 font-medium">
                ({task.jiraIssueKey})
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <div className="flex flex-col items-end space-y-2">
            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
              {task.status}
            </span>
            <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{task.type}</span>
        <span>{task.currentStage?.replace(/_/g, ' ') || 'N/A'}</span>
      </div>
    </a>
  )
}

function IntegrationCard({
  title,
  status,
  projectKey,
  repoUrl,
  projectId,
  jiraConfig,
  githubConfig,
}: {
  title: string
  status: 'connected' | 'not_connected'
  projectKey?: string
  repoUrl?: string
  projectId: string
  jiraConfig?: JiraConfiguration
  githubConfig?: GitHubConfiguration
}) {
  // Helper function to generate Jira URLs (same as in settings page)
  const getJiraUrls = (jiraUrl: string, projectKey: string) => {
    let baseUrl = jiraUrl.trim()
    baseUrl = baseUrl.replace(/\/$/, '') // Remove trailing slash
    try {
      const urlObj = new URL(baseUrl)
      baseUrl = `${urlObj.protocol}//${urlObj.hostname}`
    } catch (e) {
      const match = baseUrl.match(/https?:\/\/[^\/]+/)
      if (match) {
        baseUrl = match[0]
      }
    }
    
    if (baseUrl.includes('atlassian.net')) {
      return {
        projectList: `${baseUrl}/jira/core/projects/${projectKey}/list?jql=project%20%3D%20%22${projectKey}%22%20ORDER%20BY%20created%20DESC`,
        projectBrowse: `${baseUrl}/browse/${projectKey}`
      }
    }
    
    return {
      projectBrowse: `${baseUrl}/browse/${projectKey}`,
      projectList: `${baseUrl}/browse/${projectKey}`
    }
  }

  // Use jiraConfig.jiraProjectKey if available, otherwise fall back to projectKey
  const effectiveProjectKey = jiraConfig?.jiraProjectKey || projectKey
  // Check if jiraConfig exists, has a valid jiraUrl, and has an effectiveProjectKey
  const jiraUrls = jiraConfig && jiraConfig.jiraUrl && jiraConfig.jiraUrl.trim() && effectiveProjectKey && effectiveProjectKey.trim()
    ? getJiraUrls(jiraConfig.jiraUrl, effectiveProjectKey)
    : null

  // Generate GitHub repository URL
  const githubRepoUrl = githubConfig 
    ? `https://github.com/${githubConfig.repoOwner}/${githubConfig.repoName}`
    : null

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {title === 'Jira Integration' && status === 'connected' && jiraUrls && (
            <a
              href={jiraUrls.projectList || jiraUrls.projectBrowse}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition"
              title="View Tasks in Jira"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              View Tasks in Jira
            </a>
          )}
          {title === 'GitHub Integration' && githubRepoUrl && (
            <a
              href={githubRepoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition"
              title="View Repository on GitHub"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              View Repository
            </a>
          )}
        </div>
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            status === 'connected'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {status === 'connected' ? 'Connected' : 'Not Connected'}
        </span>
      </div>
      {status === 'connected' ? (
        <div>
          <p className="text-sm text-gray-600 mb-2">
            {projectKey && `Project: ${projectKey}`}
            {repoUrl && `Repository: ${repoUrl}`}
          </p>
          <Link
            href={`/projects/${projectId}/settings`}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Manage Configuration
          </Link>
        </div>
      ) : (
        <Link
          href={`/projects/${projectId}/settings`}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Configure Integration
        </Link>
      )}
    </div>
  )
}

function ReleaseCard({
  release,
  totalTasks,
}: {
  release: { title: string; targetDate: string; scope: number; ready: number; risk: string; notes: string }
  totalTasks: number
}) {
  const progress = totalTasks ? Math.round((release.ready / Math.max(release.scope, 1)) * 100) : 0

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{release.title}</h3>
          <p className="text-sm text-gray-500 flex items-center space-x-2">
            <CalendarDays className="h-4 w-4" />
            <span>Target: {release.targetDate}</span>
          </p>
        </div>
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            release.risk === 'On Track'
              ? 'bg-green-100 text-green-700'
              : release.risk === 'Shipped'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {release.risk}
        </span>
      </div>
      <div>
        <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
          <span>
            Ready {release.ready}/{release.scope}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <p className="text-sm text-gray-600">{release.notes}</p>
    </div>
  )
}

function PipelineCard({
  pipeline,
  type,
}: {
  pipeline: { name: string; status: string; lastRun: string; successRate?: string; environment?: string }
  type: 'ci' | 'cd'
}) {
  const statusColor =
    pipeline.status === 'Running' || pipeline.status === 'Deploying'
      ? 'text-blue-600'
      : pipeline.status === 'Idle'
      ? 'text-gray-500'
      : 'text-green-600'

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-semibold text-gray-900">{pipeline.name}</h3>
          <p className="text-xs text-gray-500 flex items-center space-x-1">
            <Clock9 className="h-3.5 w-3.5" />
            <span>Last run: {pipeline.lastRun}</span>
          </p>
        </div>
        <span className={`text-sm font-medium ${statusColor}`}>{pipeline.status}</span>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-600">
        {type === 'ci' ? (
          <>
            <span>Success rate</span>
            <span className="font-semibold">{pipeline.successRate}</span>
          </>
        ) : (
          <>
            <span>Environment</span>
            <span className="font-semibold uppercase">{pipeline.environment}</span>
          </>
        )}
      </div>
    </div>
  )
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-gray-100 text-gray-800'
    case 'in_progress':
      return 'bg-blue-100 text-blue-800'
    case 'blocked':
      return 'bg-yellow-100 text-yellow-800'
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'failed':
      return 'bg-red-100 text-red-800'
    case 'cancelled':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'low':
      return 'bg-blue-100 text-blue-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'high':
      return 'bg-orange-100 text-orange-800'
    case 'critical':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

