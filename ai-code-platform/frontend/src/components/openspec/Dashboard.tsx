'use client';

import {
    ArrowLeft,
    Settings,
    Play,
    Users,
    UserPlus,
    Code2,
    Download,
    Lock,
    Unlock,
    FileText
} from 'lucide-react';
import { OpenSpecProject, Task } from '@/lib/types/openspec';

interface DashboardProps {
    project?: OpenSpecProject;
    task?: Task;
    taskDescription?: string; // Keep for fallback or easier passing if full task obj not available
    onProjectChange: (field: string, value: string | boolean) => void;
    onGenerateCode: () => void;
    onOpenTerminal: () => void;
    isGenerating: boolean;
    isReadOnly?: boolean;
    className?: string;
}

export default function Dashboard({
    project,
    task,
    taskDescription,
    onProjectChange,
    onGenerateCode,
    onOpenTerminal,
    isGenerating,
    isReadOnly = false,
    className = ''
}: DashboardProps) {

    // Helper for formatting date
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    const description = task?.description || taskDescription;

    return (
        <aside className={`w-72 bg-white border-l border-gray-200 flex flex-col h-full overflow-y-auto ${className}`}>

            {/* Task Context */}
            {(task || description) && (
                <div className="border-b border-gray-200">
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                        <h3 className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            <FileText className="w-3 h-3" />
                            Task
                        </h3>
                    </div>
                    <div className="p-4 space-y-4">
                        {description && (
                            <div>
                                <label className="block text-xs font-medium text-blue-600 mb-1">
                                    Task Description
                                </label>
                                <p className="text-sm text-gray-900 whitespace-pre-wrap max-h-40 overflow-y-auto font-sans">
                                    {description}
                                </p>
                            </div>
                        )}

                        {task && (
                            <>
                                <div>
                                    <label className="block text-xs font-medium text-blue-600 mb-1">
                                        Type
                                    </label>
                                    <p className="text-sm text-gray-900 capitalize font-sans">
                                        {task.type}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-blue-600 mb-1">
                                        Priority
                                    </label>
                                    <p className={`text-sm font-sans capitalize ${task.priority === 'high' || task.priority === 'critical' ? 'text-red-600' : 'text-gray-900'
                                        }`}>
                                        {task.priority || 'Medium'}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-blue-600 mb-1">
                                        Current Stage
                                    </label>
                                    <p className="text-sm text-gray-900 capitalize font-sans">
                                        {task.currentStage ? task.currentStage.replace(/_/g, ' ') : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-blue-600 mb-1">
                                        Assignee
                                    </label>
                                    <p className="text-sm text-gray-900 font-sans">
                                        {task.assigneeId || 'Unassigned'}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-blue-600 mb-1">
                                        Created Date
                                    </label>
                                    <p className="text-sm text-gray-900 font-sans">
                                        {formatDate(task.createdAt)}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Project Section */}
            <div className="border-b border-gray-200">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <h4 className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        <Settings className="w-3 h-3" />
                        Project
                    </h4>
                </div>

                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-blue-600 mb-1">
                            Project Name
                        </label>
                        <input
                            type="text"
                            value={project?.projectName || ''}
                            onChange={(e) => onProjectChange('projectName', e.target.value)}
                            placeholder="My Project"
                            disabled={isReadOnly}
                            className="w-full py-1 text-sm bg-transparent border-none outline-none focus:ring-0 px-0 text-gray-900 placeholder-gray-400 font-sans disabled:text-gray-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-blue-600 mb-1">
                            Repository Owner
                        </label>
                        <input
                            type="text"
                            value={project?.owner || ''}
                            onChange={(e) => onProjectChange('owner', e.target.value)}
                            placeholder="username"
                            disabled={isReadOnly}
                            className="w-full py-1 text-sm bg-transparent border-none outline-none focus:ring-0 px-0 text-gray-900 placeholder-gray-400 font-sans disabled:text-gray-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-blue-600 mb-1">
                            Repository Name
                        </label>
                        <input
                            type="text"
                            value={project?.repository || ''}
                            onChange={(e) => onProjectChange('repository', e.target.value)}
                            placeholder="my-repo"
                            disabled={isReadOnly}
                            className="w-full py-1 text-sm bg-transparent border-none outline-none focus:ring-0 px-0 text-gray-900 placeholder-gray-400 font-sans disabled:text-gray-500"
                        />
                    </div>
                </div>
            </div>

            {/* Collaboration */}
            <div className="border-b border-gray-200">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <h4 className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        <Users className="w-3 h-3" />
                        Collaboration
                    </h4>
                </div>

                <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <img
                            src={`https://ui-avatars.com/api/?name=${project?.owner || 'User'}&background=405189&color=fff`}
                            alt="User"
                            className="w-6 h-6 rounded-full"
                        />
                        <div className="flex-1">
                            <span className="block text-xs font-medium text-gray-800">
                                {project?.owner || 'Current User'}
                            </span>
                            <span className="block text-[10px] text-gray-500">Owner</span>
                        </div>
                    </div>
                </div>
            </div>
        </aside >
    );
}
