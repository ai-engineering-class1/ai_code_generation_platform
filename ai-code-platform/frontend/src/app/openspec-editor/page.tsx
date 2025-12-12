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
    const [selectedSpecId, setSelectedSpecId] = useState<string | undefined>(undefined);
    const [selectedSpec, setSelectedSpec] = useState<Specification | undefined>(undefined);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

    // UI State
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [showTerminal, setShowTerminal] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

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
            owner: 'DrLinAITeam2', // In real app, get from auth context
            repository: 'simplest-repo',
            isPrivate: true,
            specTree: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // In a real app, we would fetch existing project details here
        // api.getProject(id).then(...)
        setProject(defaultProject);

        // Fetch Task Details if taskId is present
        if (pId && tId) {
            const fetchTaskDetails = async () => {
                try {
                    // Fetch task details using generic API client
                    // Assuming endpoint /projects/{projectId}/tasks/{taskId} exists as per previous context
                    const response = await apiClient.get(`/projects/${pId}/tasks/${tId}`);
                    if (response.data) {
                        setTaskDescription(response.data.description || 'No description available for this task.');

                        // Also update project name/owner/repo if available in response or separate call
                        // For now we just stick to what we have, or maybe mapped from task
                        if (response.data.project) {
                            setProject(prev => prev ? {
                                ...prev,
                                projectName: response.data.project.name,
                                owner: 'owner', // would come from project details
                                repository: 'repo'
                            } : undefined);
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch task details", error);
                    toast.error("Could not load task details");
                }
            };
            fetchTaskDetails();
        }

    }, [searchParams]);

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
                    <span className="font-bold text-gray-700 text-lg">OpenSpec Editor</span>
                    {project?.projectName && (
                        <span className="text-gray-400 text-sm">/ {project.projectName}</span>
                    )}
                </div>
                {/* Could add user profile here if not in main layout */}
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
                    onSave={handleSaveSpec}
                    onGenerateSuggestions={handleGenerateSuggestions}
                    suggestions={suggestions}
                    isLoading={isLoading}
                />

                <Dashboard
                    project={project}
                    taskDescription={taskDescription}
                    onProjectChange={handleProjectChange}
                    onGenerateCode={() => setShowGenerateModal(true)}
                    onExport={() => typeof window !== 'undefined' && window.print()} // Placeholder
                    onOpenTerminal={() => setShowTerminal(true)}
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

            <Terminal isOpen={showTerminal} onClose={() => setShowTerminal(false)} />

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
