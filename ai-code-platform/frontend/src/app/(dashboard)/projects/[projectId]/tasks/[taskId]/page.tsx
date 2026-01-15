'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { ArrowLeft, Clock, User, FileText, GitPullRequest, CheckCircle2, AlertCircle, X, Bot, DollarSign, Timer, Zap, Edit, ChevronDown, ChevronUp, Search, Filter, Calendar, Database } from 'lucide-react'
import apiClient from '@/lib/api'
import { TaskDetail, User as UserType, WorkflowHistory } from '@/types'
import Dashboard from '@/components/openspec/Dashboard'
import { Modal } from '@/components/Modal'
import { OpenSpecProject } from '@/lib/types/openspec'

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
  const searchParams = useSearchParams()
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
  // State for Activity Sync
  const [currentActivityId, setCurrentActivityId] = useState<string | null>(null)
  const [lastSyncedStatus, setLastSyncedStatus] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // If navigated here via an "Edit" action (e.g. from TaskCard), open edit modal automatically.
  useEffect(() => {
    const edit = searchParams.get('edit')
    if (edit === '1' || edit === 'true') {
      setIsEditModalOpen(true)
    }
  }, [searchParams])

  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    assigneeId: '',
    currentStage: '',
  })

  // Pagination for Activity Log
  const [activityPage, setActivityPage] = useState(1)
  const [activityPerPage, setActivityPerPage] = useState(5)

  const [searchFilters, setSearchFilters] = useState({
    query: '',
    status: '',
    type: '',
    fromStage: '',
    toStage: '',
    isPublic: 'all',
    startDate: '',
    endDate: '',
  })

  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [expandedActivityIds, setExpandedActivityIds] = useState<Set<string>>(new Set())

  // Manual Handle Modal State
  const [isManualHandleModalOpen, setIsManualHandleModalOpen] = useState(false)
  const [manualHandleActivityId, setManualHandleActivityId] = useState<string | null>(null)
  const [manualHandleAction, setManualHandleAction] = useState('')
  const [manualHandleResult, setManualHandleResult] = useState('')

  // Assign User Modal State
  const [isAssignUserModalOpen, setIsAssignUserModalOpen] = useState(false)
  const [assignUserActivityId, setAssignUserActivityId] = useState<string | null>(null)
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null)

  // Download Codebase State
  const [downloadingActivityId, setDownloadingActivityId] = useState<string | null>(null)


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



  // Fetch project details for breadcrumbs
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await apiClient.get(`/projects/${projectId}`)
      return response.data
    },
    enabled: !!projectId
  })

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await apiClient.get('/auth/me')
      return response.data
    }
  })

  // Fetch users for assignee dropdown
  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ['users'],

    queryFn: async () => {
      const response = await apiClient.get('/auth/users')
      return response.data
    },
  })

  // Date formatting helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Invalid Date'
    try {
      const date = new Date(dateString)
      // Check if date is valid
      if (isNaN(date.getTime())) return 'Invalid Date'

      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(date)
    } catch (e) {
      return 'Invalid Date'
    }
  }

  const toggleActivity = (id: string) => {
    setExpandedActivityIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const renderActivityItem = (activity: any, isActiveSection: boolean) => {
    const isExpanded = expandedActivityIds.has(activity.id)
    return (
      <div key={activity.id} className={`block border rounded-lg overflow-hidden transition-all ${isActiveSection ? 'border-blue-100 bg-blue-50/30' : 'border-gray-200 hover:border-blue-500 bg-white'
        }`}>
        {/* Header Row */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/50"
          onClick={() => toggleActivity(activity.id)}
        >
          {/* Left: User */}
          <div className="flex items-center gap-2 w-1/4 min-w-[150px]">
            {isActiveSection || activity.operatorId?.includes('Agent') ? (
              <Bot className={`w-4 h-4 ${isActiveSection ? 'text-blue-600' : 'text-purple-600'}`} />
            ) : (
              <User className="w-4 h-4 text-gray-500" />
            )}
            <span className={`text-sm font-medium truncate ${isActiveSection ? 'text-blue-700' : 'text-gray-900'}`}>
              {activity.operatorId || 'Unknown User'}
            </span>
          </div>

          {/* Center: Title */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <span className="font-semibold text-gray-900">{activity.title}</span>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
              {/* Status Badge */}
              {activity.status && (
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${activity.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                  activity.status === 'pending_user_input' ? 'bg-yellow-100 text-yellow-800' :
                    activity.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                  }`}>
                  {activity.status}
                </span>
              )}
              {/* Type & Stage Info */}
              {(activity.activityType || activity.fromStage || activity.toStage) && (
                <div className="flex items-center gap-1 text-[10px] text-gray-500">
                  {activity.activityType && <span className="px-1 border border-gray-200 rounded">{activity.activityType}</span>}
                  {(activity.fromStage || activity.toStage) && (
                    <span className="flex items-center gap-1">
                      {activity.fromStage || '?'} <ArrowLeft className="w-2 h-2 rotate-180" /> {activity.toStage || '?'}
                    </span>
                  )}
                </div>
              )}
              {/* Public flag */}
              {activity.isPublic !== undefined && !activity.isPublic && (
                <span className="text-[10px] bg-yellow-50 text-yellow-700 px-1 rounded border border-yellow-100">Private</span>
              )}
            </div>
          </div>

          {/* Right: Actions, Date & Expand */}
          <div className="flex items-center justify-end gap-3 w-1/4 min-w-[200px]">

            <span className="text-xs text-gray-500 whitespace-nowrap">
              {formatDate(activity.createdAt)}
            </span>
            <button
              className="p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded Details - S.T.A.R. Article */}
        {isExpanded && (
          <div className="px-6 pb-6 pt-2 border-t border-gray-100 bg-gray-50/50">
            <div className="prose prose-sm max-w-none">
              <div className="grid gap-4 bg-white p-4 rounded-md border border-gray-200 shadow-sm">
                {/* Detailed Metadata Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-gray-50 rounded text-xs border border-gray-100">
                  <div className="md:col-span-2">
                    <span className="text-gray-400 block mb-1">Name</span>
                    <span className="font-medium text-gray-700">{task?.title || '—'}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-gray-400 block mb-1">Description</span>
                    <span className="font-medium text-gray-700">
                      {(task?.description || '').split('\n')[0]?.trim() || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-1">Status</span>
                    <span className="font-medium text-gray-700">{activity.status || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-1">Type</span>
                    <span className="font-medium text-gray-700">{activity.activityType || 'General'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-1">Stage Transition</span>
                    <span className="font-medium text-gray-700 flex items-center gap-1">
                      {activity.fromStage || '-'} <ArrowLeft className="w-3 h-3 rotate-180" /> {activity.toStage || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-1">Visibility</span>
                    <span className="font-medium text-gray-700">{activity.isPublic === false ? 'Private' : 'Public'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-1">Start Time</span>
                    <span className="font-medium text-gray-700">{formatDate(activity.activityStartAt)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-1">End Time</span>
                    <span className="font-medium text-gray-700">{formatDate(activity.activityEndAt)}</span>
                  </div>
                </div>
                {/* Situation */}
                <div>
                  <h4 className="flex items-center gap-2 text-gray-700 font-bold text-xs uppercase tracking-wider mb-1">
                    < AlertCircle className="w-3 h-3" /> Situation
                  </h4>
                  <p className="text-gray-600">{activity.situation || 'No context provided.'}</p>
                </div>

                {/* Task */}
                <div>
                  <h4 className="flex items-center gap-2 text-gray-800 font-bold text-xs uppercase tracking-wider mb-1">
                    <FileText className="w-3 h-3" /> Task Role
                  </h4>
                  <p className="text-gray-700">{activity.task || activity.title || 'No task description.'}</p>
                </div>

                {/* Action */}
                <div>
                  <h4 className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wider mb-1">
                    <Zap className="w-3 h-3" /> Action
                  </h4>
                  <p className="text-gray-800 font-medium">{activity.action || 'No detailed action log.'}</p>
                </div>

                {/* Result */}
                <div>
                  <h4 className="flex items-center gap-2 text-green-700 font-bold text-xs uppercase tracking-wider mb-1">
                    <CheckCircle2 className="w-3 h-3" /> Result
                  </h4>
                  <p className="text-gray-600 bg-gray-50 p-2 rounded">{activity.result || 'Pending...'}</p>
                </div>

                {/* Tie-back */}
                {activity.tieBack && (
                  <div>
                    <h4 className="flex items-center gap-2 text-purple-700 font-bold text-xs uppercase tracking-wider mb-1">
                      <GitPullRequest className="w-3 h-3" /> Tie-back
                    </h4>
                    <p className="text-gray-600 italic">{activity.tieBack}</p>
                  </div>
                )}

                {/* Raw Metadata (if available) */}
                {activity.workflow_metadata && Object.keys(activity.workflow_metadata).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <h4 className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
                      <Database className="w-3 h-3" /> Workflow Metadata
                    </h4>
                    <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto border border-gray-100">
                      {JSON.stringify(activity.workflow_metadata, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Active Activity Actions */}
                {isActiveSection && (
                  <div className="mt-4 pt-3 border-t border-blue-100 flex gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleActivityEditSpec(activity.id)
                      }}
                      disabled={downloadingActivityId === activity.id}
                      className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
                    >
                      {downloadingActivityId === activity.id ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Edit className="w-3 h-3" />
                          Edit Spec
                        </>
                      )}
                    </button>
                    {activity.status === 'pending_user_input' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setAssignUserActivityId(activity.id)
                            setSelectedAssigneeId(task?.assigneeId || '')
                            setIsAssignUserModalOpen(true)
                          }}
                          className="px-3 py-1.5 text-xs font-medium bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                        >
                          Assign to others
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            // Check if task status allows agent assignment
                            if (!task?.status || task.status === 'completed' || task.status === 'failed') {
                              alert('Cannot assign agent to completed/failed task.');
                              return;
                            }
                            if (window.confirm('Are you sure you want to assign this task to an AI Agent?')) {
                              assignToAgentMutation.mutate({ sourceActivityId: activity.id });
                            }
                          }}
                          className="px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded hover:bg-purple-700 transition flex items-center gap-2"
                          disabled={assignToAgentMutation.isPending}
                        >
                          {assignToAgentMutation.isPending ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Bot className="w-3 h-3" />
                          )}
                          Assign to Agent
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setManualHandleActivityId(activity.id)
                            setManualHandleAction('')
                            setManualHandleResult('')
                            setIsManualHandleModalOpen(true)
                          }}
                          className="px-3 py-1.5 text-xs font-medium bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition"
                        >
                          Manually Handled
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Query for agent task status
  const { data: agentTask, refetch: refetchAgentTask } = useQuery<AgentTaskResult>({
    queryKey: ['agentTask', agentTaskId],
    queryFn: async () => {
      const response = await apiClient.get(`/projects/agent-tasks/${agentTaskId}`)
      return response.data
    },
    enabled: !!agentTaskId,
    refetchInterval: (query) => {
      // Poll every 2 seconds if task is running
      if (query.state.data?.status === 'completed' || query.state.data?.status === 'failed') return false
      return 2000
    },
  })

  // Sync Loop: Push Agent Status Updates to Activity Log
  useEffect(() => {
    if (!agentTask || !currentActivityId) return

    const status = agentTask.status
    const result = agentTask.result

    // 1. Status Change -> Append Action
    if (status !== lastSyncedStatus) {
      if (lastSyncedStatus !== null) { // Don't append on first load unless you want to
        const actionMsg = `Remote Agent Status: ${status}\n`
        appendActivityMutation.mutate({ id: currentActivityId, action: actionMsg })
      }
      setLastSyncedStatus(status)

      // 2. Completion/Failure -> End Activity (Result)
      // Moved INSIDE the sentinel check to prevent double-ending
      if (status === 'completed') {
        const resultSummary = `Agent Completed.\nDuration: ${agentTask.executionMetrics?.durationMs}ms\nCost: $${agentTask.executionMetrics?.totalCostUsd}\nResult: ${JSON.stringify(result?.result || 'Success')}`
        endActivityMutation.mutate({
          id: currentActivityId,
          result: resultSummary,
          status: 'completed'
        })
      } else if (status === 'failed') {
        endActivityMutation.mutate({
          id: currentActivityId,
          result: `Agent Failed. Error: ${JSON.stringify(result)}`,
          status: 'failed'
        })
      }
    }
  }, [agentTask, currentActivityId]) // Run whenever agentTask updates
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

      // Auto-detect active agent task from workflow history
      const activeActivity = task.workflowHistory?.find(
        (a: any) => a.status === 'in_progress' || a.status === 'running'
      )
      if (activeActivity) {
        if (!agentTaskId) {
          // Try to recover remote_task_id from workflow_metadata
          const meta = (activeActivity as any).workflow_metadata
          if (meta?.remote_task_id) {
            setAgentTaskId(meta.remote_task_id)
            setCurrentActivityId(activeActivity.id)
          }
        }
        // Auto-expand active activity by default
        setExpandedActivityIds(prev => new Set(prev).add(activeActivity.id))
      }
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
    mutationFn: async (params?: { sourceActivityId?: string }) => {
      // Call new endpoint which returns an Activity object
      let url = `/projects/${projectId}/tasks/${taskId}/assign`
      if (params?.sourceActivityId) {
        url += `?source_activity_id=${params.sourceActivityId}`
      }
      const response = await apiClient.post(url)
      return response.data
    },
    onSuccess: (activity) => {
      // activity is the ActivityLog object
      // Backend returns 'workflow_metadata' (renamed from metadata)
      if (activity.workflow_metadata?.remote_task_id) {
        setAgentTaskId(activity.workflow_metadata.remote_task_id)
        setCurrentActivityId(activity.id)
        setLastSyncedStatus('dispatched') // Initial status
      }
      queryClient.invalidateQueries({ queryKey: ['task', projectId, taskId] })
      alert(`Task assigned to agent! Remote Task ID: ${activity.workflow_metadata?.remote_task_id}`)
    },
    onError: (error: any) => {
      alert(`Failed to assign to agent: ${error.response?.data?.detail || error.message}`)
    },
  })

  // Mutation to Append Updates to Activity Log
  const appendActivityMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string, action: string }) => {
      await apiClient.post(`/activities/${id}/append`, { action_chunk: action })
    }
  })

  // Mutation to End Activity (Final Result)
  const endActivityMutation = useMutation({
    mutationFn: async ({ id, result, status }: { id: string, result: string, status: string }) => {
      await apiClient.post(`/activities/${id}/end`, { result, status })
    },
    onSuccess: async () => {
      // Invalidate and explicitly refetch to ensure UI updates immediately
      await queryClient.invalidateQueries({ queryKey: ['task', projectId, taskId] })
      await queryClient.refetchQueries({ queryKey: ['task', projectId, taskId] })

      setAgentTaskId(null)
      setCurrentActivityId(null)
      setLastSyncedStatus(null)
    }
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

  // Derived state for activities
  const sortedActivities = [...(task?.workflowHistory || [])].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  // Split into Active (in_progress) and Past (log)
  // Fix: Exclude "dead" activities that might have an end time but stuck status (from previous bugs)
  const activeActivities = sortedActivities.filter(a =>
    (a.status === 'in_progress' || a.status === 'running' || a.status === 'pending_user_input' || a.status === 'pending') && !a.activityEndAt
  )

  // Filter Past Activities based on Search Criteria
  const filteredPastActivities = sortedActivities.filter(a => {
    // 1. Exclude active
    if (a.status === 'in_progress' || a.status === 'running' || a.status === 'pending_user_input' || a.status === 'pending') return false

    // 2. Query (Full Text) - checks title, action, result, situation, operatorId
    if (searchFilters.query) {
      const q = searchFilters.query.toLowerCase()
      const text = `${a.title || ''} ${a.action || ''} ${a.result || ''} ${a.situation || ''} ${a.operatorId || ''}`.toLowerCase()
      if (!text.includes(q)) return false
    }

    // 3. Status
    if (searchFilters.status && a.status !== searchFilters.status) return false

    // 4. Type
    if (searchFilters.type && a.activityType !== searchFilters.type) return false

    // 5. From Stage
    if (searchFilters.fromStage && a.fromStage !== searchFilters.fromStage) return false

    // 6. To Stage
    if (searchFilters.toStage && a.toStage !== searchFilters.toStage) return false

    // 7. Visibility
    if (searchFilters.isPublic === 'public' && a.isPublic === false) return false
    if (searchFilters.isPublic === 'private' && a.isPublic !== false) return false

    // 8. Time Range
    if (searchFilters.startDate) {
      if (new Date(a.createdAt) < new Date(searchFilters.startDate)) return false
    }
    if (searchFilters.endDate) {
      if (new Date(a.createdAt) > new Date(searchFilters.endDate)) return false
    }

    return true
  })

  // Pagination for Filtered Results
  const totalActivityPages = Math.ceil(filteredPastActivities.length / activityPerPage)
  const paginatedActivities = filteredPastActivities.slice(
    (activityPage - 1) * activityPerPage,
    activityPage * activityPerPage
  )

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

    updateTaskMutation.mutate(updateData)
  }

  const handleManualHandleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualHandleActivityId || (!manualHandleAction.trim() && !manualHandleResult.trim())) return

    const operatorName = currentUser?.name || currentUser?.email || 'Unknown User'
    const fullAction = `\n[Manual User: ${operatorName}]: ${manualHandleAction}`

    // Chain: Append -> End
    appendActivityMutation.mutate(
      { id: manualHandleActivityId, action: fullAction },
      {
        onSuccess: () => {
          endActivityMutation.mutate({
            id: manualHandleActivityId,
            result: manualHandleResult || 'Manually handled by user.',
            status: 'completed'
          }, {
            onSuccess: () => {
              setIsManualHandleModalOpen(false)
              setManualHandleActivityId(null)
              setManualHandleAction('')
              setManualHandleResult('')
              alert('Activity handled successfully.')
            },
            onError: (err: any) => {
              alert(`Failed to complete activity: ${err.message}`)
            }
          })
        },
        onError: (err: any) => {
          alert(`Failed to append aciton: ${err.message}`)
        }
      }
    )
  }

  const handleAssignUserSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAssigneeId) return

    updateTaskMutation.mutate(
      { assignee_id: selectedAssigneeId },
      {
        onSuccess: () => {
          // Optional: Add an activity log entry about the reassignment?
          // For now, just close the modal. The query invalidation in updateTaskMutation will refresh the UI.
          setIsAssignUserModalOpen(false)
          setAssignUserActivityId(null)
          // alert('Task re-assigned successfully.') // rely on updateTaskMutation's alert
        }
      }
    )
  }

  // Handle Edit Spec for activity - download codebase and redirect
  const handleActivityEditSpec = async (activityId: string) => {
    try {
      setDownloadingActivityId(activityId)

      // Call backend to download codebase for this activity
      await apiClient.post(`/openspec/projects/${projectId}/activities/${activityId}/download-codebase`)

      // Redirect to OpenSpec editor with activityId
      router.push(`/openspec-editor?projectId=${projectId}&activityId=${activityId}`)
    } catch (error: any) {
      console.error('Failed to download codebase:', error)
      alert(`Failed to download codebase: ${error.response?.data?.detail || error.message}`)
    } finally {
      setDownloadingActivityId(null)
    }
  }

  // Check if an activity is active (in-progress and not completed)
  const isActiveActivity = (activity: WorkflowHistory) => {
    // An activity is active if its status is 'in_progress' or similar
    // and not 'completed'. You can adjust this logic based on your status values.
    return activity.status &&
      (activity.status === 'in_progress' || activity.status === 'pending')
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
          <p className="text-gray-600 text-sm mb-4">
            {errorMessage === 'Network Error'
              ? 'Cannot connect to backend. Is the server running on http://localhost:8000? Check CORS settings.'
              : errorMessage}
          </p>
          <button
            onClick={() => { window.location.reload() }}
            className="mb-4 text-xs bg-gray-200 hover:bg-gray-300 rounded px-2 py-1"
          >
            Retry/Reload
          </button>
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
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-2">
          <Link
            href={`/projects/${projectId}`}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium mr-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <span className="font-bold text-gray-700 text-lg">Task</span>
          <span className="text-gray-500 text-sm font-medium ml-1 flex items-center gap-1">
            {project?.name ? `/${project.name}` : ''}
            {task.title ? `/${task.title}` : ''}
          </span>
          <span className={`ml-2 px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
            {task.status}
          </span>
        </div>
        <div className="flex items-center gap-2">

          {task.specification && task.specification.approved && !task.codeGeneration && (
            <button
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <GitPullRequest className="w-4 h-4" />
              Generate Code
            </button>
          )}
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit Task
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-row overflow-hidden">
        {/* Main Column */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-5xl mx-auto space-y-6">


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



            {/* Agent Execution Result */}
            {/* Active Activities - From DB WorkflowHistory */}
            {activeActivities.length > 0 && (
              <div className="bg-white rounded-lg shadow mt-6 border-l-4 border-blue-500">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-500" />
                    Active Activities
                  </h2>
                </div>
                <div className="p-6 space-y-2">
                  {activeActivities.map((activity) => renderActivityItem(activity, true))}
                </div>
              </div>
            )}

            {/* Activity Log */}
            <div className="bg-white rounded-lg shadow mt-6">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Activity Log</h2>
                <div className="flex items-center gap-3">
                  {/* Search Toggle */}
                  <button
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                    className={`p-2 rounded-md transition-colors flex items-center gap-2 text-sm font-medium ${isSearchOpen ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
                      }`}
                  >
                    <Search className="w-4 h-4" />
                    {isSearchOpen ? 'Hide Filters' : 'Search / Filter'}
                  </button>
                  <div className="h-4 w-px bg-gray-300"></div>
                  <span className="text-sm text-gray-500">Items per page:</span>
                  <select
                    value={activityPerPage}
                    onChange={(e) => {
                      setActivityPerPage(Number(e.target.value))
                      setActivityPage(1)
                    }}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>
              </div>

              {/* Search Panel */}
              {isSearchOpen && (
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {/* Full Text Search */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-4">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Full Text Search</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search title, action, result, operator..."
                          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          value={searchFilters.query}
                          onChange={(e) => setSearchFilters(prev => ({ ...prev, query: e.target.value }))}
                        />
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                      <select
                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        value={searchFilters.status}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, status: e.target.value }))}
                      >
                        <option value="">All Statuses</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                        <option value="in_progress">In Progress</option>
                      </select>
                    </div>

                    {/* Type */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Activity Type</label>
                      <input
                        type="text"
                        placeholder="e.g. system, user"
                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        value={searchFilters.type}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, type: e.target.value }))}
                      />
                    </div>

                    {/* From Stage */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">From Stage</label>
                      <input
                        type="text"
                        placeholder="e.g. requirement"
                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        value={searchFilters.fromStage}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, fromStage: e.target.value }))}
                      />
                    </div>

                    {/* To Stage */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">To Stage</label>
                      <input
                        type="text"
                        placeholder="e.g. implementation"
                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        value={searchFilters.toStage}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, toStage: e.target.value }))}
                      />
                    </div>

                    {/* Visibility */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Visibility</label>
                      <select
                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        value={searchFilters.isPublic}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, isPublic: e.target.value }))}
                      >
                        <option value="">Any</option>
                        <option value="public">Public Only</option>
                        <option value="private">Private Only</option>
                      </select>
                    </div>

                    {/* Date Range Start */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Start Time</label>
                      <input
                        type="datetime-local"
                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        value={searchFilters.startDate}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>

                    {/* Date Range End */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">End Time</label>
                      <input
                        type="datetime-local"
                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        value={searchFilters.endDate}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => setSearchFilters({
                        query: '',
                        status: '',
                        type: '',
                        fromStage: '',
                        toStage: '',
                        isPublic: '',
                        startDate: '',
                        endDate: ''
                      })}
                      className="text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              )}
              <div className="p-6 space-y-2">
                {paginatedActivities.map((activity) => renderActivityItem(activity, false))}
              </div>

              {/* Pagination Footer */}
              {totalActivityPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {(activityPage - 1) * activityPerPage + 1} to {Math.min(activityPage * activityPerPage, filteredPastActivities.length)} of {filteredPastActivities.length}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                      disabled={activityPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalActivityPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setActivityPage(p)}
                        className={`px-3 py-1 text-sm border rounded-md ${activityPage === p ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-50'}`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setActivityPage((p) => Math.min(totalActivityPages, p + 1))}
                      disabled={activityPage === totalActivityPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <Dashboard
          project={project ? {
            id: projectId,
            projectName: project.name,
            owner: (project.github_repo_url || project.githubRepoUrl || '').split('/')[3] || 'user',
            repository: (project.github_repo_url || project.githubRepoUrl || '').split('/')[4]?.replace('.git', '') || 'repo',
            createdAt: project.createdAt || '',
            updatedAt: project.updatedAt || '',
            isPrivate: false,
            specTree: []
          } as OpenSpecProject : undefined}
          task={{ ...task, description: undefined } as any}
          taskDescription={undefined}
          users={users}
          onProjectChange={() => { }}
          onGenerateCode={() => { }}
          onOpenTerminal={() => { }}
          isGenerating={false}
          isReadOnly={true}
          className="w-80 flex-shrink-0 !border-l border-gray-200 !h-full bg-white"
        />
      </main>

      {/* Edit Modal */}
      {
        isEditModalOpen && (
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
                          {(() => {
                            const options = [
                              { value: 'pending', label: 'Pending' },
                              { value: 'in_progress', label: 'In Progress' },
                              { value: 'blocked', label: 'Blocked' },
                              { value: 'completed', label: 'Completed' },
                              { value: 'failed', label: 'Failed' },
                              { value: 'cancelled', label: 'Cancelled' }
                            ]

                            // Get allowed target statuses based on backend response
                            // But also always include the *current* status so it is selectable/visible
                            const currentStatus = task.status || 'pending'
                            const allowed = new Set(task.allowed_transitions || [])
                            allowed.add(currentStatus)

                            return options
                              .filter(opt => allowed.has(opt.value))
                              .map(opt => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))
                          })()}
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
                          disabled={!!task.assigneeId}
                          onChange={(e) => {
                            console.log('Assignee changed to:', e.target.value)
                            setEditFormData({ ...editFormData, assigneeId: e.target.value })
                          }}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${task.assigneeId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
        )
      }


      {/* Manual Handle Modal */}
      {isManualHandleModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Manual Activity Completion</h3>
            <p className="text-sm text-gray-500 mb-4">
              Describe what actions you took to complete this step. This will be logged as the final result.
            </p>
            <form onSubmit={handleManualHandleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Append to Action Log</label>
                <textarea
                  value={manualHandleAction}
                  onChange={(e) => setManualHandleAction(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 h-24 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-sm"
                  placeholder="Describe your actions (e.g. 'Updated config file')..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Final Result</label>
                <textarea
                  value={manualHandleResult}
                  onChange={(e) => setManualHandleResult(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 h-20 focus:ring-1 focus:ring-green-500 focus:border-green-500 outline-none resize-none text-sm"
                  placeholder="Summary of outcome (e.g. 'Issue Resolved')..."
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualHandleModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!manualHandleResult.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Complete Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Assign User Modal */}
      <Modal
        isOpen={isAssignUserModalOpen}
        onClose={() => setIsAssignUserModalOpen(false)}
        title="Assign Task to User"
        size="md"
      >
        <form onSubmit={handleAssignUserSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
            <select
              value={selectedAssigneeId || ''}
              onChange={(e) => setSelectedAssigneeId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a user...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsAssignUserModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedAssigneeId || updateTaskMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {updateTaskMutation.isPending ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        </form>
      </Modal>
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
