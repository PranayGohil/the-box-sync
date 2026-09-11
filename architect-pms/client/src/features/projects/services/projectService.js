import { fetchAPI, fetchFormDataAPI } from '../../../services/api';

export const getProjects = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return await fetchAPI(`/projects${query ? `?${query}` : ''}`);
};

export const getProjectById = async (id) => {
  return await fetchAPI(`/projects/${id}`);
};

export const createProject = async (formData) => {
  return await fetchFormDataAPI('/projects', 'POST', formData);
};

export const updateProjectStatus = async (id, status, remark) => {
  return await fetchAPI(`/projects/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, remark }),
  });
};
