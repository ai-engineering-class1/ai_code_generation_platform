/**
 * TypeScript types for OpenSpec Editor
 */

export interface OpenSpecProject {
    id: string;
    projectName: string;
    description?: string;
    owner: string;
    repository: string;
    isPrivate: boolean;
    specTree: Specification[];
    currentSpec?: Specification | null;
    createdAt: string;
    updatedAt: string;
    openspecFile?: {
        name: string;
        path: string;
        uploadedAt: string;
    };
}

export interface Specification {
    id: string;
    name: string;
    path: string;
    type: 'specification' | 'change' | 'directory' | 'file';
    content: string;
    children: Specification[];
    suggestions: Suggestion[];
}

export interface Suggestion {
    id: string;
    content: string;
}

export interface TaskStatus {
    step: string;
    message: string;
    completed: boolean;
    error?: boolean;
}

export interface Task {
    id: string;
    projectId: string;
    title?: string;
    description?: string;
    type?: string;
    priority?: string;
    currentStage?: string;
    assigneeId?: string;
    status: TaskStatus | string; // Allow string as well since backend might return simple status string
    createdAt: string;
    updatedAt: string;
}

export type TabType = 'specification' | 'preview' | 'suggestions' | 'terminal';
