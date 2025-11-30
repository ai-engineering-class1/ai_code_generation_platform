'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tantml:react-query'
import Link from 'next/link'
import { ArrowLeft, Clock, User, FileText, GitPullRequest, CheckCircle2, AlertCircle } from 'lucide-react'
import apiClient from '@/lib/api'
import { TaskDetail } from '@/types'

export default function TaskDetailPage({
  params,
}: {
  params: { projectId: string; taskId: string }
}) {
  const router = useRouter()
  const { projectId, taskId } = params

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  const { data: task, isLoading } = useQuery<TaskDetail>({
    queryKey: ['task', projectId, taskId],
    queryFn: async () => {
      const response = await apiClient.get(`/projects/${projectId}/tasks/${taskId}`)
      return response.data
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading task...</p>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Task not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href={`/projects/${projectId}`}
                className="text-gray-600 hover:text-gray-900 transition"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
                  <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                </div>
                {task.jiraIssueKey && (
                  <p className="text-sm text-gray-600 mt-1">Jira: {task.jiraIssueKey}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{task.description || 'No description provided'}</p>
            </div>

            {/* Specification */}
            {task.specification && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Specification</h2>
                  <div className="flex items-center space-x-2">
                    {task.specification.approved ? (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full flex items-center">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Approved
                      </span>
                    ) : (
                      <button
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition"
                        onClick={() => {
                          // TODO: Implement approve specification
                        }}
                      >
                        Approve Specification
                      </button>
                    )}
                  </div>
                </div>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{task.specification.content}</p>
                </div>
                {task.specification.githubFileUrl && (
                  <div className="mt-4">
                    <a
                      href={task.specification.githubFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      View on GitHub
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Code Generation */}
            {task.codeGeneration && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Code Generation</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getCodeGenStatusColor(task.codeGeneration.status)}`}>
                      {task.codeGeneration.status}
                    </span>
                  </div>
                  {task.codeGeneration.githubBranch && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Branch:</span>
                      <span className="text-sm font-mono text-gray-900">{task.codeGeneration.githubBranch}</span>
                    </div>
                  )}
                  {task.codeGeneration.githubPrUrl && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Pull Request:</span>
                      <a
                        href={task.codeGeneration.githubPrUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                      >
                        <GitPullRequest className="h-4 w-4 mr-1" />
                        PR #{task.codeGeneration.githubPrNumber}
                      </a>
                    </div>
                  )}
                  {task.codeGeneration.codeReviewFeedback && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">AI Review Feedback:</p>
                      <div className="bg-gray-50 rounded-md p-3">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {task.codeGeneration.codeReviewFeedback}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Workflow History */}
            {task.workflowHistory && task.workflowHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Workflow History</h2>
                <div className="space-y-3">
                  {task.workflowHistory.map((history) => (
                    <div key={history.id} className="flex items-start space-x-3 pb-3 border-b border-gray-200 last:border-0">
                      <div className="flex-shrink-0 mt-1">
                        <Clock className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          Moved from <span className="font-medium">{history.fromStage || 'N/A'}</span> to{' '}
                          <span className="font-medium">{history.toStage || 'N/A'}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(history.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Details</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Type</p>
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded">
                    {task.type}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Priority</p>
                  <span className={`inline-block px-2 py-1 text-sm rounded ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Current Stage</p>
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                    {task.currentStage.replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Created</p>
                  <p className="text-sm text-gray-900">{new Date(task.createdAt).toLocaleDateString()}</p>
                </div>
                {task.updatedAt && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                    <p className="text-sm text-gray-900">{new Date(task.updatedAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-2">
                {!task.specification && (
                  <button className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition">
                    Generate Specification
                  </button>
                )}
                {task.specification && task.specification.approved && !task.codeGeneration && (
                  <button className="w-full px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition">
                    Generate Code
                  </button>
                )}
                <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition">
                  Edit Task
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
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

function getCodeGenStatusColor(status: string): string {
  switch (status) {
    case 'generating':
      return 'bg-blue-100 text-blue-800'
    case 'review':
      return 'bg-yellow-100 text-yellow-800'
    case 'approved':
      return 'bg-green-100 text-green-800'
    case 'merged':
      return 'bg-purple-100 text-purple-800'
    case 'failed':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

