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
import { OpenSpecProject } from '@/lib/types/openspec';

interface DashboardProps {
    project?: OpenSpecProject;
    taskDescription?: string;
    onProjectChange: (field: string, value: string | boolean) => void;
    onGenerateCode: () => void;
    onExport: () => void;
    onOpenTerminal: () => void;
    isGenerating: boolean;
    isReadOnly?: boolean;
}

export default function Dashboard({
    project,
    taskDescription,
    onProjectChange,
    onGenerateCode,
    onExport,
    onOpenTerminal,
    isGenerating,
    isReadOnly = false
}: DashboardProps) {

    return (
        <aside className="w-72 bg-white border-l border-gray-200 flex flex-col h-full overflow-y-auto">
            {/* Back to Task Button - Only shown when accessed from Task */}
            {isReadOnly && (
                <div className="p-4 pb-0">
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium"
                        title="Back to Task"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Task
                    </button>
                </div>
            )}

            {/* Task Context - Display if task description is provided */}
            {taskDescription && (
                <div className="p-4 border-b border-gray-200 bg-blue-50">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-800 uppercase tracking-wide mb-2 transition-colors">
                        <FileText className="w-4 h-4" />
                        Task Description
                    </h3>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {taskDescription}
                    </p>
                </div>
            )}

            <div className="p-4 border-b border-gray-200">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    <Settings className="w-4 h-4" />
                    Project Details
                </h3>
            </div>

            {/* Project Settings */}
            <div className="p-4 border-b border-gray-200">
                <h4 className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    <Settings className="w-3 h-3" />
                    Configurations
                </h4>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Project Name
                        </label>
                        <input
                            type="text"
                            value={project?.projectName || ''}
                            onChange={(e) => onProjectChange('projectName', e.target.value)}
                            placeholder="My Project"
                            disabled={isReadOnly}
                            className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${isReadOnly ? 'bg-gray-100 text-gray-500' : ''}`}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Repository Owner
                        </label>
                        <input
                            type="text"
                            value={project?.owner || ''}
                            onChange={(e) => onProjectChange('owner', e.target.value)}
                            placeholder="username"
                            disabled={isReadOnly}
                            className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${isReadOnly ? 'bg-gray-100 text-gray-500' : ''}`}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Repository Name
                        </label>
                        <input
                            type="text"
                            value={project?.repository || ''}
                            onChange={(e) => onProjectChange('repository', e.target.value)}
                            placeholder="my-repo"
                            disabled={isReadOnly}
                            className={`w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${isReadOnly ? 'bg-gray-100 text-gray-500' : ''}`}
                        />
                    </div>

                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                            type="checkbox"
                            checked={project?.isPrivate || false}
                            onChange={(e) => onProjectChange('isPrivate', e.target.checked)}
                            disabled={isReadOnly}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                        />
                        <span className="text-gray-700">Private Repository</span>
                        {project?.isPrivate ? <Lock className="w-3 h-3 text-gray-500" /> : <Unlock className="w-3 h-3 text-gray-500" />}
                    </label>
                </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-b border-gray-200">
                <h4 className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    <Play className="w-3 h-3" />
                    Actions
                </h4>

                <div className="space-y-2">
                    {/* Back to Task Button - Only shown when accessed from Task */}


                    <button
                        onClick={onExport}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Export Project
                    </button>


                </div>
            </div>

            {/* Collaboration */}
            <div className="p-4">
                <h4 className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    <Users className="w-3 h-3" />
                    Collaboration
                </h4>

                <div className="space-y-3">
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

                    <button className="flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
                        <UserPlus className="w-3 h-3" />
                        Add Collaborator
                    </button>
                </div>
            </div>
        </aside>
    );
}
