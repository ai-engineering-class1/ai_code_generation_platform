import apiClient from '../api'

// Upload OpenSpec
export const uploadOpenSpec = async (projectId: string, file: File) => {
    const formData = new FormData();
    formData.append('openspecFile', file);

    const response = await apiClient.post(`/openspec/projects/${projectId}/upload`, formData, {
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
    data: { content: string; suggestions?: any[] }
) => {
    const response = await apiClient.put(`/openspec/projects/${projectId}/specs/${specId}`, data);
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
