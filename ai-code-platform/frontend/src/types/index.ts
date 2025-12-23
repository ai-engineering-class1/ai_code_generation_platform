export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'developer' | 'manager'
  avatarUrl?: string
  bio?: string
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

export interface Project {
  id: string
  name: string
  description: string
  ownerId: string
  jira_project_key?: string
  github_repo_url?: string
  status: 'active' | 'paused' | 'completed' | 'archived'
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  projectId: string
  jiraIssueKey?: string
  title: string
  description: string
  type: 'agent' | 'service' | 'feature' | 'bugfix'
  status: 'pending' | 'in_progress' | 'blocked' | 'completed' | 'failed' | 'cancelled'
  currentStage: TaskStage
  priority: 'low' | 'medium' | 'high' | 'critical'
  assigneeId?: string
  createdAt: string
  updatedAt: string
  allowed_transitions?: string[] // From backend property
}

export type TaskStage =
  | 'requirement'
  | 'spec_generation'
  | 'spec_review'
  | 'code_generation'
  | 'pr_created'
  | 'code_review'
  | 'ci_running'
  | 'cd_staging'
  | 'approval_pending'
  | 'cd_production'
  | 'deployed'
  | 'failed'

export interface JiraConfiguration {
  id: string
  projectId: string
  jiraUrl: string
  jiraProjectKey: string
  jiraEmail: string
  syncEnabled: boolean
  lastSyncAt?: string
  createdAt: string
  updatedAt: string
}

export interface GitHubConfiguration {
  id: string
  projectId: string
  repoOwner: string
  repoName: string
  branchPrefix: string
  autoMerge: boolean
  createdAt: string
  updatedAt: string
}

export interface Notification {
  id: string
  userId: string
  projectId?: string
  taskId?: string
  type: 'info' | 'warning' | 'error' | 'approval_required'
  title: string
  message: string
  read: boolean
  actionUrl?: string
  createdAt: string
}

export interface Specification {
  id: string
  taskId: string
  content: string
  githubFileUrl?: string
  version: number
  approved: boolean
  approvedBy?: string
  approvedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CodeGeneration {
  id: string
  taskId: string
  specificationId: string
  githubBranch?: string
  githubPrNumber?: number
  githubPrUrl?: string
  status: 'generating' | 'review' | 'approved' | 'merged' | 'failed'
  codeReviewFeedback?: string
  createdAt: string
  updatedAt: string
}

export interface WorkflowHistory {
  id: string
  taskId: string
  fromStage?: string
  toStage?: string
  title?: string
  status?: string
  operatorId?: string
  action?: string
  result?: string
  situation?: string
  activityStartAt?: string
  activityEndAt?: string
  activityType?: string
  isPublic?: boolean
  task?: string
  tieBack?: string
  metadata?: Record<string, any>
  workflow_metadata?: Record<string, any>
  createdAt: string
}

export interface TaskDetail extends Task {
  specification?: Specification
  codeGeneration?: CodeGeneration
  workflowHistory: WorkflowHistory[]
  latestActivityStatus?: string
  latestActivityRole?: string
}

export interface PipelineExecution {
  id: string
  codeGenerationId: string
  pipelineType: 'ci' | 'cd'
  githubRunId?: string
  status: 'pending' | 'running' | 'success' | 'failed'
  logs?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
}

export interface ProjectProgress {
  totalTasks: number
  tasksByStage: Record<TaskStage, number>
  tasksByStatus: Record<string, number>
  successRate: number
  averageCompletionTime: number
  currentVelocity: number
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
}

export interface CreateProjectData {
  name: string
  description?: string
  jiraProjectKey?: string
  githubRepoUrl?: string
}

export interface CreateTaskData {
  title: string
  description?: string
  type: 'agent' | 'service' | 'feature' | 'bugfix'
  priority?: 'low' | 'medium' | 'high' | 'critical'
  jiraIssueKey?: string
  assigneeId?: string
}

export interface ConfigureJiraData {
  jiraUrl: string
  jiraProjectKey: string
  jiraEmail: string
  accessToken: string
  webhookSecret?: string
  syncEnabled?: boolean
}

export interface ConfigureGitHubData {
  repoOwner: string
  repoName: string
  accessToken: string
  branchPrefix?: string
  autoMerge?: boolean
}

