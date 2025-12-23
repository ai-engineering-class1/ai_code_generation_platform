import apiClient from '../api'

// Upload OpenSpec
export const uploadOpenSpec = async (projectId: string, file: File, taskId?: string) => {
    const formData = new FormData();
    formData.append('openspecFile', file);

    const url = taskId
        ? `/openspec/projects/${projectId}/upload?taskId=${taskId}`
        : `/openspec/projects/${projectId}/upload`;

    const response = await apiClient.post(url, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// Get Specification
export const getSpecification = async (projectId: string, specId: string) => {
    const response = await apiClient.get(`/openspec/projects/${projectId}/specs/${specId}`);
    return response.data;
};

// Update Specification
export const updateSpecification = async (
    projectId: string,
    specId: string,
    data: { content: string; suggestions?: any[] },
    taskId?: string
) => {
    const url = taskId
        ? `/openspec/projects/${projectId}/specs/${specId}?taskId=${taskId}`
        : `/openspec/projects/${projectId}/specs/${specId}`;
    const response = await apiClient.put(url, data);
    return response.data;
};

// Generate Suggestions
export const generateSuggestions = async (projectId: string, specId: string) => {
    const response = await apiClient.post(`/openspec/projects/${projectId}/specs/${specId}/suggestions`);
    return response.data;
};

// Generate Codebase
export const generateCodebase = async (projectId: string, branchName: string, prompt?: string) => {
    const response = await apiClient.post(`/openspec/projects/${projectId}/generate`, { branchName, prompt });
    return response.data;
};

// Get Task Status
export const getTaskStatus = async (taskId: string) => {
    const response = await apiClient.get(`/openspec/tasks/${taskId}/status`);
    return response.data;
};

// Update Project Context
export const updateProjectContext = async (projectId: string, context: { owner?: string; repository?: string }) => {
    const response = await apiClient.put(`/openspec/projects/${projectId}/context`, context);
    return response.data;
};

// Initialize from existing workspace
export const initFromWorkspace = async (projectId: string, taskId?: string) => {
    const url = taskId
        ? `/openspec/projects/${projectId}/init?taskId=${taskId}`
        : `/openspec/projects/${projectId}/init`;
    const response = await apiClient.get(url);
    return response.data;
};

// Push to GitHub
export const pushToGitHub = async (projectId: string, taskId?: string, branchName: string = 'openspec-changes') => {
    const url = taskId
        ? `/openspec/projects/${projectId}/push?taskId=${taskId}&branchName=${branchName}`
        : `/openspec/projects/${projectId}/push?branchName=${branchName}`;
    const response = await apiClient.post(url);
    return response.data;
};

// Export OpenSpec changes as zip
export const exportOpenSpecChanges = async (projectId: string, taskId?: string) => {
    const url = taskId
        ? `/openspec/projects/${projectId}/export?taskId=${taskId}`
        : `/openspec/projects/${projectId}/export`;
    const response = await apiClient.get(url, {
        responseType: 'blob',
    });
    return response.data;
};

// Get Activity Details
export const getActivity = async (activityId: string) => {
    const response = await apiClient.get(`/activities/${activityId}`);
    return response.data;
};
