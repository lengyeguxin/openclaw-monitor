import { API_BASE_URL } from './config';

// 通用 API 错误类
export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// 通用 API 客户端
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}/${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new ApiError(
        data.message || `请求失败: ${response.status}`,
        response.status,
        data.error || data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`网络错误: ${error.message}`, 0, error);
  }
}

// 智能体 API
export const agentApi = {
  getList: (params = {}) => apiRequest('agents', { params }),
  getById: (id) => apiRequest(`agents/${id}`),
  create: (data) => apiRequest('agents', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id, data) => apiRequest(`agents/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  statusReport: (id, data) => apiRequest(`agents/${id}/status-report`, { method: 'POST', body: JSON.stringify(data) }),
  batchImport: (data) => apiRequest('agents/batch-import', { method: 'POST', body: JSON.stringify(data) }),
};

// 项目 API
export const projectApi = {
  getList: (params = {}) => apiRequest('projects', { params }),
  getById: (id) => apiRequest(`projects/${id}`),
  create: (data) => apiRequest('projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`projects/${id}`, { method: 'DELETE' }),
};

// 阶段 API
export const stageApi = {
  getList: (projectId) => apiRequest(`projects/${projectId}/stages`),
  create: (projectId, data) => apiRequest(`projects/${projectId}/stages`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`stages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// 任务 API
export const taskApi = {
  getList: (params = {}) => apiRequest('tasks', { params }),
  getById: (id) => apiRequest(`tasks/${id}`),
  create: (data) => apiRequest('tasks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`tasks/${id}`, { method: 'DELETE' }),
  assign: (id, data) => apiRequest(`tasks/${id}/assign`, { method: 'POST', body: JSON.stringify(data) }),
  removeAgent: (id, agentId) => apiRequest(`tasks/${id}/agents/${agentId}`, { method: 'DELETE' }),
  progressReport: (id, data) => apiRequest(`tasks/${id}/progress-report`, { method: 'POST', body: JSON.stringify(data) }),
};
