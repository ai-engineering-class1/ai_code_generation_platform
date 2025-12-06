'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { ArrowLeft, Save, RefreshCw, Info, CheckCircle2, ExternalLink, Plus } from 'lucide-react'
import apiClient from '@/lib/api'
import { Project, JiraConfiguration, GitHubConfiguration } from '@/types'
import UserMenu from '@/components/UserMenu'

export default function ProjectSettingsPage({ params }: { params: { projectId: string } }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { projectId } = params

  // Helper function to get Jira URLs
  const getJiraUrls = (jiraUrl: string, projectKey: string) => {
    // Clean up the URL - extract just the base domain
    let baseUrl = jiraUrl.trim()
    
    // Remove trailing slash
    baseUrl = baseUrl.replace(/\/$/, '')
    
    // Extract just the domain (remove any existing paths like /wiki/home, /jira, etc.)
    try {
      const urlObj = new URL(baseUrl)
      // Keep only the protocol and hostname (e.g., https://joygu2022.atlassian.net)
      baseUrl = `${urlObj.protocol}//${urlObj.hostname}`
    } catch (e) {
      // If URL parsing fails, try to extract domain manually
      const match = baseUrl.match(/https?:\/\/[^\/]+/)
      if (match) {
        baseUrl = match[0]
      }
    }
    
    // For Jira Cloud (atlassian.net) - use classic format which is most reliable
    if (baseUrl.includes('atlassian.net')) {
      return {
        // Classic format (most reliable - works for all Jira products)
        createIssue: `${baseUrl}/secure/CreateIssue!default.jspa?project=${projectKey}`,
        // Alternative: Jira Core format
        createIssueCore: `${baseUrl}/jira/core/projects/${projectKey}/issues/create`,
        // Alternative: Jira Software format
        createIssueSoftware: `${baseUrl}/jira/software/projects/${projectKey}/issues/create`,
        // Project list page with JQL filter (shows actual task list)
        projectList: `${baseUrl}/jira/core/projects/${projectKey}/list?jql=project%20%3D%20%22${projectKey}%22%20ORDER%20BY%20created%20DESC`,
        // Project browse page (alternative)
        projectBrowse: `${baseUrl}/browse/${projectKey}`
      }
    }
    
    // For Jira Server/Data Center
    return {
      // Classic create issue URL
      createIssue: `${baseUrl}/secure/CreateIssue!default.jspa?project=${projectKey}`,
      // Alternative format
      createIssueAlt: `${baseUrl}/secure/CreateIssueDetails!init.jspa?project=${projectKey}`,
      // Project browse page
      projectBoard: `${baseUrl}/browse/${projectKey}`,
      projectBrowse: `${baseUrl}/browse/${projectKey}`,
      projectPage: `${baseUrl}/browse/${projectKey}`
    }
  }

  const [activeTab, setActiveTab] = useState<'general' | 'jira' | 'github'>('general')
  const [projectData, setProjectData] = useState({ name: '', description: '' })
  const [jiraData, setJiraData] = useState({
    jiraUrl: '',
    jiraProjectKey: '',
    jiraEmail: '',
    accessToken: '',
    syncEnabled: true,
  })
  const [githubData, setGithubData] = useState({
    repoOwner: '',
    repoName: '',
    accessToken: '',
    branchPrefix: 'ai-generated',
    autoMerge: false,
  })
  const [showJiraHelp, setShowJiraHelp] = useState(false)
  const [showGithubHelp, setShowGithubHelp] = useState(false)

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    }
  }, [router])

  // Fetch project
  const { data: project } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await apiClient.get(`/projects/${projectId}`)
      return response.data
    },
  })

  // Fetch Jira config
  const { data: jiraConfig } = useQuery<JiraConfiguration>({
    queryKey: ['jiraConfig', projectId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/jira/config/${projectId}`)
        return response.data
      } catch (error) {
        return null
      }
    },
  })

  // Fetch GitHub config
  const { data: githubConfig } = useQuery<GitHubConfiguration>({
    queryKey: ['githubConfig', projectId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/github/config/${projectId}`)
        return response.data
      } catch (error) {
        return null
      }
    },
  })

  // Initialize form data when project loads
  useEffect(() => {
    if (project) {
      setProjectData({
        name: project.name,
        description: project.description || '',
      })
    }
  }, [project])

  useEffect(() => {
    if (jiraConfig) {
      setJiraData({
        jiraUrl: jiraConfig.jiraUrl,
        jiraProjectKey: jiraConfig.jiraProjectKey,
        jiraEmail: jiraConfig.jiraEmail || '',
        accessToken: '', // Don't show existing token
        syncEnabled: jiraConfig.syncEnabled,
      })
    }
  }, [jiraConfig])

  useEffect(() => {
    if (githubConfig) {
      setGithubData({
        repoOwner: githubConfig.repoOwner,
        repoName: githubConfig.repoName,
        accessToken: '', // Don't show existing token
        branchPrefix: githubConfig.branchPrefix,
        autoMerge: githubConfig.autoMerge,
      })
    }
  }, [githubConfig])

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.put(`/projects/${projectId}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      alert('Project updated successfully!')
    },
  })

  // Configure Jira mutation
  const configureJiraMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/jira/config', {
        ...data,
        projectId: projectId,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jiraConfig', projectId] })
      alert('Jira configuration saved successfully!')
      // Reset form if needed
      setJiraData({
        jiraUrl: '',
        jiraProjectKey: '',
        jiraEmail: '',
        accessToken: '',
        syncEnabled: true,
      })
    },
    onError: (error: any) => {
      console.error('Jira configuration error:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to save Jira configuration'
      alert(`Error: ${errorMessage}`)
    },
  })

  // Configure GitHub mutation
  const configureGitHubMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/github/config', {
        ...data,
        project_id: projectId,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['githubConfig', projectId] })
      alert('GitHub configuration saved successfully!')
    },
  })

  // Sync Jira issues
  const syncJiraMutation = useMutation({
    mutationFn: async () => {
      console.log('Calling sync endpoint:', `/jira/sync/${projectId}`)
      try {
        const response = await apiClient.post(`/jira/sync/${projectId}`)
        console.log('Sync response:', response.data)
        return response.data
      } catch (error: any) {
        console.error('Sync error:', error)
        console.error('Error response:', error.response?.data)
        throw error
      }
    },
    onSuccess: () => {
      alert('Jira sync started!')
    },
    onError: (error: any) => {
      console.error('Sync mutation error:', error)
      alert(`Error starting sync: ${error.response?.data?.detail || error.message}`)
    },
  })

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateProjectMutation.mutate(projectData)
  }

  const handleJiraSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!jiraData.jiraUrl || !jiraData.jiraProjectKey || !jiraData.jiraEmail) {
      alert('Please fill in all required fields: Jira URL, Project Key, and Email')
      return
    }
    
    // If updating existing config, accessToken is optional
    // If creating new config, accessToken is required
    if (!jiraConfig && !jiraData.accessToken) {
      alert('Please provide a Jira API Token')
      return
    }
    
    // Build payload - only include accessToken if it's provided
    const payload: any = {
      jiraUrl: jiraData.jiraUrl,
      jiraProjectKey: jiraData.jiraProjectKey,
      jiraEmail: jiraData.jiraEmail,
      syncEnabled: jiraData.syncEnabled,
    }
    
    // Only include accessToken if it's provided
    if (jiraData.accessToken) {
      payload.accessToken = jiraData.accessToken
    }
    
    console.log('Submitting Jira config:', payload) // Debug log
    configureJiraMutation.mutate(payload)
  }

  const handleGitHubSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Build payload - only include accessToken if it's provided
    const payload: any = {
      repoOwner: githubData.repoOwner,
      repoName: githubData.repoName,
      branchPrefix: githubData.branchPrefix,
      autoMerge: githubData.autoMerge,
    }
    
    // Only include accessToken if it's provided
    if (githubData.accessToken) {
      payload.accessToken = githubData.accessToken
    }
    
    configureGitHubMutation.mutate(payload)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href={`/projects/${projectId}`}
              className="text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Project Settings</h1>
          </div>
          <UserMenu />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('general')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'general'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                General
              </button>
              <button
                onClick={() => setActiveTab('jira')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'jira'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Jira Integration
              </button>
              <button
                onClick={() => setActiveTab('github')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'github'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                GitHub Integration
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'general' && (
              <form onSubmit={handleProjectSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={projectData.name}
                    onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    value={projectData.description}
                    onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={updateProjectMutation.isPending}
                    className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateProjectMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'jira' && (
              <form onSubmit={handleJiraSubmit} className="space-y-6">
                <div className="flex items-start justify-between rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Need help finding these values?</p>
                    <p className="text-sm text-blue-700">
                      Click the info icon to see step-by-step instructions for each Jira field.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowJiraHelp((prev) => !prev)}
                    className="inline-flex items-center rounded-full border border-blue-300 bg-white px-3 py-1 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-100 transition"
                  >
                    <Info className="mr-2 h-4 w-4" />
                    {showJiraHelp ? 'Hide guide' : 'Show guide'}
                  </button>
                </div>

                {showJiraHelp && (
                  <div className="rounded-lg border border-blue-200 bg-white p-4 text-sm text-gray-700 shadow-sm space-y-3">
                    <div>
                      <p className="font-semibold text-gray-900">Jira URL</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Log in to Jira in your browser.</li>
                        <li>Copy the base domain from the address bar (e.g. <code>https://your-domain.atlassian.net</code>).</li>
                        <li>Paste it into the Jira URL field.</li>
                      </ol>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Jira Project Key</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>In Jira, open the project you want to connect.</li>
                        <li>Go to <strong>Project settings &gt; Details</strong>.</li>
                        <li>Copy the value shown under <strong>Key</strong> (usually 2-4 uppercase letters).</li>
                      </ol>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Jira API Token</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Visit{' '}
                          <a
                            href="https://id.atlassian.com/manage-profile/security/api-tokens"
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 underline"
                          >
                            Atlassian API tokens
                          </a>
                          .
                        </li>
                        <li>Click <strong>Create API token</strong>, give it a name, and copy the generated token.</li>
                        <li>Paste the token into the Jira API Token field. Keep it somewhere safe – Atlassian only shows it once.</li>
                      </ol>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="jiraUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    Jira URL *
                  </label>
                  <input
                    type="url"
                    id="jiraUrl"
                    required
                    value={jiraData.jiraUrl}
                    onChange={(e) => setJiraData({ ...jiraData, jiraUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://your-domain.atlassian.net"
                  />
                </div>

                <div>
                  <label htmlFor="jiraEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Jira Email Address *
                  </label>
                  <input
                    type="email"
                    id="jiraEmail"
                    required
                    value={jiraData.jiraEmail}
                    onChange={(e) => setJiraData({ ...jiraData, jiraEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="your-email@example.com"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    The email address associated with your Jira account
                  </p>
                </div>

                <div>
                  <label htmlFor="jiraProjectKey" className="block text-sm font-medium text-gray-700 mb-2">
                    Jira Project Key *
                  </label>
                  <input
                    type="text"
                    id="jiraProjectKey"
                    required
                    value={jiraData.jiraProjectKey}
                    onChange={(e) => setJiraData({ ...jiraData, jiraProjectKey: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="PROJ"
                  />
                </div>

                <div>
                  <label htmlFor="jiraAccessToken" className="block text-sm font-medium text-gray-700 mb-2">
                    Jira API Token * {jiraConfig && '(Leave empty to keep existing)'}
                  </label>
                  {jiraConfig && (
                    <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-800 flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Token is saved (hidden for security)
                      </p>
                    </div>
                  )}
                  <input
                    type="password"
                    id="jiraAccessToken"
                    required={!jiraConfig}
                    value={jiraData.accessToken}
                    onChange={(e) => setJiraData({ ...jiraData, accessToken: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder={jiraConfig ? "Enter new token to update" : "Your Jira API token"}
                  />
                  {jiraConfig && (
                    <p className="mt-1 text-sm text-gray-500">
                      Leave empty to keep the existing token, or enter a new one to update it
                    </p>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="syncEnabled"
                    checked={jiraData.syncEnabled}
                    onChange={(e) => setJiraData({ ...jiraData, syncEnabled: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="syncEnabled" className="ml-2 block text-sm text-gray-900">
                    Enable automatic sync
                  </label>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="flex flex-col gap-3">
                    {jiraConfig && (() => {
                      const jiraUrls = getJiraUrls(jiraConfig.jiraUrl, jiraConfig.jiraProjectKey)
                      return (
                        <>
                          <div className="flex items-center gap-2 flex-wrap">
                            <a
                              href={jiraUrls.createIssue}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                              title="Open Jira create issue page (classic format)"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Create Task in Jira
                              <ExternalLink className="h-4 w-4 ml-2" />
                            </a>
                            <a
                              href={jiraUrls.projectList || jiraUrls.projectBrowse}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                              title="Open Jira task list page"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View Tasks in Jira
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                console.log('Sync Now button clicked!')
                                console.log('Project ID:', projectId)
                                console.log('Jira config exists:', !!jiraConfig)
                                syncJiraMutation.mutate()
                              }}
                              disabled={syncJiraMutation.isPending}
                              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition disabled:opacity-50"
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              {syncJiraMutation.isPending ? 'Syncing...' : 'Sync Now'}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500">
                            💡 If "Create Task" doesn't work, use "Jira Project" button and click the "Create" button in Jira.
                          </p>
                        </>
                      )
                    })()}
                  </div>
                  <button
                    type="submit"
                    disabled={configureJiraMutation.isPending}
                    className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {configureJiraMutation.isPending ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'github' && (
              <form onSubmit={handleGitHubSubmit} className="space-y-6">
                <div className="flex items-start justify-between rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Need help connecting GitHub?</p>
                    <p className="text-sm text-blue-700">
                      Click the info icon to see how to find each field inside GitHub.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGithubHelp((prev) => !prev)}
                    className="inline-flex items-center rounded-full border border-blue-300 bg-white px-3 py-1 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-100 transition"
                  >
                    <Info className="mr-2 h-4 w-4" />
                    {showGithubHelp ? 'Hide guide' : 'Show guide'}
                  </button>
                </div>

                {showGithubHelp && (
                  <div className="rounded-lg border border-blue-200 bg-white p-4 text-sm text-gray-700 shadow-sm space-y-3">
                    <div>
                      <p className="font-semibold text-gray-900">Repository Owner</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Open the repository in GitHub.</li>
                        <li>The owner is the first part of the URL (e.g. <code>github.com/owner/repo</code>).</li>
                        <li>Use either your username or the organization name.</li>
                      </ol>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Repository Name</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>This is the second part of the repo URL after the owner.</li>
                        <li>For <code>https://github.com/acme/ai-platform</code>, the repo name is <strong>ai-platform</strong>.</li>
                      </ol>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">GitHub Personal Access Token</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Go to{' '}
                          <a
                            href="https://github.com/settings/tokens?type=beta"
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 underline"
                          >
                            GitHub &gt; Settings &gt; Developer settings
                          </a>
                          .
                        </li>
                        <li>Create a new token (classic) with <strong>repo</strong> and <strong>workflow</strong> scopes.</li>
                        <li>Copy the token and store it safely—GitHub only shows it once.</li>
                        <li>Paste it into the GitHub token field above.</li>
                      </ol>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Branch Prefix (optional)</p>
                      <p>
                        Customize how AI-created branches are named. We default to <code>ai-generated</code>, so branches become{' '}
                        <code>ai-generated/PROJ-123</code>.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="repoOwner" className="block text-sm font-medium text-gray-700 mb-2">
                      Repository Owner *
                    </label>
                    <input
                      type="text"
                      id="repoOwner"
                      required
                      value={githubData.repoOwner}
                      onChange={(e) => setGithubData({ ...githubData, repoOwner: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="username or organization"
                    />
                  </div>

                  <div>
                    <label htmlFor="repoName" className="block text-sm font-medium text-gray-700 mb-2">
                      Repository Name *
                    </label>
                    <input
                      type="text"
                      id="repoName"
                      required
                      value={githubData.repoName}
                      onChange={(e) => setGithubData({ ...githubData, repoName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="repository-name"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="githubAccessToken" className="block text-sm font-medium text-gray-700 mb-2">
                    GitHub Personal Access Token {githubConfig && '(Leave empty to keep existing)'}
                  </label>
                  <input
                    type="password"
                    id="githubAccessToken"
                    value={githubData.accessToken}
                    onChange={(e) => setGithubData({ ...githubData, accessToken: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Your GitHub personal access token"
                  />
                </div>

                <div>
                  <label htmlFor="branchPrefix" className="block text-sm font-medium text-gray-700 mb-2">
                    Branch Prefix
                  </label>
                  <input
                    type="text"
                    id="branchPrefix"
                    value={githubData.branchPrefix}
                    onChange={(e) => setGithubData({ ...githubData, branchPrefix: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ai-generated"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Branches will be created as {githubData.branchPrefix}/task-id
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoMerge"
                    checked={githubData.autoMerge}
                    onChange={(e) => setGithubData({ ...githubData, autoMerge: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="autoMerge" className="ml-2 block text-sm text-gray-900">
                    Automatically merge PRs after approval
                  </label>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={configureGitHubMutation.isPending}
                    className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {configureGitHubMutation.isPending ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

