'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { ArrowLeft, Clock, User, FileText, GitPullRequest, CheckCircle2, AlertCircle, X, Bot, DollarSign, Timer, Zap } from 'lucide-react'
import apiClient from '@/lib/api'
import { TaskDetail, User as UserType } from '@/types'

// Agent Task response interface
interface AgentTaskResult {
  taskId: string
  status: string
  result?: {
    type?: string
    subtype?: string  // 'success' or 'error'
    is_error?: boolean
    result?: string
    total_cost_usd?: number
    duration_ms?: number
    num_turns?: number
    modelUsage?: Record<string, {
      inputTokens: number
      outputTokens: number
      costUSD: number
    }>
  }
  executionMetrics?: {
    durationMs: number
    numTurns: number
    totalCostUsd: number
  }
  startedAt?: string
  completedAt?: string
}

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

  const queryClient = useQueryClient()
  const [agentTaskId, setAgentTaskId] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    assigneeId: '',
    currentStage: '',
  })

  const { data: task, isLoading, error } = useQuery<TaskDetail>({
    queryKey: ['task', projectId, taskId],
    queryFn: async () => {
      try {
        console.log(`Fetching task: ${taskId} from project: ${projectId}`)
        const token = localStorage.getItem('token')
        console.log('Token exists:', !!token)

        const response = await apiClient.get(`/projects/${projectId}/tasks/${taskId}`)
        console.log('Task fetched successfully:', response.data)
        return response.data
      } catch (err: any) {
        console.error('Error fetching task:', err)
        console.error('Error details:', {
          message: err.message,
          code: err.code,
          response: err.response?.data,
          status: err.response?.status,
          request: err.request,
        })

        // Handle different error types
        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
          throw new Error('Request timeout - backend may be slow or unresponsive')
        } else if (err.message === 'Network Error' || err.code === 'ERR_NETWORK' || !err.response) {
          throw new Error('Cannot connect to backend. Is the server running on http://localhost:8000?')
        } else if (err.response?.status === 401) {
          throw new Error('Authentication failed. Please log in again.')
        } else if (err.response?.status === 404) {
          throw new Error(`Task not found: ${err.response.data?.detail || 'Task does not exist'}`)
        } else if (err.response?.status === 403) {
          throw new Error('You do not have permission to view this task.')
        } else {
          throw new Error(err.response?.data?.detail || err.message || 'Failed to load task')
        }
      }
    },
    retry: (failureCount, error: any) => {
      // Don't retry on 401, 403, 404 errors
      if (error?.message?.includes('Authentication') ||
        error?.message?.includes('permission') ||
        error?.message?.includes('not found')) {
        return false
      }
      return failureCount < 1
    },
    retryDelay: 2000,
  })

  // Fetch users for assignee dropdown
  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await apiClient.get('/auth/users')
      return response.data
    },
  })

  // Query for agent task status
  const { data: agentTask, refetch: refetchAgentTask } = useQuery<AgentTaskResult>({
    queryKey: ['agentTask', agentTaskId],
    queryFn: async () => {
      const response = await apiClient.get(`/projects/agent-tasks/${agentTaskId}`)
      return response.data
    },
    enabled: !!agentTaskId,
    refetchInterval: (query) => {
      // Poll every 5 seconds if task is still pending/running
      // Note: Timer starts AFTER previous request completes, so no congestion
      if (query.state.data?.status === 'completed') return false
      return 5000
    },
  })
  // Initialize form data when task loads
  useEffect(() => {
    if (task) {
      setEditFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'pending',
        priority: task.priority || 'medium',
        assigneeId: task.assigneeId || '',
        currentStage: task.currentStage || 'requirement',
      })
    }
  }, [task])

  // Reset form data when modal opens to ensure it reflects current task state
  useEffect(() => {
    if (isEditModalOpen) {
      // Refetch task data to ensure we have the latest state
      queryClient.invalidateQueries({ queryKey: ['task', projectId, taskId] })
    }
  }, [isEditModalOpen, queryClient, projectId, taskId])

  // Update form data when task data is available
  useEffect(() => {
    if (isEditModalOpen && task) {
      console.log('Resetting form data. Task assigneeId:', task.assigneeId, 'Task object:', task)
      setEditFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'pending',
        priority: task.priority || 'medium',
        assigneeId: task.assigneeId ?? '', // Use nullish coalescing to preserve null/undefined
        currentStage: task.currentStage || 'requirement',
      })
      console.log('Form data set. assigneeId:', task.assigneeId ?? '', 'editFormData.assigneeId:', task.assigneeId ?? '')
    }
  }, [isEditModalOpen, task])



  const assignToAgentMutation = useMutation({
    mutationFn: async () => {
      // Call local backend which proxies to remote Claude Web API
      const response = await apiClient.post('/projects/assign-to-agent')
      return response.data
    },
    onSuccess: (data) => {
      if (data.taskId) {
        setAgentTaskId(data.taskId)
      }
      alert(`Task assigned to agent successfully! Task ID: ${data.taskId || 'assigned'}`)
    },
    onError: (error: any) => {
      alert(`Failed to assign to agent: ${error.response?.data?.detail || error.message}`)
    },
  })

  const updateTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.put(`/projects/${projectId}/tasks/${taskId}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', projectId, taskId] })
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      setIsEditModalOpen(false)
      alert('Task updated successfully!')
    },
    onError: (error: any) => {
      alert(`Failed to update task: ${error.response?.data?.detail || error.message}`)
    },
  })

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const updateData: any = {}
    if (editFormData.title !== task?.title) updateData.title = editFormData.title
    if (editFormData.description !== task?.description) updateData.description = editFormData.description
    if (editFormData.status !== task?.status) updateData.status = editFormData.status
    if (editFormData.priority !== task?.priority) updateData.priority = editFormData.priority
    // Handle assignee: compare properly (empty string vs null/undefined)
    const currentAssigneeId = task?.assigneeId || null
    const newAssigneeId = editFormData.assigneeId || null
    if (newAssigneeId !== currentAssigneeId) {
      updateData.assignee_id = newAssigneeId
      console.log('Assignee change detected:', { current: currentAssigneeId, new: newAssigneeId })
    }
    if (editFormData.currentStage !== task?.currentStage) updateData.current_stage = editFormData.currentStage
    console.log('Updating task with data:', updateData)
    updateTaskMutation.mutate(updateData)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading task...</p>
      </div>
    )
  }

  if (error) {
    const errorMessage = (error as any)?.response?.data?.detail || (error as any)?.message || 'Unknown error'
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">Error loading task</p>
          <p className="text-gray-600 text-sm mb-4">{errorMessage}</p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>Task ID: {taskId}</p>
            <p>Project ID: {projectId}</p>
          </div>
          <Link
            href={`/projects/${projectId}`}
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Project
          </Link>
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 font-semibold mb-2">Task not found</p>
          <p className="text-gray-400 text-sm mb-4">The task you're looking for doesn't exist or you don't have access to it.</p>
          <Link
            href={`/projects/${projectId}`}
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Project
          </Link>
        </div>
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
                    <Link
                      href={`/openspec-editor?projectId=${projectId}&taskId=${taskId}`}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-200 transition flex items-center"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Edit Specification
                    </Link>
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

            {/* Agent Execution Result */}
            {agentTask && (
              <div className={`bg-gradient-to-br rounded-lg shadow p-6 border ${agentTask.result?.subtype === 'success' ? 'from-green-50 to-emerald-50 border-green-200' :
                agentTask.result?.is_error ? 'from-red-50 to-rose-50 border-red-200' :
                  'from-purple-50 to-indigo-50 border-purple-200'
                }`}>
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <Bot className="h-5 w-5 text-purple-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Agent Execution Result</h2>
                  <div className="ml-auto flex items-center gap-2">
                    {/* Subtype badge (success/error) */}
                    {agentTask.result?.subtype && (
                      <span className={`px-3 py-1 text-sm rounded-full font-medium flex items-center gap-1 ${agentTask.result.subtype === 'success' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                        }`}>
                        {agentTask.result.subtype === 'success' ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <AlertCircle className="h-3 w-3" />
                        )}
                        {agentTask.result.subtype}
                      </span>
                    )}
                    {/* Status badge */}
                    <span className={`px-3 py-1 text-sm rounded-full font-medium ${agentTask.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      agentTask.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        agentTask.status === 'running' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                      }`}>
                      {agentTask.status}
                    </span>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                      <DollarSign className="h-3 w-3" />
                      Total Cost
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      ${(agentTask.executionMetrics?.totalCostUsd || agentTask.result?.total_cost_usd || 0).toFixed(4)}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                      <Timer className="h-3 w-3" />
                      Duration
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {((agentTask.executionMetrics?.durationMs || agentTask.result?.duration_ms || 0) / 1000).toFixed(1)}s
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                      <Zap className="h-3 w-3" />
                      Turns
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {agentTask.executionMetrics?.numTurns || agentTask.result?.num_turns || 0}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                      <Clock className="h-3 w-3" />
                      Timing
                    </div>
                    <p className="text-xs text-gray-700">
                      {agentTask.startedAt && new Date(agentTask.startedAt).toLocaleTimeString()}
                      {agentTask.completedAt && ` → ${new Date(agentTask.completedAt).toLocaleTimeString()}`}
                    </p>
                  </div>
                </div>

                {/* Model Usage */}
                {agentTask.result?.modelUsage && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Model Usage</h3>
                    <div className="space-y-2">
                      {Object.entries(agentTask.result.modelUsage).map(([model, usage]) => (
                        <div key={model} className="bg-white rounded-lg p-3 shadow-sm">
                          <p className="text-xs font-mono text-purple-600 mb-1">{model}</p>
                          <div className="flex gap-4 text-xs text-gray-600">
                            <span>In: {usage.inputTokens?.toLocaleString() || 0}</span>
                            <span>Out: {usage.outputTokens?.toLocaleString() || 0}</span>
                            <span className="text-green-600 font-medium">${usage.costUSD?.toFixed(4) || 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Result */}
                {agentTask.result?.result && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Result</h3>
                    <div className="bg-white rounded-lg p-4 shadow-sm max-h-64 overflow-y-auto">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{agentTask.result.result}</p>
                    </div>
                  </div>
                )}
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
                    {task.currentStage?.replace(/_/g, ' ') || 'N/A'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Assignee</p>
                  {task.assigneeId ? (
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {users.find(u => u.id === task.assigneeId)?.name || users.find(u => u.id === task.assigneeId)?.email || 'Unknown User'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Unassigned</span>
                  )}
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
                  <Link
                    href={`/openspec-editor?projectId=${projectId}&taskId=${taskId}`}
                    className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition flex items-center justify-center font-medium"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Edit Specification
                  </Link>
                )}
                <button
                  onClick={() => assignToAgentMutation.mutate()}
                  disabled={assignToAgentMutation.isPending}
                  className="w-full px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Bot className="h-4 w-4" />
                  {assignToAgentMutation.isPending ? 'Assigning...' : 'Assign to intended agent'}
                </button>
                {task.specification && task.specification.approved && !task.codeGeneration && (
                  <button className="w-full px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition">
                    Generate Code
                  </button>
                )}
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition"
                >
                  Edit Task
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setIsEditModalOpen(false)} />
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <form onSubmit={handleEditSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Edit Task</h3>
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    {/* Title */}
                    <div>
                      <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
                        Title *
                      </label>
                      <input
                        type="text"
                        id="edit-title"
                        required
                        value={editFormData.title}
                        onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        id="edit-description"
                        rows={4}
                        value={editFormData.description}
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        id="edit-status"
                        value={editFormData.status}
                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="blocked">Blocked</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Priority */}
                    <div>
                      <label htmlFor="edit-priority" className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        id="edit-priority"
                        value={editFormData.priority}
                        onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>

                    {/* Assignee */}
                    <div>
                      <label htmlFor="edit-assignee" className="block text-sm font-medium text-gray-700 mb-1">
                        Assignee
                      </label>
                      {task.assigneeId && (() => {
                        const currentAssignee = users.find(u => u.id === task.assigneeId)
                        const displayName = currentAssignee?.name || currentAssignee?.email || 'Unknown User'
                        const displayEmail = currentAssignee?.name && currentAssignee?.email ? ` (${currentAssignee.email})` : ''
                        return (
                          <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-xs text-blue-800 font-medium mb-1">Currently Assigned:</p>
                            <div className="flex items-center space-x-2">
                              <User className="h-3 w-3 text-blue-600" />
                              <span className="text-sm text-blue-900">
                                {displayName}{displayEmail}
                              </span>
                            </div>
                          </div>
                        )
                      })()}
                      <select
                        id="edit-assignee"
                        value={editFormData.assigneeId || ''}
                        onChange={(e) => {
                          console.log('Assignee changed to:', e.target.value)
                          setEditFormData({ ...editFormData, assigneeId: e.target.value })
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Unassigned</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                            {user.id === task.assigneeId ? ' (Currently Assigned)' : ''}
                          </option>
                        ))}
                      </select>
                      {task.assigneeId && editFormData.assigneeId !== task.assigneeId && (
                        <p className="mt-1 text-xs text-amber-600">
                          ⚠️ Changing assignee will notify the new assignee
                        </p>
                      )}
                    </div>

                    {/* Current Stage */}
                    <div>
                      <label htmlFor="edit-stage" className="block text-sm font-medium text-gray-700 mb-1">
                        Current Stage
                      </label>
                      <select
                        id="edit-stage"
                        value={editFormData.currentStage}
                        onChange={(e) => setEditFormData({ ...editFormData, currentStage: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="requirement">Requirement</option>
                        <option value="spec_generation">Spec Generation</option>
                        <option value="spec_review">Spec Review</option>
                        <option value="code_generation">Code Generation</option>
                        <option value="pr_created">PR Created</option>
                        <option value="code_review">Code Review</option>
                        <option value="ci_running">CI Running</option>
                        <option value="cd_staging">CD Staging</option>
                        <option value="approval_pending">Approval Pending</option>
                        <option value="cd_production">CD Production</option>
                        <option value="deployed">Deployed</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={updateTaskMutation.isPending}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {updateTaskMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
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


