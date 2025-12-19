'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner';
import {
    OpenSpecProject,
    Specification,
    Suggestion,
    TaskStatus,
    Task
} from '@/lib/types/openspec';
import * as api from '@/lib/api/openspec';
import apiClient from '@/lib/api'; // Import general API client
import { ArrowLeft, Save, Download, UserPlus } from 'lucide-react';

// Components
import dynamic from 'next/dynamic';
import SpecTree from '@/components/openspec/SpecTree';
import Editor from '@/components/openspec/Editor';
import Dashboard from '@/components/openspec/Dashboard';
const Terminal = dynamic(() => import('@/components/openspec/Terminal'), { ssr: false });
import { UploadModal, GenerateCodeModal, LoadingOverlay } from '@/components/openspec/Modals';

function EditorContent() {
    // URL Params
    const searchParams = useSearchParams();
    const router = useRouter();

    // State
    const [projectId, setProjectId] = useState<string>('');
    const [taskId, setTaskId] = useState<string | null>(null);
    const [project, setProject] = useState<OpenSpecProject | undefined>(undefined);
    const [taskDescription, setTaskDescription] = useState<string>('');
    const [task, setTask] = useState<Task | undefined>(undefined);
    const [selectedSpecId, setSelectedSpecId] = useState<string | undefined>(undefined);
    const [selectedSpec, setSelectedSpec] = useState<Specification | undefined>(undefined);
    const [specContent, setSpecContent] = useState<string>('');
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

    // UI State
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [showTerminal, setShowTerminal] = useState(false);
    const [isTerminalConnected, setIsTerminalConnected] = useState(false);
    const [terminalKey, setTerminalKey] = useState(0);

    const handleOpenTerminal = () => {
        if (showTerminal && !isTerminalConnected) {
            // Restart terminal by forcing remount
            setTerminalKey(prev => prev + 1);
        }
        setShowTerminal(true);
    };

    const handleCloseTerminal = () => {
        if (isTerminalConnected) {
            if (window.confirm("The terminal is still running. Do you want to kill the process and close?")) {
                setShowTerminal(false);
            }
        } else {
            setShowTerminal(false);
        }
    };

    const handleSafeBack = () => {
        if (isTerminalConnected) {
            if (window.confirm("The terminal is still running. Do you want to kill the process and leave?")) {
                router.back();
            }
        } else {
            router.back();
        }
    };
    const [loadingMessage, setLoadingMessage] = useState('');

    // Warn before closing tab/window if terminal is connected
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isTerminalConnected) {
                e.preventDefault();
                e.returnValue = ''; // Standard for triggering browser confirmation
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isTerminalConnected]);

    // Initialize
    useEffect(() => {
        const pId = searchParams.get('projectId') || `draft-${new Date().getTime()}`;
        const tId = searchParams.get('taskId');
        setProjectId(pId);
        setTaskId(tId);

        // Define default project structure
        const defaultProject: OpenSpecProject = {
            id: pId,
            projectName: 'New OpenSpec Project',
            owner: 'user',
            repository: 'repo',
            isPrivate: true,
            specTree: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        // Initial set to avoid UI flicker
        setProject(defaultProject);

        const fetchData = async () => {
            if (!pId || pId.startsWith('draft-')) return;

            try {
                // 1. Fetch Project Details
                const projectRes = await apiClient.get(`/projects/${pId}`);
                const projectData = projectRes.data;

                // Default values
                let owner = 'user';
                let repo = 'repo';

                // Attempt to parse from project.github_repo_url
                if (projectData.github_repo_url) {
                    try {
                        const url = projectData.github_repo_url;
                        const cleanUrl = url.replace(/\.git$/, '').replace(/\/$/, '');
                        const parts = cleanUrl.split(/[\/:/]/); // Split by / or :

                        if (parts.length >= 2) {
                            const potentialRepo = parts[parts.length - 1];
                            const potentialOwner = parts[parts.length - 2];

                            if (potentialRepo && potentialOwner && potentialOwner !== 'github.com') {
                                owner = potentialOwner;
                                repo = potentialRepo;
                            }
                        }
                    } catch (e) {
                        console.warn("Failed to parse github_repo_url", e);
                    }
                }

                // IMMEDIATE UPDATE: Show sidebar with parsed data
                setProject(prev => prev ? {
                    ...prev,
                    projectName: projectData.name,
                    owner: owner,
                    repository: repo
                } : undefined);

                // 2. Fetch Tasks (Parallel-ish)
                if (tId) {
                    // Don't await strictly for the UI update above, but we can await here for sequential logic if needed
                    // Using promise to let it run
                    apiClient.get(`/projects/${pId}/tasks/${tId}`)
                        .then(taskRes => {
                            if (taskRes.data) {
                                setTaskDescription(taskRes.data.description || 'No description available for this task.');
                                setTask(taskRes.data);
                            }
                        })
                        .catch(err => console.error("Failed to load task", err));
                }

                // 3. Fetch GitHub Config (Background Update)
                try {
                    const githubRes = await apiClient.get(`/github/config/${pId}`);
                    if (githubRes.data) {
                        // Update with authoritative config
                        setProject(prev => prev ? {
                            ...prev,
                            owner: githubRes.data.repoOwner,
                            repository: githubRes.data.repoName
                        } : undefined);
                    }
                } catch (e) {
                    // Ignore if no github config
                }

            } catch (error) {
                console.error("Failed to load project data", error);
                toast.error("Could not load project details");
            }
        };

        fetchData();

    }, [searchParams]);

    // Sync content
    useEffect(() => {
        setSpecContent(selectedSpec?.content || '');
    }, [selectedSpec]);

    // Handlers

    const handleUpload = async (file: File) => {
        setIsLoading(true);
        setLoadingMessage('Uploading and processing OpenSpec...');
        try {
            const data = await api.uploadOpenSpec(projectId, file);

            // Update project with new tree
            setProject(prev => {
                if (!prev) return undefined;
                return {
                    ...prev,
                    specTree: data.specContent.specTree,
                    openspecFile: {
                        name: file.name,
                        path: data.specContent.rootSpec?.path || '', // Adjust based on backend response
                        uploadedAt: new Date().toISOString()
                    }
                };
            });

            setShowUploadModal(false);
            toast.success('OpenSpec uploaded successfully');
        } catch (error) {
            console.error(error);
            toast.error('Failed to upload OpenSpec file');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const handleSelectSpec = async (specId: string) => {
        setSelectedSpecId(specId);
        setIsLoading(true);
        try {
            const data = await api.getSpecification(projectId, specId);
            setSelectedSpec(data.spec);
            setSuggestions(data.spec.suggestions || []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load specification');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveSpec = async (content: string) => {
        if (!selectedSpecId) return;

        setIsLoading(true);
        try {
            await api.updateSpecification(projectId, selectedSpecId, {
                content,
                suggestions
            });

            // Update local state
            setSelectedSpec(prev => prev ? { ...prev, content } : undefined);

            // Update tree state (optional, if preview relies on tree content)
            // But content is fetched on select, so maybe not critical unless title changes

            toast.success('Saved successfully');
        } catch (error) {
            console.error(error);
            toast.error('Failed to save changes');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateSuggestions = async () => {
        if (!selectedSpecId) return;

        setIsLoading(true);
        try {
            const data = await api.generateSuggestions(projectId, selectedSpecId);
            setSuggestions(data.suggestions);
            toast.success('AI Suggestions generated');
        } catch (error) {
            console.error(error);
            toast.error('Failed to generate suggestions');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartImplementation = async (branchName: string, prompt: string) => {
        setIsGenerating(true);
        setShowGenerateModal(false);

        try {
            // 1. Ensure context is synced if users edited dashboard
            if (project) {
                await api.updateProjectContext(projectId, {
                    owner: project.owner,
                    repository: project.repository
                });
            }

            // 2. Trigger Generation
            toast.info(`Starting implementation on branch ${branchName}...`);
            await api.generateCodebase(projectId, branchName, prompt);

            toast.success('Implementation task started!');

            // 3. Redirect to Tasks page or similar
            // User requested workflow tracking on Task page
            // We might want to pass the taskId or just go to task list
            router.push('/tasks');

        } catch (error) {
            console.error(error);
            toast.error('Failed to start implementation');
            setIsGenerating(false);
        }
    };

    const handleProjectChange = (field: string, value: string | boolean) => {
        if (taskId) return; // Prevent changes if in Task context (Read Only)
        setProject(prev => {
            if (!prev) return undefined;
            return { ...prev, [field]: value };
        });
    };

    return (
        <div className="flex h-screen bg-gray-50 flex-col">
            <Toaster position="top-right" />

            {/* Header (Simplified if reusing main layout, but for standalone editor page) */}
            <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                    {taskId && (
                        <button
                            onClick={handleSafeBack}
                            className="mr-2 flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium"
                            title="Back to Task"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Back</span>
                        </button>
                    )}
                    <span className="font-bold text-gray-700 text-lg">OpenSpec Editor</span>
                    <span className="text-gray-500 text-sm font-medium ml-1">
                        {project?.projectName ? `/${project.projectName}` : ''}
                        {task?.title ? `/${task.title}` : ''}
                    </span>
                    {task?.status && (
                        <span className="ml-2 px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            {typeof task.status === 'string' ? task.status : 'pending'}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleSaveSpec(specContent)}
                        disabled={!selectedSpecId || isLoading}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-4 h-4" />
                        Save
                    </button>
                    <button
                        onClick={() => typeof window !== 'undefined' && window.print()}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    <button
                        onClick={() => toast.info('Invite feature coming soon')}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        <UserPlus className="w-4 h-4" />
                        Invite
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden">
                <SpecTree
                    specTree={project?.specTree || []}
                    selectedSpecId={selectedSpecId}
                    onSelectSpec={handleSelectSpec}
                    onUpload={() => setShowUploadModal(true)}
                />

                <Editor
                    specification={selectedSpec}
                    content={specContent}
                    onContentChange={setSpecContent}
                    onGenerateSuggestions={handleGenerateSuggestions}
                    suggestions={suggestions}
                    isLoading={isLoading}
                    onOpenTerminal={handleOpenTerminal}
                    isTerminalConnected={isTerminalConnected}
                />

                <Dashboard
                    project={project}
                    task={task}
                    taskDescription={taskDescription}
                    onProjectChange={handleProjectChange}

                    onGenerateCode={() => setShowGenerateModal(true)}
                    onOpenTerminal={handleOpenTerminal}
                    isGenerating={isGenerating}
                    isReadOnly={!!taskId}
                />
            </main>

            {/* Modals */}
            <UploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onUpload={handleUpload}
                isUploading={isLoading && loadingMessage.includes('Uploading')}
            />

            <GenerateCodeModal
                isOpen={showGenerateModal}
                onClose={() => setShowGenerateModal(false)}
                onGenerate={handleStartImplementation}
            />



            <Terminal
                key={terminalKey}
                isOpen={showTerminal}
                onClose={handleCloseTerminal}
                onStatusChange={setIsTerminalConnected}
            />

            {loadingMessage && <LoadingOverlay message={loadingMessage} />}
        </div>
    );
}

export default function OpenSpecEditorPage() {
    return (
        <Suspense fallback={<LoadingOverlay message="Loading Editor..." />}>
            <EditorContent />
        </Suspense>
    );
}
